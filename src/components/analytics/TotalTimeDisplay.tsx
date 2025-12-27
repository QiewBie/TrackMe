import React from 'react';
import { clsx } from 'clsx';
import { useTimer, useCurrentTime } from '../../context/TimerContext';
import { formatTime } from '../../utils/formatters';
import { Task } from '../../types';

interface TotalTimeDisplayProps {
    tasks?: Task[];
    className?: string;
    formatter?: (seconds: number) => string;
    overrideSeconds?: number;
}

const TotalTimeDisplay: React.FC<TotalTimeDisplayProps> = ({ tasks = [], className, formatter = formatTime, overrideSeconds }) => {
    const { activeTimers } = useTimer();
    const currentTime = useCurrentTime();

    const totalTime = overrideSeconds !== undefined ? overrideSeconds : tasks.reduce((acc, t) => {
        let duration = t.timeSpent || 0;
        if (activeTimers[t.id]) {
            duration += Math.floor((currentTime - activeTimers[t.id]) / 1000);
        }
        return acc + duration;
    }, 0);

    return (
        <p className={clsx("tabular-nums font-bold", className || "text-2xl text-blue-600")}>
            {formatter(totalTime)}
        </p>
    );
};

export default TotalTimeDisplay;
