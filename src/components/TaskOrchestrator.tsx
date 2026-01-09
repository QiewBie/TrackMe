import { useEffect, useRef } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useSimpleTimer } from '../context/ActiveTimerContext';
import { useSession } from '../context/SessionContext';

/**
 * TaskOrchestrator
 * 
 * Syncs REMOTE task state changes to UI timers (Data → UI only).
 * 
 * IMPORTANT: 
 * - Only handles REMOTE starts (from other devices/tabs)
 * - Does NOT handle stops - those are controlled by ActiveTimerContext subscriptions
 * - Local user actions are handled directly by components
 */
export const TaskOrchestrator = () => {
    const { tasks } = useTaskContext();
    const { activeTimer, startSimpleTimer } = useSimpleTimer();
    const { session, isRunning: isFocusRunning } = useSession();

    // Skip initial render to avoid race conditions
    const initialLoadRef = useRef(true);
    // Track what we've seen to detect REMOTE changes
    const lastSeenRunningRef = useRef<string | null>(null);

    useEffect(() => {
        // Skip first render - let local state settle
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            const running = tasks.find(t => t.isRunning);
            lastSeenRunningRef.current = running?.id || null;
            return;
        }

        const runningTask = tasks.find(t => t.isRunning);

        if (runningTask) {
            // Is it already running in UI?
            const isSimpleActive = activeTimer?.taskId === runningTask.id;
            const isFocusActive = session?.taskId === runningTask.id && isFocusRunning;

            // Only start if UI doesn't know about it (REMOTE start)
            // AND it's a DIFFERENT task than what we last saw
            if (!isSimpleActive && !isFocusActive && runningTask.id !== lastSeenRunningRef.current) {
                console.log('[Orchestrator] Remote start detected:', runningTask.title);
                startSimpleTimer(runningTask.id);
            }

            lastSeenRunningRef.current = runningTask.id;
        } else {
            // Data says nothing running
            // DO NOT STOP UI TIMER HERE - let ActiveTimerContext handle stops via its own subscription
            // This prevents race conditions with optimistic updates
            lastSeenRunningRef.current = null;
        }
    }, [tasks, activeTimer, session, isFocusRunning, startSimpleTimer]);

    return null;
};
