import { useCallback } from 'react';
import { useSimpleTimer } from '../context/ActiveTimerContext';
import { useSession } from '../context/SessionContext';

export type TimerSource = 'dashboard' | 'focus';

/**
 * useGlobalTimer - "Traffic Cop" for timer orchestration
 * 
 * IMPORTANT: Dashboard and Focus are INDEPENDENT systems.
 * - Dashboard uses SimpleTimer (ActiveTimerContext) → Firestore simple_timer_state
 * - Focus uses Session (SessionContext) → Firestore session
 * 
 * They coordinate LOCALLY but do NOT affect each other in Firestore.
 */
export const useGlobalTimer = () => {
    // 1. Consume Both Contexts
    const {
        activeTimer: simpleTimer,
        startSimpleTimer,
        stopSimpleTimer
    } = useSimpleTimer();

    const {
        session: focusSession,
        start: startSession,
        pause: pauseSession,
        isPaused: isFocusPaused
    } = useSession();


    // 2. "Traffic Cop" Logic

    // START
    const startTimer = useCallback((taskId: string, source: TimerSource, options?: { mode?: 'focus' | 'break', duration?: number, config?: any }) => {
        if (source === 'dashboard') {
            // Dashboard Action - LOCAL coordination only
            // NOTE: We do NOT stop Focus session here.
            // Focus/Dashboard are independent Firestore documents.
            // Stopping Focus would affect all devices!

            // Start Simple Timer
            startSimpleTimer(taskId);

        } else if (source === 'focus') {
            // Focus View Action

            // Kill Simple Timer if running (local only)
            if (simpleTimer) {
                stopSimpleTimer(); // Writes to log
            }

            // Start Focus Session
            const mode = options?.mode ?? 'focus';
            const duration = options?.duration ?? (options?.config?.workDuration ?? 25);
            startSession(taskId, { mode, duration }).catch(err =>
                console.error('[GlobalTimer] Failed to start focus session:', err)
            );
        }
    }, [simpleTimer, startSimpleTimer, stopSimpleTimer, startSession]);


    // STOP / PAUSE
    const stopTimer = useCallback((taskId: string) => {
        // Check Simple
        if (simpleTimer?.taskId === taskId) {
            stopSimpleTimer();
            return;
        }

        // Check Focus
        if (focusSession?.taskId === taskId) {
            pauseSession(); // Focus usually Pauses on toggle
            return;
        }
    }, [simpleTimer, focusSession, stopSimpleTimer, pauseSession]);


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
