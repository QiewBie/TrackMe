import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '../types/models';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { TimeLedger } from '../services/storage/TimeLedger';

// Types
export interface SessionConfig {
    workDuration: number; // minutes
    shortBreak: number;   // minutes
    longBreak: number;    // minutes
}

interface FocusSessionContextType {
    // State
    activeSession: Session | null;
    suspendedSessions: Record<string, Session>; // Map<TaskId, Session>
    timeLeft: number;
    isPaused: boolean;
    sessionStatus: 'idle' | 'focus' | 'break';

    // History
    sessionsHistory: Session[];

    // Playlist Context (Keep for compatibility)
    activePlaylistId: string | null;
    sessionQueue: string[];

    // Actions
    startSession: (taskId: string, config?: Partial<SessionConfig>) => void;

    // CRITICAL: The hot-swap method
    switchTask: (taskId: string) => void;

    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    discardSession: () => void;

    setPlaylistContext: (playlistId: string, queue: string[]) => void;
    updateQueue: (queue: string[]) => void;

    // Config
    sessionConfig: SessionConfig;
    updateSessionConfig: (config: Partial<SessionConfig>) => void;
}

const FocusSessionContext = createContext<FocusSessionContextType | undefined>(undefined);

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
    // --- State ---
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [suspendedSessions, setSuspendedSessions] = useState<Record<string, Session>>({});

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(true);

    const [sessionsHistory, setSessionsHistory] = useState<Session[]>([]);
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
    const [sessionQueue, setSessionQueue] = useState<string[]>([]);

    // Config State
    const [sessionConfig, setSessionConfig] = useState<SessionConfig>(DEFAULT_CONFIG);

    // Interval Ref for the Heartbeat
    const timerRef = useRef<number | null>(null);

    // 1. Storage & Hydration
    useEffect(() => {
        // Load Active Session
        const storedActive = localStorageAdapter.getItem<Session>(ACTIVE_SESSION_KEY);
        if (storedActive) {
            setActiveSession(storedActive);
            // Restore Time Left and Status
            if (storedActive.remainingTime !== undefined) {
                setTimeLeft(storedActive.remainingTime);
            }
            if (storedActive.status === 'active') {
                setIsPaused(false);
            } else {
                setIsPaused(true);
            }
        }

        // Load Suspended Sessions
        const storedSuspended = localStorageAdapter.getItem<Record<string, Session>>(SUSPENDED_SESSIONS_KEY);
        if (storedSuspended) {
            setSuspendedSessions(storedSuspended);
        }

        // Load Playlist State
        const storedPlaylistStr = localStorage.getItem(PLAYLIST_STATE_KEY);
        if (storedPlaylistStr) {
            try {
                const { playlistId, queue } = JSON.parse(storedPlaylistStr);
                if (playlistId) setActivePlaylistId(playlistId);
                if (Array.isArray(queue)) setSessionQueue(queue);
            } catch (e) {
                console.error("Failed to parse stored playlist state", e);
            }
        }

        // Load History
        const history = localStorageAdapter.getItem<Session[]>(SESSIONS_KEY) || [];
        setSessionsHistory(history);
    }, []);

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
        // Calculate time spent in *this specific active segment*
        // We rely on the fact that when we started/resumed, we set activeSession.remainingTime
        // to the correct value (either full duration or resumed value).
        // So Delta = StartRemaining - EndRemaining.

        const startRemaining = session.remainingTime ?? (session.config?.duration ? session.config.duration * 60 : 0);
        const delta = Math.max(0, startRemaining - currentTimeLeft);

        // A. Log the Delta (so Dashboard updates immediately)
        if (delta > 0) {
            TimeLedger.saveLog({
                id: crypto.randomUUID(),
                taskId: session.taskId,
                startTime: session.startTime, // Technically this is start of segment. Ideally should be Now - Delta? 
                // But reusing session.startTime is "okay" if we just care about aggregation.
                // Better: we don't care about precise timestamp of log, just the duration.
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
            // Update startTime to now so next resume treats it as a new segment? 
            // Or keep original start? 
            // Better: update 'remainingTime' is enough for our logic.
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

        // 2. Start Request
        // If startSession is called explicitly (e.g. "Play" button on task list), 
        // we check if we should RESUME or START FRESH.
        // Convention: If undefined config, assume RESUME preference if exists.
        // If config is provided (e.g. user changed settings), maybe fresh?
        // Let's check suspended first.

        setSuspendedSessions(prev => {
            const existing = prev[taskId];

            // If we found a suspended session and we are NOT forced to overwrite (logic decision)
            // For now, let's say: generic startSession always resumes if possible unless logic says otherwise?
            // Actually, usually "Play" on a task with progress means Resume.

            if (existing) {
                // RESUME
                // We must ensure its remainingTime is valid.
                const resumeTime = existing.remainingTime ?? (sessionConfig.workDuration * 60);

                // We need to set activeSession to this existing one.
                // BUT we need to update its 'startTime' so the log calculation makes sense later 
                // (though our logic uses remainingTime diff so start doesn't matter much for math, only metadata).

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
                return prev; // No change to suspended map (except we verified it didnt exist)
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
        // Logic similar to startSession but we don't start immediately?
        // switchTask is usually used by FocusView to swap context. 
        // FocusView mounts and likely calls resumeSession() or checks state.

        // Let's see if we have it suspended
        const existingSession = suspendedSessions[taskId];

        if (existingSession) {
            // RESUME (Paused)
            setActiveSession(existingSession);
            setTimeLeft(existingSession.remainingTime || 0);
            setIsPaused(true); // Switch usually starts paused? Or should it auto-play?
            // User asked for "Resume session", so let's keep it paused until they click play?
            // OR if they clicked "Play" on dashboard, it calls startSession not switchTask.
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

    // 4. React to Config Changes (Retroactively update fresh sessions)
    useEffect(() => {
        const workDurationSec = sessionConfig.workDuration * 60;

        // A. Update Active Session if it's fresh and in focus mode
        if (activeSession && activeSession.config?.mode === 'focus') {
            const currentTotal = activeSession.config.duration * 60;

            // Check against timeLeft state for active session
            if (timeLeft === currentTotal) {
                // It's fresh. Update to new config.
                setActiveSession(prev => {
                    if (!prev || !prev.config) return prev;
                    return {
                        ...prev,
                        remainingTime: workDurationSec,
                        config: {
                            ...prev.config,
                            mode: 'focus', // Explicitly set to satisfy type
                            duration: sessionConfig.workDuration
                        }
                    };
                });
                setTimeLeft(workDurationSec);
            }
        }

        // B. Update Suspended Sessions if they are fresh
        // We need to check if we need to update state to avoid loops?
        // JSON.stringify comparison might be heavy, but safe.
        setSuspendedSessions(prev => {
            let hasChanges = false;
            const next = { ...prev };

            Object.keys(next).forEach(taskId => {
                const s = next[taskId];
                if (s.config?.mode === 'focus') {
                    const sTotal = s.config.duration * 60;
                    if (s.remainingTime === sTotal) {
                        // Fresh
                        next[taskId] = {
                            ...s,
                            remainingTime: workDurationSec,
                            config: {
                                ...s.config,
                                mode: 'focus', // Explicitly set
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

    }, [sessionConfig.workDuration]); // Only trigger on duration change

    const updateSessionConfig = useCallback((newConfig: Partial<SessionConfig>) => {
        setSessionConfig(prev => ({ ...prev, ...newConfig }));
    }, []);

    const pauseSession = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resumeSession = useCallback(() => {
        if (timeLeft > 0) setIsPaused(false);
    }, [timeLeft]);

    const stopSession = useCallback(() => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();

        // Calculate Delta for valid stats
        // Same logic as suspendAndLog
        const startRemaining = activeSession.remainingTime ?? (activeSession.config?.duration ? activeSession.config.duration * 60 : 0);
        const delta = Math.max(0, startRemaining - timeLeft);

        const completedSession: Session = {
            ...activeSession,
            endTime,
            duration: delta, // Store only the delta of this segment? Or total? 
            // The 'Session' object in history tracks a single continuous session (usually).
            // If we are multi-segment, the history might be confusing.
            // BUT 'sessionsHistory' is legacy. The real truth is TimeLedger.
            // Let's store delta here too for consistency.
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

    return (
        <FocusSessionContext.Provider value={{
            activeSession,
            suspendedSessions,
            timeLeft,
            isPaused,
            sessionStatus: activeSession ? 'focus' : 'idle',
            sessionsHistory,
            activePlaylistId,
            sessionQueue,
            startSession,
            switchTask,
            pauseSession,
            resumeSession,
            stopSession,
            discardSession,
            setPlaylistContext,
            updateQueue,
            sessionConfig,
            updateSessionConfig
        }}>
            {children}
        </FocusSessionContext.Provider>
    );
};

export const useFocusContext = () => {
    const context = useContext(FocusSessionContext);
    if (!context) {
        throw new Error('useFocusContext must be used within a FocusSessionProvider');
    }
    return context;
};
