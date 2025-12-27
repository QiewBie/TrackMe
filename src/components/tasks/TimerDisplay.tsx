import React, { memo } from 'react';
import { clsx } from 'clsx';
import { useTaskDuration } from '../../context/TimerContext';
import { formatTime } from '../../utils/formatters';


interface TimerDisplayProps {
    task: { id: string, timeSpent?: number, savedTime?: number };
    className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = memo(({ task, className }) => {
    const timeSpent = useTaskDuration(task);

    return (
        <span className={clsx("tabular-nums font-bold transition-colors", className)}>
            {formatTime(timeSpent)}
        </span>
    );
});

export default TimerDisplay;
