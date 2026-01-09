import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TimeLedger } from '../services/storage/TimeLedger';
import { useStorage } from './StorageContext';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { timeService } from '../services/time/TimeService';
import { TimeServiceConfig } from '../services/time/TimeServiceConfig';
import { normalizeTimestamp } from '../utils/timeUtils';
import { versionManager } from '../services/sync/VersionManager';
import { getVersion } from '../types/sync';
import { useToast } from '../components/ui/ToastContext';

// --- State Definition ---
interface SimpleTimerState {
    taskId: string;
    startTime: number | Timestamp;
}

interface SimpleTimerContextType {
    activeTimer: SimpleTimerState | null;
    startSimpleTimer: (taskId: string) => Promise<void>;
    stopSimpleTimer: () => Promise<void>;
    elapsedTime: number;
}

const SimpleTimerContext = createContext<SimpleTimerContextType | null>(null);

const SYNC_KEY = 'simple_timer_state';
const DEBOUNCE_MS = 500;

export const ActiveTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const storage = useStorage();
    const { showToast } = useToast();

    // 1. Persistent State
    const [activeTimer, setActiveTimer] = useState<SimpleTimerState | null>(null);

    // 2. Reactive Tick (for UI display)
    const [elapsedTime, setElapsedTime] = useState(0);

    // 3. For UI rollback on error
    const previousStateRef = useRef<SimpleTimerState | null>(null);

    // 4. Ref-based subscription tracking (fixes async cleanup race)
    const subscriptionIdRef = useRef(0);
    const subscriptionRef = useRef<(() => void) | null>(null);

    // 5. Per-action debounce refs
    const lastStartTimeRef = useRef(0);
    const lastStopTimeRef = useRef(0);

    // 6. Remote update lockout - ignore remote updates for 300ms after local action
    const localActionTimeRef = useRef(0);
    const REMOTE_LOCKOUT_MS = 300;

    // ==================== CLOUD SYNC ====================
    useEffect(() => {
        const adapter = storage as any;
        if (!adapter.subscribeToSimpleTimer) return;

        const currentId = ++subscriptionIdRef.current;

        const setupSubscription = async () => {
            try {
                const unsubFn = await adapter.subscribeToSimpleTimer(
                    (remoteInfo: { value: any; readTime: number } | null) => {
                        // Stale subscription check
                        if (currentId !== subscriptionIdRef.current) return;

                        // LOCKOUT: Ignore remote updates for 300ms after local action
                        // This prevents UI flash when Firestore echoes back our own action
                        if (Date.now() - localActionTimeRef.current < REMOTE_LOCKOUT_MS) {
                            console.log('[SimpleTimer] Ignoring remote update during lockout');
                            return;
                        }

                        // NULL handling
                        if (!remoteInfo) {
                            const { apply, reason } = versionManager.shouldApplyRemoteNull(SYNC_KEY);
                            if (import.meta.env.DEV) console.log(`[SimpleTimer] Null: ${reason}`);
                            if (apply) {
                                setActiveTimer(null);
                                previousStateRef.current = null;
                            }
                            return;
                        }

                        const remoteState = remoteInfo.value as SimpleTimerState;

                        // CRITICAL: Reject updates with null/undefined startTime
                        // This happens when serverTimestamp() hasn't resolved yet (pending write)
                        const remoteStartTime = normalizeTimestamp(remoteState?.startTime);
                        if (remoteStartTime === 0) {
                            console.log('[SimpleTimer] Rejecting update with null startTime (pending write)');
                            return;
                        }

                        const { apply, reason, isConflict } = versionManager.shouldApplyRemote(
                            SYNC_KEY,
                            getVersion(remoteState),
                            (remoteState as any)?._updatedAt,
                            (remoteState as any)?._deviceId
                        );

                        if (import.meta.env.DEV) console.log(`[SimpleTimer] v${getVersion(remoteState)}: ${reason}`);

                        if (!apply) return;

                        // Show toast only for real conflicts
                        if (isConflict && reason === 'same_version_newer_timestamp') {
                            showToast({ message: 'Synced from another device', type: 'info' });
                        }

                        setActiveTimer(remoteState);

                        // Keep previousRef in sync with remote updates
                        previousStateRef.current = remoteState;
                    }
                );

                // Only set ref if this is still the current subscription
                if (currentId === subscriptionIdRef.current) {
                    subscriptionRef.current = unsubFn;
                } else {
                    // Subscription is stale, clean it up
                    unsubFn?.();
                }
            } catch (error) {
                console.error('[SimpleTimer] Subscription failed:', error);
            }
        };

        setupSubscription();

        return () => {
            subscriptionIdRef.current++;
            subscriptionRef.current?.();
            subscriptionRef.current = null;
        };
    }, [storage, showToast]);

    // ==================== TICK LOOP ====================
    useEffect(() => {
        if (!activeTimer) {
            setElapsedTime(0);
            return;
        }

        const start = normalizeTimestamp(activeTimer.startTime);

        // DEBUG: Log what we're working with
        console.log('[SimpleTimer TICK] startTime raw:', activeTimer.startTime, 'normalized:', start);

        // If start is 0 or invalid, don't update elapsed (wait for proper value)
        if (start === 0) {
            console.log('[SimpleTimer TICK] startTime is invalid, skipping');
            return;
        }

        setElapsedTime(timeService.getTrustedTime() - start);

        const interval = setInterval(() => {
            setElapsedTime(timeService.getTrustedTime() - start);
        }, TimeServiceConfig.SIMPLE_TIMER_UPDATE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [activeTimer]);

    // ==================== VISIBILITY HANDLER (v4.1) ====================
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && activeTimer) {
                // Recalculate elapsed time on tab focus
                const start = normalizeTimestamp(activeTimer.startTime);
                setElapsedTime(timeService.getTrustedTime() - start);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTimer]);

    // ==================== OFFSET CHANGE HANDLER ====================
    // Recalculate elapsed time when TimeService offset changes (fixes cross-device sync lag)
    useEffect(() => {
        if (!activeTimer) return;

        const unsubscribe = timeService.onOffsetChange(() => {
            const start = normalizeTimestamp(activeTimer.startTime);
            if (start > 0) {
                console.log('[SimpleTimer] Offset changed, recalculating elapsed time');
                setElapsedTime(timeService.getTrustedTime() - start);
            }
        });

        return unsubscribe;
    }, [activeTimer]);

    // ==================== START ====================
    const startSimpleTimer = useCallback(async (taskId: string) => {
        // FIX: Don't overwrite if timer already running on same task
        if (activeTimer?.taskId === taskId) {
            console.log('[SimpleTimer] Timer already running on this task, skipping start');
            return;
        }

        // Debounce check
        const now = Date.now();
        if (now - lastStartTimeRef.current < DEBOUNCE_MS) return;
        lastStartTimeRef.current = now;

        // Lock out remote updates to prevent UI flash
        localActionTimeRef.current = now;

        // Wait for queue
        try {
            await versionManager.enqueue(SYNC_KEY, 'write');
        } catch (e) {
            console.error('[SimpleTimer] Queue error:', e);
            showToast({ message: 'Please try again', type: 'error' });
            return;
        }

        // Save previous state for rollback
        const rollbackState = previousStateRef.current;

        const optimisticStart = timeService.getTrustedTime();
        const newState: SimpleTimerState = { taskId, startTime: optimisticStart };

        // Optimistic update
        setActiveTimer(newState);
        previousStateRef.current = newState;

        // Cloud write with version
        const versionMeta = versionManager.getVersionMeta(SYNC_KEY);
        const adapter = storage as any;

        if (adapter.setItem) {
            try {
                await adapter.setItem(SYNC_KEY, {
                    taskId,
                    startTime: Timestamp.fromMillis(timeService.getTrustedTime()),
                    ...versionMeta
                });
                versionManager.confirmWrite(SYNC_KEY);
            } catch (error) {
                console.error('[SimpleTimer] Sync failed:', error);
                // ROLLBACK
                setActiveTimer(rollbackState);
                previousStateRef.current = rollbackState;
                versionManager.abortPending(SYNC_KEY);
                showToast({ message: 'Failed to start timer', type: 'error' });
            }
        }
    }, [storage, showToast, activeTimer?.taskId]);

    // ==================== STOP ====================
    const stopSimpleTimer = useCallback(async () => {
        if (!activeTimer) return;

        // Debounce check
        const now = Date.now();
        if (now - lastStopTimeRef.current < DEBOUNCE_MS) return;
        lastStopTimeRef.current = now;

        // Lock out remote updates to prevent UI flash
        localActionTimeRef.current = now;

        // Wait for queue
        try {
            await versionManager.enqueue(SYNC_KEY, 'delete');
        } catch (e) {
            console.error('[SimpleTimer] Queue error:', e);
            showToast({ message: 'Please try again', type: 'error' });
            return;
        }

        // Save for rollback
        const rollbackState = activeTimer;
        const savedTimer = activeTimer;

        // Calculate duration BEFORE clearing
        const serverTimeNow = timeService.getTrustedTime();
        const start = normalizeTimestamp(activeTimer.startTime);
        const duration = Math.max(0, Math.floor((serverTimeNow - start) / 1000));

        // Optimistic update
        setActiveTimer(null);
        previousStateRef.current = null;
        setElapsedTime(0);

        // Cloud clear
        versionManager.prepareDelete(SYNC_KEY);
        const adapter = storage as any;

        if (adapter.removeItem) {
            try {
                await adapter.removeItem(SYNC_KEY);
                versionManager.confirmDelete(SYNC_KEY);

                // Save to ledger AFTER cloud confirm (prevents duplicates on rollback)
                if (duration > 0) {
                    TimeLedger.saveLog({
                        id: crypto.randomUUID(),
                        taskId: savedTimer.taskId,
                        startTime: new Date(start).toISOString(),
                        duration,
                        type: 'manual',
                        note: 'Simple Timer Stop'
                    });
                }
            } catch (error) {
                console.error('[SimpleTimer] Sync failed:', error);
                // ROLLBACK (no ledger entry created)
                setActiveTimer(rollbackState);
                previousStateRef.current = rollbackState;
                versionManager.abortPending(SYNC_KEY);
                showToast({ message: 'Failed to stop timer', type: 'error' });
            }
        } else if (adapter.setItem) {
            // Fallback: use setItem with null
            try {
                await adapter.setItem(SYNC_KEY, null);
                versionManager.confirmDelete(SYNC_KEY);

                if (duration > 0) {
                    TimeLedger.saveLog({
                        id: crypto.randomUUID(),
                        taskId: savedTimer.taskId,
                        startTime: new Date(start).toISOString(),
                        duration,
                        type: 'manual',
                        note: 'Simple Timer Stop'
                    });
                }
            } catch (error) {
                console.error('[SimpleTimer] Sync failed:', error);
                setActiveTimer(rollbackState);
                previousStateRef.current = rollbackState;
                versionManager.abortPending(SYNC_KEY);
                showToast({ message: 'Failed to stop timer', type: 'error' });
            }
        }
    }, [activeTimer, storage, showToast]);

    return (
        <SimpleTimerContext.Provider value={{
            activeTimer: activeTimer ? {
                ...activeTimer,
                startTime: normalizeTimestamp(activeTimer.startTime) || Date.now()
            } : null,
            startSimpleTimer,
            stopSimpleTimer,
            elapsedTime
        }}>
            {children}
        </SimpleTimerContext.Provider>
    );
};

// Hook alias
export const useSimpleTimer = () => {
    const context = useContext(SimpleTimerContext);
    if (!context) throw new Error('useSimpleTimer must be used within ActiveTimerProvider');
    return context;
};

// Legacy exports
export const useActiveTimer = () => {
    return { activeTimers: {}, startTimer: () => { }, stopTimer: () => { } };
};
export const useActiveTimerTick = () => 0;
export const useActiveTaskDuration = (task: any) => task.cachedTotalTime || 0;
