/**
 * useFocusSession - Focus session management hook
 * 
 * Provides timer state and actions for FocusView using SessionContext.
 * Handles work/break cycles, completion detection, and auto-start logic.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Task } from '../types';
import { useSession } from '../context/SessionContext';

export type SessionState = 'idle' | 'work' | 'shortBreak' | 'longBreak';

interface UseFocusSessionProps {
    activeTask: Task | undefined;
    hasNextTask?: boolean;
    settings: {
        workDuration: number;
        shortBreak: number;
        longBreak: number;
        autoStartNext: boolean;
    };
    handlers: {
        playCompleteSound: () => void;
    };
}

export const useFocusSession = ({ activeTask, hasNextTask = true, settings, handlers }: UseFocusSessionProps) => {
    const {
        session,
        elapsed,
        remaining,
        isRunning,
        isPaused,
        hasSession,
        start,
        pause,
        resume,
        stop,
        switchTask
    } = useSession();

    const { playCompleteSound } = handlers;

    const [showNewSetPrompt, setShowNewSetPrompt] = useState(false);

    // === DERIVED STATE ===

    const sessionState = useMemo((): SessionState => {
        if (!hasSession || isPaused) return 'idle';

        if (session?.mode === 'break') {
            return session.targetDuration >= settings.longBreak * 60 ? 'longBreak' : 'shortBreak';
        }

        return 'work';
    }, [hasSession, isPaused, session?.mode, session?.targetDuration, settings.longBreak]);

    // Time left for countdown display (Pomodoro style)
    const timeLeft = remaining;

    // === COMPLETION LOGIC ===

    useEffect(() => {
        if (!hasSession || !activeTask || isPaused) return;

        // Timer hit zero
        if (remaining <= 0 && isRunning) {
            playCompleteSound();

            if (settings.autoStartNext) {
                const currentMode = session?.mode || 'focus';

                if (currentMode === 'focus') {
                    // Work completed → Start break
                    const storedSets = parseInt(localStorage.getItem('time_tracker_sets_count') || '0', 10);
                    const newSets = storedSets + 1;
                    localStorage.setItem('time_tracker_sets_count', newSets.toString());

                    const isLongBreak = newSets % 4 === 0;
                    const duration = isLongBreak ? settings.longBreak : settings.shortBreak;

                    start(activeTask.id, { mode: 'break', duration }, session?.playlistId, session?.queue);
                } else {
                    // Break completed → Start work (if has next task)
                    if (hasNextTask) {
                        start(activeTask.id, { mode: 'focus', duration: settings.workDuration }, session?.playlistId, session?.queue);
                    } else {
                        stop();
                    }
                }
            } else {
                setShowNewSetPrompt(true);
                pause();
            }
        }
    }, [remaining, isRunning, hasSession, activeTask, isPaused, playCompleteSound, settings, session, start, stop, pause, hasNextTask]);

    // === ACTIONS ===

    const startNewSet = useCallback(async () => {
        if (!activeTask) return;

        await start(
            activeTask.id,
            { mode: 'focus', duration: settings.workDuration },
            session?.playlistId,
            session?.queue
        );
        setShowNewSetPrompt(false);
    }, [activeTask, settings.workDuration, session?.playlistId, session?.queue, start]);

    const toggleTimer = useCallback(async () => {
        if (!activeTask) return;

        if (!hasSession) {
            await startNewSet();
        } else if (isPaused) {
            await resume();
        } else {
            await pause();
        }
    }, [activeTask, hasSession, isPaused, startNewSet, resume, pause]);

    const startBreak = useCallback(async () => {
        if (!activeTask) return;

        await start(
            activeTask.id,
            { mode: 'break', duration: settings.shortBreak },
            session?.playlistId,
            session?.queue
        );
        setShowNewSetPrompt(false);
    }, [activeTask, settings.shortBreak, session?.playlistId, session?.queue, start]);

    const resetSession = useCallback(async () => {
        await stop();
        setShowNewSetPrompt(false);
    }, [stop]);

    // === UPDATE CONFIG (compatibility) ===

    const updateSessionConfig = useCallback((_config: Partial<typeof settings>) => {
        // In new system, settings are passed to start() directly
        // This is a no-op for compatibility
    }, []);

    // === RETURN ===

    return {
        sessionState,
        setSessionState: () => { }, // No-op for compatibility
        showNewSetPrompt,
        setShowNewSetPrompt,
        timeLeft,
        totalTimeSpent: activeTask?.cachedTotalTime || 0,
        isTimerRunning: isRunning,
        toggleTimer,
        startNewSet,
        startBreak,
        resetSession,
        stopSession: stop,
        updateSessionConfig
    };
};
