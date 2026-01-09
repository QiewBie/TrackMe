/**
 * SessionContext - React wrapper for SessionService
 * 
 * Provides session state and computed values (elapsed, remaining) to UI.
 * Handles 1Hz tick for timer display.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { sessionService, CloudSession, SessionConfig } from '../services/session/SessionService';
import { useAuth } from './AuthContext';

// === CONTEXT TYPES ===

interface SessionContextValue {
    // State (from Firestore)
    session: CloudSession | null;

    // Computed (updated every second)
    elapsed: number;      // Seconds since session started
    remaining: number;    // Seconds until target duration

    // Derived
    isRunning: boolean;
    isPaused: boolean;
    hasSession: boolean;

    // Actions
    start: (taskId: string, config: SessionConfig, playlistId?: string | null, queue?: string[]) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
    switchTask: (taskId: string) => Promise<void>;
    setPlaylist: (playlistId: string | null, queue: string[]) => Promise<void>;
    updateQueue: (queue: string[]) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// === PROVIDER ===

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // State from Firestore subscription
    const [session, setSession] = useState<CloudSession | null>(null);

    // Computed values (updated by tick)
    const [elapsed, setElapsed] = useState(0);
    const [remaining, setRemaining] = useState(0);

    // Refs for tick stability
    const tickRef = useRef<number | null>(null);

    // === INITIALIZATION ===
    useEffect(() => {
        if (!user) {
            sessionService.cleanup();
            setSession(null);
            setElapsed(0);
            setRemaining(0);
            return;
        }

        sessionService.initialize(user.id);

        return () => {
            sessionService.cleanup();
        };
    }, [user?.id]);

    // === SUBSCRIPTION ===
    useEffect(() => {
        if (!user || user.id === 'guest') return;

        const unsubscribe = sessionService.subscribe((newSession) => {
            setSession(newSession);

            // Immediately compute values
            if (newSession) {
                const el = sessionService.getElapsed();
                const rem = Math.max(0, newSession.targetDuration - el);
                setElapsed(el);
                setRemaining(rem);
            } else {
                setElapsed(0);
                setRemaining(0);
            }
        });

        return unsubscribe;
    }, [user?.id]);

    // === TICK (1Hz) ===
    useEffect(() => {
        if (!session || session.status !== 'running') {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
            return;
        }

        // Start ticking
        const tick = () => {
            const el = sessionService.getElapsed();
            const rem = Math.max(0, session.targetDuration - el);
            setElapsed(el);
            setRemaining(rem);
        };

        tick(); // Immediate
        tickRef.current = window.setInterval(tick, 1000);

        return () => {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
        };
    }, [session?.status, session?.startTime?.toMillis()]);

    // === ACTIONS (wrappers with error handling) ===
    const start = useCallback(async (taskId: string, config: SessionConfig, playlistId?: string | null, queue?: string[]) => {
        try {
            await sessionService.start(taskId, config, playlistId, queue);
        } catch (error) {
            console.error('[Session] Start failed:', error);
            throw error; // Re-throw so calling code can handle
        }
    }, []);

    const pause = useCallback(async () => {
        try {
            await sessionService.pause();
        } catch (error) {
            console.error('[Session] Pause failed:', error);
            throw error;
        }
    }, []);

    const resume = useCallback(async () => {
        try {
            await sessionService.resume();
        } catch (error) {
            console.error('[Session] Resume failed:', error);
            throw error;
        }
    }, []);

    const stop = useCallback(async () => {
        try {
            await sessionService.stop();
        } catch (error) {
            console.error('[Session] Stop failed:', error);
            throw error;
        }
    }, []);

    const switchTask = useCallback(async (taskId: string) => {
        try {
            await sessionService.switchTask(taskId);
        } catch (error) {
            console.error('[Session] Switch task failed:', error);
            throw error;
        }
    }, []);

    const setPlaylist = useCallback(async (playlistId: string | null, queue: string[]) => {
        try {
            await sessionService.setPlaylist(playlistId, queue);
        } catch (error) {
            console.error('[Session] Set playlist failed:', error);
            throw error;
        }
    }, []);

    const updateQueue = useCallback(async (queue: string[]) => {
        try {
            await sessionService.updateQueue(queue);
        } catch (error) {
            console.error('[Session] Update queue failed:', error);
            throw error;
        }
    }, []);

    // === VALUE ===
    const value: SessionContextValue = {
        session,
        elapsed,
        remaining,
        isRunning: session?.status === 'running',
        isPaused: session?.status === 'paused',
        hasSession: session !== null,
        start,
        pause,
        resume,
        stop,
        switchTask,
        setPlaylist,
        updateQueue
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

// === HOOK ===

export const useSession = (): SessionContextValue => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return context;
};

// === SELECTOR HOOKS (for performance) ===

/**
 * Only re-renders when session task changes
 */
export const useSessionTask = () => {
    const { session } = useSession();
    return session?.taskId ?? null;
};

/**
 * Only re-renders when running state changes
 */
export const useSessionStatus = () => {
    const { isRunning, isPaused, hasSession } = useSession();
    return { isRunning, isPaused, hasSession };
};
