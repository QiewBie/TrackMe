import React, { memo } from 'react';
import { clsx } from 'clsx';
import { formatTime } from '../../utils/formatters';
import { Task } from '../../types';
import { useFocusContext } from '../../context/FocusSessionContext';

interface TimerDisplayProps {
    task: Task;
    className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = memo(({ task, className }) => {
    const { activeSession, timeLeft } = useFocusContext();

    // Check if this task is currently running in the global session
    const isActive = activeSession?.taskId === task.id;

    // Calculate elapsed time in current session
    // Note: SessionContext updates timeLeft every second, triggering re-render here.
    let addedTime = 0;
    if (isActive && activeSession) {
        // We need the original duration to calculate elapsed.
        // activeSession.config.duration is in minutes.
        const totalSessionSeconds = (activeSession.config?.duration || 25) * 60;
        // If timeLeft is greater than total (weird edge case), elapsed is 0
        addedTime = Math.max(0, totalSessionSeconds - timeLeft);
    }

    // V2: Source of Truth is cachedTotalTime (Logs) + Active Session
    const totalDuration = (task.cachedTotalTime || 0) + addedTime;

    return (
        <span className={clsx("tabular-nums font-bold transition-colors", className)}>
            {formatTime(totalDuration)}
        </span>
    );
});

export default TimerDisplay;
