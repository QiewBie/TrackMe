import { useState, useCallback, useEffect } from 'react';
import { Task } from '../types';
import { useFocusContext } from '../context/FocusSessionContext';
import { useGlobalTimer } from './useGlobalTimer';

export type SessionState = 'idle' | 'work' | 'shortBreak' | 'longBreak';

interface UseFocusSessionProps {
    activeTask: Task | undefined;
    hasNextTask?: boolean; // New prop
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

export const useFocusSession = ({ activeTask, hasNextTask = true, settings, handlers }: UseFocusSessionProps) => {
    // We now rely on SessionContext AND GlobalTimer for orchestration
    const {
        timeLeft,
        isPaused,
        activeSession,
        pauseSession, // We still use specific Pause
        stopSession,
        updateSessionConfig
    } = useFocusContext();

    const { startTimer } = useGlobalTimer(); // New Orchestrator

    const { playCompleteSound } = handlers;

    const [showNewSetPrompt, setShowNewSetPrompt] = useState(false);

    // Derive Session State purely for UI compatibility
    // In future, SessionContext should own this 'mode' (work/break)
    const [localSessionState, setLocalSessionState] = useState<SessionState>('idle');

    // Sync Local State with Context
    useEffect(() => {
        if (activeSession && !isPaused) {
            if (activeSession.config?.mode === 'break') {
                // Distinguish Short vs Long based on duration
                // Heuristic: If duration >= longBreak setting, it's Long.
                if (activeSession.config.duration >= settings.longBreak) {
                    setLocalSessionState('longBreak');
                } else {
                    setLocalSessionState('shortBreak');
                }
            } else {
                setLocalSessionState('work');
            }
        } else if (activeSession && isPaused) {
            setLocalSessionState('idle');
        } else {
            setLocalSessionState('idle');
        }
    }, [activeSession, isPaused, settings.longBreak]);

    // --- Completion Logic ---
    // --- Cleanup Zombie Sessions (activeSession exists but activeTask is gone) ---
    useEffect(() => {
        if (activeSession && !activeTask) {
            console.warn('[useFocusSession] Zombie session detected (no active task). Discarding.');
            stopSession();
        }
    }, [activeSession, activeTask, stopSession]);

    // --- Completion Logic ---
    useEffect(() => {
        // If timeLeft hits 0 and we were working
        // Strict Guard: Must have activeTask to be considered a valid completion
        if (activeSession && activeTask && timeLeft === 0 && !isPaused) {
            playCompleteSound();

            if (settings.autoStartNext) {
                // Auto-start next set immediately
                // TOGGLE LOGIC: Focus -> Break -> Focus
                const currentMode = activeSession.config?.mode || 'focus';

                if (currentMode === 'focus') {
                    // WORK -> BREAK
                    // Always allowed (Break is earned)
                    // Increment Completed Sets
                    const storedSets = parseInt(localStorage.getItem('time_tracker_sets_count') || '0', 10);
                    const newSets = storedSets + 1;
                    localStorage.setItem('time_tracker_sets_count', newSets.toString());

                    // Determine Type of Break
                    const isLongBreak = newSets % 4 === 0;
                    const duration = isLongBreak ? settings.longBreak : settings.shortBreak;

                    // Start Break
                    updateSessionConfig({
                        workDuration: settings.workDuration,
                        shortBreak: settings.shortBreak,
                        longBreak: settings.longBreak
                    });

                    // Use 'break' mode but pass specific duration. 
                    // Note: 'break' mode usually implies shortBreak in context fallback, but we can override duration.
                    startTimer(activeTask.id, 'focus', { mode: 'break', duration });

                    // Optional: Show toast or indicator about Long Break?
                    // The UI will show "Break Time", maybe we add "Long Break" text?

                } else {
                    // BREAK -> WORK
                    // CRITICAL FIX: Only auto-start work if there is a next task!
                    if (hasNextTask) {
                        startTimer(activeTask.id, 'focus', { mode: 'focus' });
                    } else {
                        // No tasks left? Stop everything.
                        stopSession();
                        setLocalSessionState('idle');
                    }
                }

            } else {
                // Show manual prompt
                setShowNewSetPrompt(true);
                pauseSession(); // Pause to stop the tick while waiting
                setLocalSessionState('idle');
            }
        }
    }, [timeLeft, isPaused, activeSession, activeTask, playCompleteSound, pauseSession, settings.autoStartNext, startTimer, settings.workDuration, settings.shortBreak, settings.longBreak, updateSessionConfig, hasNextTask, stopSession]);


    // --- Actions ---

    const startNewSet = useCallback(() => {
        if (!activeTask) return;

        // Start a fresh session via Global Orchestrator (Enforces SimpleTimer stop)
        // Note: FocusSessionContext.startSession handles the config object merging
        const finalWork = settings.workDuration;

        updateSessionConfig({
            workDuration: settings.workDuration,
            shortBreak: settings.shortBreak,
            longBreak: settings.longBreak
        });

        startTimer(activeTask.id, 'focus', { mode: 'focus' });
        setShowNewSetPrompt(false);
    }, [activeTask, settings, startTimer, updateSessionConfig]);

    const toggleTimer = useCallback(() => {
        if (!activeTask) return;

        if (!activeSession) {
            // Start fresh
            startNewSet();
        } else {
            // Toggle
            if (isPaused) {
                // RESUME via Global (kills SimpleTimer if running)
                startTimer(activeTask.id, 'focus');
            } else {
                // PAUSE (Safe to just pause)
                pauseSession();
            }
        }
    }, [activeTask, activeSession, isPaused, startNewSet, startTimer, pauseSession]);

    const startBreak = useCallback(() => {
        if (!activeTask) return;

        // We update config just in case, but really we rely on the mode logic now
        updateSessionConfig({
            workDuration: settings.workDuration,
            shortBreak: settings.shortBreak,
            longBreak: settings.longBreak
        });

        // Trigger break mode via Global Timer
        startTimer(activeTask.id, 'focus', { mode: 'break' });
        setShowNewSetPrompt(false);
    }, [activeTask, settings, startTimer, updateSessionConfig]);

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
        startBreak,
        resetSession,
        stopSession, // Expose for manual stops (Complete/Skip)
        updateSessionConfig
    };
};
