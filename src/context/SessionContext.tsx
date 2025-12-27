import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '../types/models';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';

interface SessionContextType {
    activeSession: Session | null;
    sessionsHistory: Session[]; // Exposed for Analytics
    activePlaylistId: string | null;
    sessionQueue: string[];
    startSession: (taskId: string, playlistId?: string, queue?: string[]) => void;
    stopSession: () => void;
    discardSession: () => void;
    setPlaylistContext: (playlistId: string, queue: string[]) => void;
    updateQueue: (queue: string[]) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const ACTIVE_SESSION_KEY = 'time_tracker_active_session';
const SESSIONS_KEY = 'time_tracker_sessions';
const PLAYLIST_STATE_KEY = 'time_tracker_session_playlist';

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [sessionsHistory, setSessionsHistory] = useState<Session[]>([]);
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
    const [sessionQueue, setSessionQueue] = useState<string[]>([]);

    // 1. Storage & Migration Loader
    useEffect(() => {
        // Load Active Session
        const stored = localStorageAdapter.getItem<Session>(ACTIVE_SESSION_KEY);
        if (stored) setActiveSession(stored);

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

        // --- MIGRATION: Backfill Legacy Data ---
        const MIGRATION_KEY = 'time_tracker_v1_migration_done';
        const isMigrated = localStorageAdapter.getItem(MIGRATION_KEY);

        if (!isMigrated) {
            const tasks = localStorageAdapter.getItem<any[]>('tasks') || [];
            const existingSessions = localStorageAdapter.getItem<Session[]>('time_tracker_sessions') || [];
            let addedCount = 0;
            const newSessions: Session[] = [...existingSessions];

            tasks.forEach(task => {
                if (task.timeSpent > 0) {
                    const hasLegacy = newSessions.some((s: Session) => s.id === `legacy_${task.id}`);
                    if (!hasLegacy) {
                        const legacySession: Session = {
                            id: `legacy_${task.id}`,
                            taskId: task.id,
                            startTime: task.createdAt || new Date().toISOString(),
                            endTime: new Date(Date.now() + (task.timeSpent * 1000)).toISOString(),
                            duration: task.timeSpent,
                            legacy: true
                        };
                        newSessions.push(legacySession);
                        addedCount++;
                    }
                }
            });

            if (addedCount > 0) {
                setSessionsHistory(newSessions);
                localStorageAdapter.setItem(SESSIONS_KEY, newSessions);
            }
            localStorageAdapter.setItem(MIGRATION_KEY, true);
        }
    }, []);

    // 2. Playlist Logic
    const setPlaylistContext = useCallback((playlistId: string, queue: string[]) => {
        setActivePlaylistId(playlistId);
        setSessionQueue(queue);
        localStorage.setItem(PLAYLIST_STATE_KEY, JSON.stringify({ playlistId, queue }));
    }, []);

    const updateQueue = useCallback((newQueue: string[]) => {
        setSessionQueue(newQueue);
        // We only persist if there is an active playlist context
        if (activePlaylistId) {
            localStorage.setItem(PLAYLIST_STATE_KEY, JSON.stringify({ playlistId: activePlaylistId, queue: newQueue }));
        }
    }, [activePlaylistId]);

    // 3. Session Logic
    const stopSession = useCallback(() => {
        if (!activeSession) return;

        const endTime = new Date().toISOString();
        const duration = Math.floor((new Date(endTime).getTime() - new Date(activeSession.startTime).getTime()) / 1000);

        const completedSession: Session = {
            ...activeSession,
            endTime,
            duration,
        };

        setSessionsHistory(prev => {
            const updated = [...prev, completedSession];
            localStorageAdapter.setItem(SESSIONS_KEY, updated);
            return updated;
        });

        setActiveSession(null);
        localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);
    }, [activeSession]);

    const startSession = useCallback((taskId: string, playlistId?: string, queue?: string[]) => {
        if (activeSession) {
            stopSession(); // Uses the stopSession from closure? Yes, but check dependency.
            // Actually, we need to be careful with closure staleness here.
            // Ideally stopSession should depend on activeSession, which changes over time.
            // If we use the function reference, we are fine.
        }

        const newSession: Session = {
            id: crypto.randomUUID(),
            taskId,
            startTime: new Date().toISOString(),
            duration: 0,
        };
        setActiveSession(newSession);
        localStorageAdapter.setItem(ACTIVE_SESSION_KEY, newSession);

        if (playlistId) {
            setPlaylistContext(playlistId, queue || []);
        }
    }, [activeSession, stopSession, setPlaylistContext]);

    const discardSession = useCallback(() => {
        setActiveSession(null);
        localStorageAdapter.removeItem(ACTIVE_SESSION_KEY);
    }, []);

    return (
        <SessionContext.Provider value={{
            activeSession,
            sessionsHistory,
            activePlaylistId,
            sessionQueue,
            startSession,
            stopSession,
            discardSession,
            setPlaylistContext,
            updateQueue
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
