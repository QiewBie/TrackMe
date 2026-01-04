import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Session } from '../features/focus/types';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { TimeLedger } from '../services/storage/TimeLedger';
import { FirestoreAdapter } from '../services/storage/FirestoreAdapter'; // Import Adapter Class
import { useAuth } from './AuthContext'; // Need Auth for UserID

// Types
export interface SessionConfig {
    workDuration: number; // minutes
    shortBreak: number;   // minutes
    longBreak: number;    // minutes
}

// 1. Dispatch Context (Stable Actions)
export interface FocusDispatchContextType {
    startSession: (taskId: string, options?: { config?: Partial<SessionConfig>, mode?: 'focus' | 'break', duration?: number }) => void;
    switchTask: (taskId: string) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    discardSession: () => void;
    setPlaylistContext: (playlistId: string | null, queue: string[]) => void;
    updateQueue: (queue: string[]) => void;
    updateSessionConfig: (config: Partial<SessionConfig>) => void;
}

// 2. State Context (Structural State - Updates on interactions)
export interface FocusStateContextType {
    activeSession: Session | null;
    suspendedSessions: Record<string, Session>;
    isPaused: boolean;
    sessionStatus: 'idle' | 'focus' | 'break';
    sessionsHistory: Session[];
    activePlaylistId: string | null;
    sessionQueue: string[];
    sessionConfig: SessionConfig;
}

// 3. Tick Context (Volatile State - Updates 1Hz)
export type FocusTickContextType = number; // timeLeft

export const FocusDispatchContext = createContext<FocusDispatchContextType | undefined>(undefined);
export const FocusStateContext = createContext<FocusStateContextType | undefined>(undefined);
export const FocusTickContext = createContext<FocusTickContextType | undefined>(undefined);

const ACTIVE_SESSION_KEY = 'time_tracker_active_session';
const SUSPENDED_SESSIONS_KEY = 'time_tracker_suspended_sessions';
const SESSIONS_KEY = 'time_tracker_sessions';
const PLAYLIST_STATE_KEY = 'time_tracker_session_playlist';

const DEFAULT_CONFIG: SessionConfig = {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15
};

export const FocusSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // Create Adapter Memoized
    // Create Adapter Memoized (Local-Only for Guest)
    const firestoreAdapter = useMemo(() => {
        if (!user || user.id === 'guest') return null;
        return new FirestoreAdapter(user.id);
    }, [user]);

    // --- State & Hydration (Lazy Initializers) ---

    // 1. Active Session
    const [activeSession, setActiveSession] = useState<Session | null>(() => {
        return localStorageAdapter.getItem<Session>(ACTIVE_SESSION_KEY);
    });

    // 2. Suspended Sessions
    const [suspendedSessions, setSuspendedSessions] = useState<Record<string, Session>>(() => {
        return localStorageAdapter.getItem<Record<string, Session>>(SUSPENDED_SESSIONS_KEY) || {};
    });

    // 3. Time Left (Derived from Active)
    const [timeLeft, setTimeLeft] = useState<number>(() => {
        const stored = localStorageAdapter.getItem<Session>(ACTIVE_SESSION_KEY);
        return stored?.remainingTime ?? 0;
    });

    // 4. Paused Status (Derived from Active)
    const [isPaused, setIsPaused] = useState<boolean>(() => {
        const stored = localStorageAdapter.getItem<Session>(ACTIVE_SESSION_KEY);
        if (stored && stored.status === 'active') return false;
        return true;
    });

    // 5. History
    const [sessionsHistory, setSessionsHistory] = useState<Session[]>(() => {
        return localStorageAdapter.getItem<Session[]>(SESSIONS_KEY) || [];
    });

    // 6. Playlist State
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => {
        try {
            const str = localStorage.getItem(PLAYLIST_STATE_KEY);
            if (str) return JSON.parse(str).playlistId;
        } catch (e) { console.error(e); }
        return null;
    });

    const [sessionQueue, setSessionQueue] = useState<string[]>(() => {
        try {
            const str = localStorage.getItem(PLAYLIST_STATE_KEY);
            if (str) return JSON.parse(str).queue || [];
        } catch (e) { console.error(e); }
        return [];
    });

    // Config State
    const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => {
        const stored = localStorageAdapter.getItem<SessionConfig>('time_tracker_session_config');
        return stored || DEFAULT_CONFIG;
    });

    // Persist Config (Local + Cloud)
    useEffect(() => {
        localStorageAdapter.setItem('time_tracker_session_config', sessionConfig);
        if (firestoreAdapter) {
            firestoreAdapter.setItem('focus_config', sessionConfig);
        }
    }, [sessionConfig, firestoreAdapter]);

    // Interval Ref for the Heartbeat
    const timerRef = useRef<number | null>(null);

    // --- PHASE 16: DRIFT PREVENTION LOGIC ---
    // Instead of decrementing, we calculate from a stable 'targetTime'
    // But since our session model stores 'remainingTime', we need to adapt.
    // Ideally: When starting/resuming, we set a 'localTargetTime' = Date.now() + remainingTime * 1000
    // Then tick updates timeLeft = Math.max(0, Math.ceil((localTargetTime - Date.now()) / 1000))
    // We need to store 'localTargetTime' in a Ref so it survives re-renders but doesn't trigger them.
    const localTargetTimeRef = useRef<number | null>(null);

    // Update Target on Resume/Start
    useEffect(() => {
        if (activeSession && !isPaused) {
            localTargetTimeRef.current = Date.now() + (timeLeft * 1000);
        } else {
            localTargetTimeRef.current = null;
        }
    }, [isPaused, activeSession?.id]); // Only reocalc on status change or session change

    // 2. Heartbeat (Timer Logic - DRIFT PROOF)
    useEffect(() => {
        if (!activeSession || isPaused) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Timer is running
        timerRef.current = window.setInterval(() => {
            setTimeLeft((prev) => {
                // If we have a target time, use it for strict accuracy
                if (localTargetTimeRef.current) {
                    const diff = localTargetTimeRef.current - Date.now();
                    const next = Math.max(0, Math.ceil(diff / 1000));

                    if (next === 0) {
                        setIsPaused(true);
                        localTargetTimeRef.current = null;
                    }
                    return next;
                }

                // Fallback (shouldn't happen active session is verified)
                return Math.max(0, prev - 1);
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession, isPaused]);

    // 3. Persistence Helper (Throttle later?)
    const persistActiveSession = useCallback((session: Session | null, currentTimeLeft: number, paused: boolean) => {
        if (session) {
            const updated: Session = {
                ...session,
                remainingTime: currentTimeLeft,
                status: paused ? 'paused' : 'active'
            };
            localStorageAdapter.setItem(ACTIVE_SESSION_KEY, updated);

            // Cloud Sync (Debounce? For now direct, Firestore SDK handles some batching)
            // Critical: Don't sync every second tick. Sync only significant state changes (Pause/Resume/Stop)
            // or periodically.
            // For MVP: We only call firestoreAdapter.saveActiveSession explicitly in actions (Pause/Resume/Start/Stop)
            // BUT: If the browser crashes, we might lose the 'current progress' on other devices.
            // Tradeoff: We won't sync 'timeLeft' every second to cloud. We sync it on Pause.
            // If user looks at phone while PC timer running, they see "Active", but time might be static until PC syncs?
            // "Active" state is enough for Handoff.
        } else {
            localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);
            // firestoreAdapter.saveActiveSession(null) handled in actions
        }
    }, []);

    const persistSuspended = (sessions: Record<string, Session>) => {
        localStorageAdapter.setItem(SUSPENDED_SESSIONS_KEY, sessions);
    };

    // Save on Pause/Unpause (Local)
    useEffect(() => {
        persistActiveSession(activeSession, timeLeft, isPaused);
    }, [activeSession, timeLeft, isPaused, persistActiveSession]);

    // --- CLOUD SYNC: REMOTE LISTENERS ---
    useEffect(() => {
        if (!firestoreAdapter) return;

        // 1. Listen to Active Session Changes (Handoff)
        const unsubscribeSession = firestoreAdapter.subscribeToActiveSession((remoteSession) => {
            // Logic: standard "Last Write Wins" handled by Firestore. 
            // Here we need to update local state IF it differs significantly.

            if (!remoteSession) {
                // Remote says IDLE.
                // If we are active locally, it means another device Stopped the session?
                // Or we just started and haven't synced yet?
                // Safety: Only stop if we are not the one who just started. 
                // Hard to distinguish without 'deviceId'.
                // For MVP: If remote is null, and we are active, we trust Local (assuming we are the source of truth if active).
                // BUT: if I stopped it on Phone, PC should stop.
                // WE NEED A TIMESTAMP check.
                return;
            }

            // If remote has a session
            if (remoteSession.id !== activeSession?.id || remoteSession.status !== activeSession?.status) {
                // Remote change detected.
                // E.g. I paused on Phone. PC sees 'paused'.
                console.log('[FocusSession] Remote session update:', remoteSession);
                setActiveSession(remoteSession);
                setTimeLeft(remoteSession.remainingTime ?? 0);
                setIsPaused(remoteSession.status !== 'active');
                // Reset target ref so we re-drift fix from new time
                localTargetTimeRef.current = null;
            }
        });

        // 2. Listen to Config
        // (Optional for MVP, but good for consistency)
        // const unsubscribeConfig = ...

        return () => {
            unsubscribeSession.then(unsub => unsub && unsub());
        };
    }, [firestoreAdapter, activeSession?.id, activeSession?.status]);


    // 5. Actions

    // 4. Persistence Helpers

    /**
     * "Smart Suspend":
     * 1. Saves the time elapsed in this *segment* to TimeLedger (for stats).
     * 2. Saves the current 'remainingTime' to suspendedSessions (for resume).
     */
    const suspendAndLog = useCallback((session: Session, currentTimeLeft: number) => {
        const startRemaining = session.remainingTime ?? (session.config?.duration ? session.config.duration * 60 : 0);
        const delta = Math.max(0, startRemaining - currentTimeLeft);

        // A. Log the Delta (so Dashboard updates immediately)
        if (delta > 0) {
            TimeLedger.saveLog({
                id: crypto.randomUUID(),
                taskId: session.taskId,
                startTime: session.startTime,
                duration: delta,
                type: 'auto',
                note: 'Session Paused/Switched'
            });
        }

        // B. Update Suspended State (for Resume)
        const suspended: Session = {
            ...session,
            remainingTime: currentTimeLeft,
            status: 'paused',
        };

        setSuspendedSessions(prev => {
            const next = { ...prev, [session.taskId]: suspended };
            persistSuspended(next);
            return next;
        });

    }, []);


    // Updated startSession to support flexible Mode and Duration
    const startSession = useCallback((taskId: string, options?: { config?: Partial<SessionConfig>, mode?: 'focus' | 'break', duration?: number }) => {
        // 1. Suspend Old (if any)
        if (activeSession) {
            suspendAndLog(activeSession, timeLeft);
        }

        const handleNewSession = (newSession: Session) => {
            setActiveSession(newSession);
            // Fix: Fallback to 0 if undefined
            setTimeLeft(newSession.remainingTime ?? 0);
            setIsPaused(false);
            if (firestoreAdapter) firestoreAdapter.saveActiveSession(newSession); // Cloud Sync
        };

        setSuspendedSessions(prev => {
            const existing = prev[taskId];

            if (existing) {
                // RESUME
                // Check if we are forcibly starting a NEW mode (e.g. switching from Focus to Break on same task)
                // If existing session is 'focus' but we requested 'break', we should probably NOT resume the old focus session?
                // For now, simplicity: Resume if exists, else New. 
                // BUT: "Take a Break" while Focus is Suspended?
                // The prompt "Take a Break" happens after completion (so old session is GONE). 
                // So this logic holds: If existing, it means we paused it. 

                const resumeTime = existing.remainingTime ?? (sessionConfig.workDuration * 60);

                const resumedSession = {
                    ...existing,
                    startTime: new Date().toISOString(),
                    status: 'active' as const,
                    remainingTime: resumeTime
                };

                handleNewSession(resumedSession);

                // Remove from suspended (moved to active)
                const next = { ...prev };
                delete next[taskId];
                persistSuspended(next);
                return next;
            } else {
                // FRESH START
                const mergedConfig = { ...sessionConfig, ...options?.config };

                // Determine Mode and Duration
                // Priority: Explicit Option > Config
                const mode = options?.mode || 'focus';
                const baseDuration = options?.duration || (mode === 'break' ? mergedConfig.shortBreak : mergedConfig.workDuration);

                // Safety: Ensure at least 1 minute
                const finalDuration = Math.max(1, baseDuration);
                const durationSec = finalDuration * 60;

                const newSession: Session = {
                    id: crypto.randomUUID(),
                    taskId,
                    startTime: new Date().toISOString(),
                    duration: 0,
                    remainingTime: durationSec,
                    status: 'active',
                    config: {
                        mode: mode,
                        duration: finalDuration
                    }
                };

                // Fix: Ensure remainingTime is passed correctly
                handleNewSession(newSession);
                return prev; // No change to suspended map
            }
        });
    }, [activeSession, timeLeft, sessionConfig, suspendAndLog, firestoreAdapter]);

    const switchTask = useCallback((taskId: string) => {
        if (activeSession?.taskId === taskId) return;

        // GLOBAL TIMER LOGIC:
        // When switching tasks, we want to maintain the "Global Pomodoro Timer" ONLY if we are in FOCUS mode.
        // If we represent a "Break", and switch to a task, we imply "Start Working". 
        // We should not inherit the Break timer as Work time.

        const isBreak = activeSession?.config?.mode === 'break';
        let globalTimeLeft = isBreak ? 0 : timeLeft; // Reset if break, else keep.

        // 1. Suspend Current
        if (activeSession) {
            suspendAndLog(activeSession, timeLeft);
        } else {
            // If no active session, check if we have a "suspended global state"? 
            // For now, if no active session, we start fresh (or use task's own if exists).
            // But if the user was just "Paused", timeLeft might be valid?
            // If activeSession is null, timeLeft is 0 (set in stopSession).
            // So standard logic applies.
        }

        // 2. Resume Target or Start New
        const existingSession = suspendedSessions[taskId];

        if (existingSession) {
            // RESUME (Paused) - BUT OVERRIDE TIME
            // We discard the 'existingSession.remainingTime' because the Global Timer rules.
            const continuedSession = {
                ...existingSession,
                remainingTime: globalTimeLeft > 0 ? globalTimeLeft : existingSession.remainingTime
            };

            setActiveSession(continuedSession);
            setTimeLeft(continuedSession.remainingTime || 0);
            setIsPaused(true); // Keep it paused for safety, or auto-resume? User usually expects pause on switch.
            if (firestoreAdapter) firestoreAdapter.saveActiveSession({ ...continuedSession, status: 'paused' });
        } else {
            // NEW (Paused) - INHERIT TIME
            // If globalTimeLeft is 0 (fresh start), use config.
            // If we are switching MID-SESSION, use globalTimeLeft.

            const durationSec = globalTimeLeft > 0 ? globalTimeLeft : sessionConfig.workDuration * 60;

            const newSession: Session = {
                id: crypto.randomUUID(),
                taskId,
                startTime: new Date().toISOString(),
                duration: 0,
                remainingTime: durationSec,
                status: 'paused',
                config: {
                    mode: 'focus',
                    duration: sessionConfig.workDuration
                }
            };
            setActiveSession(newSession);
            setTimeLeft(durationSec);
            setIsPaused(true);
            if (firestoreAdapter) firestoreAdapter.saveActiveSession(newSession);
        }

    }, [activeSession, timeLeft, suspendedSessions, sessionConfig, suspendAndLog, firestoreAdapter]);

    const updateSessionConfig = useCallback((newConfig: Partial<SessionConfig>) => {
        setSessionConfig(prev => ({ ...prev, ...newConfig }));
    }, []);

    const pauseSession = useCallback(() => {
        if (!activeSession) return;

        // 1. Log Delta (Commit current segment)
        const startRemaining = activeSession.remainingTime ?? (activeSession.config?.duration ? activeSession.config.duration * 60 : 0);
        const delta = Math.max(0, startRemaining - timeLeft);

        if (delta > 0) {
            TimeLedger.saveLog({
                id: crypto.randomUUID(),
                taskId: activeSession.taskId,
                startTime: activeSession.startTime,
                duration: delta,
                type: 'auto',
                note: 'Session Paused'
            });
        }

        // 2. Update State (Reset measurement baseline)
        const pausedSession: Session = {
            ...activeSession,
            status: 'paused',
            remainingTime: timeLeft,
        };

        setActiveSession(pausedSession);
        setIsPaused(true);
        if (firestoreAdapter) firestoreAdapter.saveActiveSession(pausedSession); // Cloud Sync

    }, [activeSession, timeLeft, firestoreAdapter]);

    const resumeSession = useCallback(() => {
        if (timeLeft > 0) {
            // Update session start time for the new segment
            const resumedSession: Session = activeSession ? {
                ...activeSession,
                status: 'active',
                startTime: new Date().toISOString()
            } : null as any; // Should not happen if check logic exists

            if (resumedSession) {
                setActiveSession(resumedSession);
                setIsPaused(false);
                if (firestoreAdapter) firestoreAdapter.saveActiveSession(resumedSession); // Cloud Sync
            }
        }
    }, [timeLeft, activeSession, firestoreAdapter]);

    const stopSession = useCallback(() => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();
        const startRemaining = activeSession.remainingTime ?? (activeSession.config?.duration ? activeSession.config.duration * 60 : 0);
        const delta = Math.max(0, startRemaining - timeLeft);

        const completedSession: Session = {
            ...activeSession,
            endTime,
            duration: delta,
            status: 'completed',
            remainingTime: 0
        };

        setSessionsHistory(prev => {
            const updated = [...prev, completedSession];
            localStorageAdapter.setItem(SESSIONS_KEY, updated);
            return updated;
        });

        // Save to TimeLedger
        if (delta > 0) {
            TimeLedger.saveLog({
                id: crypto.randomUUID(),
                taskId: activeSession.taskId,
                startTime: activeSession.startTime,
                duration: delta,
                type: 'auto',
                note: 'Session Completed'
            });
        }

        setActiveSession(null);
        setTimeLeft(0);
        setIsPaused(true);
        localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);
        if (firestoreAdapter) firestoreAdapter.saveActiveSession(null); // Cloud Sync: Clear active session

        // Also remove from suspended if somehow there
        setSuspendedSessions(prev => {
            const next = { ...prev };
            delete next[activeSession.taskId];
            persistSuspended(next);
            return next;
        });
    }, [activeSession, timeLeft, firestoreAdapter]);

    const discardSession = useCallback(() => {
        if (!activeSession) return;

        setActiveSession(null);
        setTimeLeft(0);
        setIsPaused(true);
        localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);
        if (firestoreAdapter) firestoreAdapter.saveActiveSession(null); // Cloud Sync

        setSuspendedSessions(prev => {
            const next = { ...prev };
            delete next[activeSession.taskId];
            persistSuspended(next);
            return next;
        });
    }, [activeSession, firestoreAdapter]);

    // Playlist
    const setPlaylistContext = useCallback((playlistId: string | null, queue: string[]) => {
        setActivePlaylistId(playlistId);
        setSessionQueue(queue);
        localStorage.setItem(PLAYLIST_STATE_KEY, JSON.stringify({ playlistId, queue }));
    }, []);

    const updateQueue = useCallback((newQueue: string[]) => {
        setSessionQueue(newQueue);
        if (activePlaylistId) {
            localStorage.setItem(PLAYLIST_STATE_KEY, JSON.stringify({ playlistId: activePlaylistId, queue: newQueue }));
        }
    }, [activePlaylistId]);

    // React to Config Changes (Retroactively update fresh sessions)
    useEffect(() => {
        const workDurationSec = sessionConfig.workDuration * 60;

        // A. Update Active Session if it's fresh and in focus mode
        if (activeSession && activeSession.config?.mode === 'focus') {
            const currentTotal = activeSession.config.duration * 60;
            if (timeLeft === currentTotal) {
                // Fresh
                setActiveSession(prev => {
                    if (!prev || !prev.config) return prev;
                    return {
                        ...prev,
                        remainingTime: workDurationSec,
                        config: {
                            ...prev.config,
                            mode: 'focus',
                            duration: sessionConfig.workDuration
                        }
                    };
                });
                setTimeLeft(workDurationSec);
            }
        }

        // B. Update Suspended Sessions
        setSuspendedSessions(prev => {
            let hasChanges = false;
            const next = { ...prev };

            Object.keys(next).forEach(taskId => {
                const s = next[taskId];
                if (s.config?.mode === 'focus') {
                    const sTotal = s.config.duration * 60;
                    if (s.remainingTime === sTotal) {
                        next[taskId] = {
                            ...s,
                            remainingTime: workDurationSec,
                            config: {
                                ...s.config,
                                ...{ duration: sessionConfig.workDuration } // Safety spread
                            }
                        };
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                persistSuspended(next);
                return next;
            }
            return prev;
        });

    }, [sessionConfig.workDuration]);

    // --- Memoize & Provide ---

    const dispatchValue = useMemo(() => ({
        startSession, switchTask, pauseSession, resumeSession, stopSession, discardSession,
        setPlaylistContext, updateQueue, updateSessionConfig
    }), [startSession, switchTask, pauseSession, resumeSession, stopSession, discardSession, setPlaylistContext, updateQueue, updateSessionConfig]);

    const stateValue = useMemo(() => ({
        activeSession, suspendedSessions, isPaused,
        sessionStatus: activeSession ? 'focus' : 'idle' as 'idle' | 'focus' | 'break',
        sessionsHistory, activePlaylistId, sessionQueue, sessionConfig
    }), [activeSession, suspendedSessions, isPaused, sessionsHistory, activePlaylistId, sessionQueue, sessionConfig]);

    return (
        <FocusDispatchContext.Provider value={dispatchValue}>
            <FocusStateContext.Provider value={stateValue}>
                <FocusTickContext.Provider value={timeLeft}>
                    {children}
                </FocusTickContext.Provider>
            </FocusStateContext.Provider>
        </FocusDispatchContext.Provider>
    );
};

// --- Hooks ---

export const useFocusDispatch = () => {
    const context = useContext(FocusDispatchContext);
    if (!context) throw new Error('useFocusDispatch must be used within a FocusSessionProvider');
    return context;
};

export const useFocusState = () => {
    const context = useContext(FocusStateContext);
    if (!context) throw new Error('useFocusState must be used within a FocusSessionProvider');
    return context;
};

export const useFocusTick = () => {
    const context = useContext(FocusTickContext);
    if (context === undefined) throw new Error('useFocusTick must be used within a FocusSessionProvider');
    return context;
};

// Legacy Wrapper for backward compatibility (Plan V3.1)
export const useFocusContext = () => {
    const dispatch = useFocusDispatch();
    const state = useFocusState();
    const tick = useFocusTick();
    return { ...state, ...dispatch, timeLeft: tick };
};
