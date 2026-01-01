import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Session } from '../features/focus/types'; // Updated import
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { TimeLedger } from '../services/storage/TimeLedger';

// Types
export interface SessionConfig {
    workDuration: number; // minutes
    shortBreak: number;   // minutes
    longBreak: number;    // minutes
}

// 1. Dispatch Context (Stable Actions)
export interface FocusDispatchContextType {
    startSession: (taskId: string, config?: Partial<SessionConfig>) => void;
    switchTask: (taskId: string) => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    discardSession: () => void;
    setPlaylistContext: (playlistId: string, queue: string[]) => void;
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

    // Persist Config
    useEffect(() => {
        localStorageAdapter.setItem('time_tracker_session_config', sessionConfig);
    }, [sessionConfig]);

    // Interval Ref for the Heartbeat
    const timerRef = useRef<number | null>(null);

    // (Removed Lifecycle Effect for Hydration - replaced by Lazy Init)

    // 2. Heartbeat (Timer Logic)
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
                const next = Math.max(0, prev - 1);

                // --- Auto-Stop Logic ---
                if (next === 0) {
                    setIsPaused(true);
                }
                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession, isPaused]);

    // 3. Persistence Helper (Throttle later?)
    const persistActiveSession = (session: Session | null, currentTimeLeft: number, paused: boolean) => {
        if (session) {
            const updated: Session = {
                ...session,
                remainingTime: currentTimeLeft,
                status: paused ? 'paused' : 'active'
            };
            localStorageAdapter.setItem(ACTIVE_SESSION_KEY, updated);
        } else {
            localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);
        }
    };

    const persistSuspended = (sessions: Record<string, Session>) => {
        localStorageAdapter.setItem(SUSPENDED_SESSIONS_KEY, sessions);
    };

    // Save on Pause/Unpause
    useEffect(() => {
        persistActiveSession(activeSession, timeLeft, isPaused);
    }, [activeSession, timeLeft, isPaused]);


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


    const startSession = useCallback((taskId: string, config?: Partial<SessionConfig>) => {
        // 1. Suspend Old (if any)
        if (activeSession) {
            suspendAndLog(activeSession, timeLeft);
        }

        setSuspendedSessions(prev => {
            const existing = prev[taskId];

            if (existing) {
                // RESUME
                const resumeTime = existing.remainingTime ?? (sessionConfig.workDuration * 60);

                const resumedSession = {
                    ...existing,
                    startTime: new Date().toISOString(),
                    status: 'active' as const
                };

                setActiveSession(resumedSession);
                setTimeLeft(resumeTime);
                setIsPaused(false);

                // Remove from suspended (moved to active)
                const next = { ...prev };
                delete next[taskId];
                persistSuspended(next);
                return next;
            } else {
                // FRESH START
                const finalConfig = { ...sessionConfig, ...config };
                const durationSec = finalConfig.workDuration * 60;

                const newSession: Session = {
                    id: crypto.randomUUID(),
                    taskId,
                    startTime: new Date().toISOString(),
                    duration: 0,
                    remainingTime: durationSec,
                    status: 'active',
                    config: {
                        mode: 'focus',
                        duration: finalConfig.workDuration
                    }
                };

                setActiveSession(newSession);
                setTimeLeft(durationSec);
                setIsPaused(false);
                return prev; // No change to suspended map
            }
        });
    }, [activeSession, timeLeft, sessionConfig, suspendAndLog]);

    const switchTask = useCallback((taskId: string) => {
        if (activeSession?.taskId === taskId) return;

        // 1. Suspend Current
        if (activeSession) {
            suspendAndLog(activeSession, timeLeft);
        }

        // 2. Resume Target or Start New
        const existingSession = suspendedSessions[taskId];

        if (existingSession) {
            // RESUME (Paused)
            setActiveSession(existingSession);
            setTimeLeft(existingSession.remainingTime || 0);
            setIsPaused(true);
        } else {
            // NEW (Paused)
            const durationSec = sessionConfig.workDuration * 60;
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
        }

    }, [activeSession, timeLeft, suspendedSessions, sessionConfig, suspendAndLog]);

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
                startTime: activeSession.startTime, // Should be segment start? activeSession.startTime is session start?
                // activeSession.startTime is when the session object was created/resumed.
                // Since we update activeSession on pause/resume, this should be correct segment start.
                duration: delta,
                type: 'auto',
                note: 'Session Paused'
            });
        }

        // 2. Update State (Reset measurement baseline)
        setActiveSession(prev => prev ? ({
            ...prev,
            status: 'paused',
            remainingTime: timeLeft, // Critical: Next delta starts from here
            // Update startTime to now? No, startTime is creation. 
            // Ideally we should update startTime on Resume.
            // But for now, ensuring remainingTime is updated separates the segments.
        }) : null);

        setIsPaused(true);
    }, [activeSession, timeLeft]);

    const resumeSession = useCallback(() => {
        if (timeLeft > 0) {
            // Update session start time for the new segment
            setActiveSession(prev => prev ? ({
                ...prev,
                status: 'active',
                startTime: new Date().toISOString()
            }) : null);
            setIsPaused(false);
        }
    }, [timeLeft]);

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

        // Also remove from suspended if somehow there
        setSuspendedSessions(prev => {
            const next = { ...prev };
            delete next[activeSession.taskId];
            persistSuspended(next);
            return next;
        });
    }, [activeSession, timeLeft]);

    const discardSession = useCallback(() => {
        if (!activeSession) return;

        setActiveSession(null);
        setTimeLeft(0);
        setIsPaused(true);
        localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);

        setSuspendedSessions(prev => {
            const next = { ...prev };
            delete next[activeSession.taskId];
            persistSuspended(next);
            return next;
        });
    }, [activeSession]);

    // Playlist
    const setPlaylistContext = useCallback((playlistId: string, queue: string[]) => {
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
                                mode: 'focus',
                                duration: sessionConfig.workDuration
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
