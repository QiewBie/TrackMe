import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';
import { formatTime } from '../../../utils/formatters';
import { Task } from '../../../types';
import { useFocusContext } from '../../../context/FocusSessionContext';
import { useSimpleTimer } from '../../../context/ActiveTimerContext';

interface TimerDisplayProps {
    task: Task;
    className?: string;
}

const TaskTimerWidget = memo<TimerDisplayProps>(({ task, className }) => {
    // 1. Check Simple Timer (High Priority for Dashboard)
    const { activeTimer: simpleTimer, elapsedTime } = useSimpleTimer();
    const isSimpleActive = simpleTimer?.taskId === task.id;

    // 2. Check Focus Session (Background Monitor)
    const { activeSession, timeLeft } = useFocusContext();
    const isFocusActive = activeSession?.taskId === task.id && activeSession.status === 'active';

    let addedTime = 0;

    if (isSimpleActive) {
        // Simple Timer is running: addedTime is derived from local tick
        addedTime = Math.floor(elapsedTime / 1000);
    } else if (isFocusActive) {
        // Focus Session is running: addedTime is derived from session delta
        // Derived from: StartPoint - CurrentTimeLeft
        const startPoint = activeSession.remainingTime ?? ((activeSession.config?.duration || 25) * 60);
        addedTime = Math.max(0, startPoint - timeLeft);
    }

    // V2: Source of Truth is cachedTotalTime (Logs) + Active Increment
    const totalDuration = (task.cachedTotalTime || 0) + addedTime;

    return (
        <span className={clsx("tabular-nums font-bold transition-colors", className)}>
            {formatTime(totalDuration)}
        </span>
    );
});

export default TaskTimerWidget;
