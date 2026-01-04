import { useCallback } from 'react';
import { useSimpleTimer } from '../context/ActiveTimerContext';
import { useFocusContext } from '../context/FocusSessionContext';

export type TimerSource = 'dashboard' | 'focus';

export const useGlobalTimer = () => {
    // 1. Consume Both Contexts
    const {
        activeTimer: simpleTimer,
        startSimpleTimer,
        stopSimpleTimer
    } = useSimpleTimer();

    const {
        activeSession: focusSession,
        startSession: startFocusSession,
        pauseSession: pauseFocusSession,
        stopSession: stopFocusSession,
        isPaused: isFocusPaused
    } = useFocusContext();


    // 2. "Traffic Cop" Logic

    // START
    const startTimer = useCallback((taskId: string, source: TimerSource, options?: { mode?: 'focus' | 'break', duration?: number, config?: any }) => {
        if (source === 'dashboard') {
            // Priority: Dashboard Action

            // A. If Focus Session is Active or Paused, we should probably Suspend it?
            // "If I am in Focus, switch to Dashboard... session active?" -> Yes, user said Dashboard is Monitor.
            // BUT: Use case "Started in Dashboard" -> Simple Timer.

            // Logic derived from stress test: One-Way Control.
            // Dashboard "Play" Button ALWAYS starts Simple Timer.
            // It NEVER resumes Focus Session.

            // 1. Kill Focus if running
            if (focusSession) {
                // If it's the SAME task, maybe we just want to watch it?
                // No, user said "Focus is a specialized environment".
                // If you are on Dashboard and click Play, you are opting out of "Session Mode" into "Simple Mode".
                pauseFocusSession(); // Pause it safely so it saves to history? Or Stop?
                // Let's Pause it.
            }

            // 2. Start Simple
            startSimpleTimer(taskId);

        } else if (source === 'focus') {
            // Priority: Focus View

            // 1. Kill Simple Timer if running
            if (simpleTimer) {
                stopSimpleTimer(); // Writes to log
            }

            // 2. Start Focus
            startFocusSession(taskId, options);
        }
    }, [simpleTimer, focusSession, startSimpleTimer, stopSimpleTimer, startFocusSession, pauseFocusSession]);


    // STOP / PAUSE
    const stopTimer = useCallback((taskId: string) => {
        // We need to know WHICH one to stop.

        // Check Simple
        if (simpleTimer?.taskId === taskId) {
            stopSimpleTimer();
            return;
        }

        // Check Focus
        if (focusSession?.taskId === taskId) {
            pauseFocusSession(); // Focus usually Pauses on toggle
            return;
        }
    }, [simpleTimer, focusSession, stopSimpleTimer, pauseFocusSession]);


    // 3. Status Checkers

    // Is this specific task actually running (ticking)?
    const isRunning = useCallback((taskId: string) => {
        const isSimpleRunning = simpleTimer?.taskId === taskId;
        const isFocusRunning = focusSession?.taskId === taskId && !isFocusPaused;
        return isSimpleRunning || isFocusRunning;
    }, [simpleTimer, focusSession, isFocusPaused]);

    // Is this task paused? (relevant for Focus mostly)
    const isPaused = useCallback((taskId: string) => {
        if (focusSession?.taskId === taskId && isFocusPaused) return true;
        return false;
    }, [focusSession, isFocusPaused]);


    return {
        startTimer,
        stopTimer,
        isRunning,
        isPaused,
        // Expose raw states for advanced UI if needed
        activeSource: simpleTimer ? 'dashboard' : (focusSession ? 'focus' : null)
    };
};
