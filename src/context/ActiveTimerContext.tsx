import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TimeLedger } from '../services/storage/TimeLedger';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';

// --- State Definition ---
interface SimpleTimerState {
    taskId: string;
    startTime: number; // Timestamp in ms
}

interface SimpleTimerContextType {
    activeTimer: SimpleTimerState | null;
    startSimpleTimer: (taskId: string) => void;
    stopSimpleTimer: () => Promise<void>;
    elapsedTime: number; // Reactive milliseconds for UI
}

const SimpleTimerContext = createContext<SimpleTimerContextType | null>(null);

const STORAGE_KEY = 'simple_timer_state';

export const ActiveTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Persistent State
    const [activeTimer, setActiveTimer] = useState<SimpleTimerState | null>(() => {
        return localStorageAdapter.getItem<SimpleTimerState>(STORAGE_KEY);
    });

    // 2. Reactive Tick (for UI display)
    const [elapsedTime, setElapsedTime] = useState(0);
    const rafRef = useRef<number | null>(null);

    // Persistence Effect
    useEffect(() => {
        if (activeTimer) {
            localStorageAdapter.setItem(STORAGE_KEY, activeTimer);
        } else {
            localStorageAdapter.removeItem(STORAGE_KEY);
        }
    }, [activeTimer]);

    // Tick Loop (Only runs when active)
    useEffect(() => {
        if (!activeTimer) {
            setElapsedTime(0);
            return;
        }

        const tick = () => {
            const now = Date.now();
            setElapsedTime(now - activeTimer.startTime);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [activeTimer]);

    // --- Actions ---

    const startSimpleTimer = useCallback((taskId: string) => {
        // If another timer is running, stop it first (implicit switch)
        if (activeTimer) {
            // Synchronous switch logic usually requires stopping first.
            // But for simple timer, we can just overwrite start time if we want 'reset',
            // OR we should log the previous one.
            // Let's enforce 'stop first' logic in the Global Orchestrator,
            // but here we ensure we don't overwrite blindly without logging?
            // "SimpleTimer" usually implies just one.
            // Let's do a safe switch: Stop current, Start new.

            // NOTE: We can't await `stopSimpleTimer` easily inside a sync `start`.
            // So we'll assume the interaction layer handles stopping.
            // But as a failsafe, if we overwrite, we LOSE the data of the previous one.
            // IMPROVEMENT: Auto-log flush here?
            const now = Date.now();
            const duration = Math.max(0, Math.floor((now - activeTimer.startTime) / 1000));
            if (duration > 0) {
                TimeLedger.saveLog({
                    id: crypto.randomUUID(),
                    taskId: activeTimer.taskId,
                    startTime: new Date(activeTimer.startTime).toISOString(),
                    duration: duration,
                    type: 'manual',
                    note: 'Auto-switch'
                });
            }
        }

        const newState = {
            taskId,
            startTime: Date.now()
        };
        setActiveTimer(newState);
    }, [activeTimer]);

    const stopSimpleTimer = useCallback(async () => {
        if (!activeTimer) return;

        const now = Date.now();
        const duration = Math.max(0, Math.floor((now - activeTimer.startTime) / 1000));

        // 1. Save to Ledger
        if (duration > 0) {
            TimeLedger.saveLog({
                id: crypto.randomUUID(),
                taskId: activeTimer.taskId,
                startTime: new Date(activeTimer.startTime).toISOString(),
                duration: duration,
                type: 'manual',
                note: 'Simple Timer Stop'
            });
        }

        // 2. Clear State
        setActiveTimer(null);
        setElapsedTime(0);
    }, [activeTimer]);


    return (
        <SimpleTimerContext.Provider value={{
            activeTimer,
            startSimpleTimer,
            stopSimpleTimer,
            elapsedTime
        }}>
            {children}
        </SimpleTimerContext.Provider>
    );
};

// Hook alias - Keeping the import name simple or migrating?
// Let's export as `useSimpleTimer` but keep file name `ActiveTimerContext` for now.
export const useSimpleTimer = () => {
    const context = useContext(SimpleTimerContext);
    if (!context) throw new Error('useSimpleTimer must be used within ActiveTimerProvider');
    return context;
};

// Legacy exports to prevent crash until full rewire is done (Phase 11 Step 3)
// We will remove these once we fix the imports in step 3.
export const useActiveTimer = () => {
    // console.warn('Usage of legacy useActiveTimer detected');
    return { activeTimers: {}, startTimer: () => { }, stopTimer: () => { } };
};
export const useActiveTimerTick = () => 0;
export const useActiveTaskDuration = (task: any) => task.cachedTotalTime || 0;

