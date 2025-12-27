import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task } from '../types';

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
    const { startTask, stopTask, updateTaskDetails, playCompleteSound } = handlers;

    const [sessionState, setSessionState] = useState<SessionState>('idle');
    const [showNewSetPrompt, setShowNewSetPrompt] = useState(false);

    // --- Time Calculation Logic ---
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!activeTask?.isRunning && sessionState === 'idle') return;

        // Force update for UI counter
        forceUpdate(n => n + 1);
        const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(interval);
    }, [activeTask?.isRunning, sessionState]);

    const now = Date.now();

    // Calculate Total Time Spent on Task
    const totalTimeSpent = useMemo(() => {
        if (!activeTask) return 0;
        const currentSession = activeTask.isRunning
            ? Math.max(0, Math.floor((now - (activeTask.lastStartTime || now)) / 1000))
            : 0;
        return activeTask.timeSpent + currentSession;
    }, [activeTask, now]);

    // Calculate Time Left in Current Set
    // workDuration is in minutes, convert to seconds
    const currentOffset = activeTask?.focusOffset || 0;
    const timeLeft = Math.max(0, (settings.workDuration * 60) - (totalTimeSpent - currentOffset));

    // --- Auto-Stop Logic ---
    useEffect(() => {
        if (sessionState === 'work' && timeLeft === 0 && activeTask?.isRunning) {
            // Session Complete
            stopTask(activeTask.id);
            playCompleteSound();
            setShowNewSetPrompt(true);
            setSessionState('idle');
        }
    }, [timeLeft, sessionState, activeTask, stopTask, playCompleteSound]);

    // --- Initialization Logic ---
    // Check overtime on mount / task change
    useEffect(() => {
        if (!activeTask) return;

        // If we load a task and we are already past the set duration
        const offset = activeTask.focusOffset || 0;
        const spentInSet = totalTimeSpent - offset;
        const _timeLeft = Math.max(0, (settings.workDuration * 60) - spentInSet);

        if (_timeLeft === 0 && totalTimeSpent > 0 && !showNewSetPrompt) {
            setShowNewSetPrompt(true);
        }
    }, [activeTask?.id]); // Only check when switching to a new task

    // --- Actions ---

    const startNewSet = useCallback(() => {
        if (!activeTask) return;

        // "Commit" the current time as the new offset
        updateTaskDetails({
            ...activeTask,
            focusOffset: totalTimeSpent
        });

        setSessionState('work');
        setShowNewSetPrompt(false);
        startTask(activeTask.id);
    }, [activeTask, totalTimeSpent, updateTaskDetails, startTask]);

    const toggleTimer = useCallback(() => {
        if (!activeTask) return;

        if (sessionState === 'idle' || !activeTask.isRunning) {
            // Start
            if (timeLeft === 0) {
                // If 0, it means we finished previous set. 
                // We should probably start a new set automatically?
                // Logic in View was: handleStartNewSet()
                startNewSet();
            } else {
                setSessionState('work');
                startTask(activeTask.id);
            }
        } else {
            // Pause
            stopTask(activeTask.id);
            setSessionState('idle');
        }
    }, [activeTask, sessionState, timeLeft, startTask, stopTask, startNewSet]);

    const resetSession = useCallback(() => {
        setSessionState('idle');
        setShowNewSetPrompt(false);
    }, []);

    return {
        sessionState,
        setSessionState, // Expose for manual overrides like breaks
        showNewSetPrompt,
        setShowNewSetPrompt,
        timeLeft,
        totalTimeSpent,
        isTimerRunning: activeTask?.isRunning || false,
        toggleTimer,
        startNewSet,
        resetSession
    };
};
