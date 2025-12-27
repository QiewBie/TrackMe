import React, { useEffect, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useTimer } from '../../context/TimerContext';
import { useSession } from '../../context/SessionContext';

const TaskOrchestrator: React.FC = () => {
    const { tasks } = useTaskContext();
    const { startTimer, stopTimer, activeTimers } = useTimer();
    const { activeSession, startSession, stopSession } = useSession();

    // Track processed state to avoid redundant calls or loops
    const processingRef = useRef(false);

    useEffect(() => {
        if (processingRef.current) return;
        processingRef.current = true;

        tasks.forEach(task => {
            if (task.isRunning) {
                // 1. Sync Timer
                // Only start if not already tracked in activeTimers
                if (!activeTimers[task.id]) {
                    startTimer(task.id);
                }

                // 2. Sync Session
                // Only start if no session or different session
                if (!activeSession || activeSession.taskId !== task.id) {
                    startSession(task.id);
                }
            } else {
                // 1. Sync Timer Stop
                if (activeTimers[task.id]) {
                    stopTimer(task.id);
                }

                // 2. Sync Session Stop
                // Only stop if THIS task was the active session
                if (activeSession && activeSession.taskId === task.id) {
                    stopSession();
                }
            }
        });

        processingRef.current = false;
    }, [tasks, activeTimers, activeSession, startTimer, stopTimer, startSession, stopSession]);

    return null;
};

export default TaskOrchestrator;
