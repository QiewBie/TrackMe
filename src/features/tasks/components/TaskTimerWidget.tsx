import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';
import { formatTime } from '../../../utils/formatters';
import { Task } from '../../../types';
import { useSession } from '../../../context/SessionContext';
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
    const { session, isRunning, elapsed } = useSession();
    const isFocusActive = session?.taskId === task.id && isRunning;

    let addedTime = 0;

    if (isSimpleActive) {
        // Simple Timer is running: addedTime is derived from local tick
        addedTime = Math.floor(elapsedTime / 1000);
    } else if (isFocusActive) {
        // Focus Session is running: use elapsed from SessionContext
        addedTime = elapsed;
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
