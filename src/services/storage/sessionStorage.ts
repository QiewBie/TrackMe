import { localStorageAdapter } from './LocalStorageAdapter';
import { Session } from '../../types/models';

const STORAGE_KEY = 'time_tracker_sessions';

export const sessionStorageService = {
    /**
     * Retrieve all stored sessions.
     */
    getAllSessions: (): Session[] => {
        return localStorageAdapter.getItem<Session[]>(STORAGE_KEY) || [];
    },

    /**
     * Save a new session or overwrite the list.
     * internal helper
     */
    saveAllSessions: (sessions: Session[]): void => {
        localStorageAdapter.setItem(STORAGE_KEY, sessions);
    },

    /**
     * Add a single session to storage.
     */
    addSession: (session: Session): void => {
        const sessions = sessionStorageService.getAllSessions();
        sessions.push(session);
        sessionStorageService.saveAllSessions(sessions);
    },

    /**
     * Update an existing session (e.g., adding endTime).
     */
    updateSession: (updatedSession: Session): void => {
        const sessions = sessionStorageService.getAllSessions();
        const index = sessions.findIndex(s => s.id === updatedSession.id);
        if (index !== -1) {
            sessions[index] = updatedSession;
            sessionStorageService.saveAllSessions(sessions);
        }
    },

    /**
     * Get sessions for a specific task.
     */
    getSessionsByTask: (taskId: string): Session[] => {
        return sessionStorageService.getAllSessions().filter(s => s.taskId === taskId);
    },

    /**
     * Remove a session.
     */
    removeSession: (sessionId: string): void => {
        const sessions = sessionStorageService.getAllSessions();
        const filtered = sessions.filter(s => s.id !== sessionId);
        sessionStorageService.saveAllSessions(filtered);
    }
};
