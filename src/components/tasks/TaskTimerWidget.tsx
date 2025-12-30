import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';
import { formatTime } from '../../utils/formatters';
import { Task } from '../../types';
import { useFocusContext } from '../../context/FocusSessionContext';

interface TimerDisplayProps {
    task: Task;
    className?: string;
}

const TaskTimerWidget = memo<TimerDisplayProps>(({ task, className }) => {
    const { activeSession, timeLeft, isPaused } = useFocusContext();

    // Check if this task is currently running in the global session
    const isActive = activeSession?.taskId === task.id;

    // Calculate elapsed time in current session
    // Note: SessionContext updates timeLeft every second, triggering re-render here.
    let addedTime = 0;
    if (isActive && activeSession) {
        // CORRECTION: We must calculate delta relative to the START of this specific segment (resume point),
        // not the total session duration configuration.
        // activeSession.remainingTime holds the snapshot of time left when this segment started.

        const startPoint = activeSession.remainingTime ?? ((activeSession.config?.duration || 25) * 60);
        addedTime = Math.max(0, startPoint - timeLeft);
    }

    // V2: Source of Truth is cachedTotalTime (Logs) + Active Session
    const totalDuration = (task.cachedTotalTime || 0) + addedTime;

    return (
        <span className={clsx("tabular-nums font-bold transition-colors", className)}>
            {formatTime(totalDuration)}
        </span>
    );
});

export default TaskTimerWidget;
