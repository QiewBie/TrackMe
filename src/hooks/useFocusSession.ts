import { useState, useCallback, useEffect } from 'react';
import { Task } from '../types';
import { useFocusContext } from '../context/FocusSessionContext';

export type SessionState = 'idle' | 'work' | 'shortBreak' | 'longBreak';

interface UseFocusSessionProps {
    activeTask: Task | undefined;
    settings: {
        workDuration: number;
        shortBreak: number;
        longBreak: number;
        autoStartNext: boolean;
    };
    handlers: {
        startTask: (id: string) => void;
        stopTask: (id: string) => void;
        updateTaskDetails: (task: Task) => void;
        playCompleteSound: () => void;
    };
}

export const useFocusSession = ({ activeTask, settings, handlers }: UseFocusSessionProps) => {
    // We now rely on SessionContext for the source of truth
    const {
        timeLeft,
        isPaused,
        activeSession,
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
        updateSessionConfig
    } = useFocusContext();

    const { playCompleteSound } = handlers;

    const [showNewSetPrompt, setShowNewSetPrompt] = useState(false);

    // Derive Session State purely for UI compatibility
    // In future, SessionContext should own this 'mode' (work/break)
    const [localSessionState, setLocalSessionState] = useState<SessionState>('idle');

    // Sync Local State with Context
    useEffect(() => {
        if (activeSession && !isPaused) {
            setLocalSessionState('work');
        } else if (activeSession && isPaused) {
            setLocalSessionState('idle');
        } else {
            setLocalSessionState('idle');
        }
    }, [activeSession, isPaused]);

    // --- Completion Logic ---
    useEffect(() => {
        // If timeLeft hits 0 and we were working
        if (activeSession && timeLeft === 0 && !isPaused) {
            playCompleteSound();
            setShowNewSetPrompt(true);
            setLocalSessionState('idle');
            // We should prob stop/pause the session in context to stop the tick
            pauseSession();
        }
    }, [timeLeft, isPaused, activeSession, playCompleteSound, pauseSession]);


    // --- Actions ---

    const startNewSet = useCallback(() => {
        if (!activeTask) return;

        // Start a fresh session via Context
        startSession(activeTask.id, {
            workDuration: settings.workDuration,
            shortBreak: settings.shortBreak,
            longBreak: settings.longBreak
        });

        setShowNewSetPrompt(false);
    }, [activeTask, settings, startSession]);

    const toggleTimer = useCallback(() => {
        if (!activeTask) return;

        if (!activeSession) {
            // Start fresh
            startNewSet();
        } else {
            // Toggle
            if (isPaused) {
                resumeSession();
            } else {
                pauseSession();
            }
        }
    }, [activeTask, activeSession, isPaused, startNewSet, resumeSession, pauseSession]);

    const resetSession = useCallback(() => {
        stopSession();
        setLocalSessionState('idle');
        setShowNewSetPrompt(false);
    }, [stopSession]);

    // Calculate total time strictly for display if needed, 
    // but the UI should rely on Task.cachedTotalTime for "Total" (V2 Source of Truth)
    const totalTimeSpent = activeTask?.cachedTotalTime || 0;

    return {
        sessionState: localSessionState,
        setSessionState: setLocalSessionState,
        showNewSetPrompt,
        setShowNewSetPrompt,
        timeLeft,             // From Context
        totalTimeSpent,       // From Task Data
        isTimerRunning: !isPaused && !!activeSession,
        toggleTimer,
        startNewSet,
        resetSession,
        stopSession, // Expose for manual stops (Complete/Skip)
        updateSessionConfig
    };
};
