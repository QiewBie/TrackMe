import React from 'react';
import { clsx } from 'clsx';
import { useActiveTimer, useActiveTimerTick } from '../../context/ActiveTimerContext';
import { formatTime } from '../../utils/formatters';
import { Task } from '../../types';

interface DurationDisplayProps {
    tasks?: Task[];
    className?: string;
    formatter?: (seconds: number) => string;
    overrideSeconds?: number;
}

const DurationDisplay: React.FC<DurationDisplayProps> = ({ tasks = [], className, formatter = formatTime, overrideSeconds }) => {
    const { activeTimers } = useActiveTimer();
    const currentTime = useActiveTimerTick();

    const totalTime = overrideSeconds !== undefined ? overrideSeconds : tasks.reduce((acc, t) => {
        let duration = t.cachedTotalTime || 0;
        if (activeTimers[t.id]) {
            duration += Math.floor((currentTime - activeTimers[t.id]) / 1000);
        }
        return acc + duration;
    }, 0);

    return (
        <p className={clsx("tabular-nums font-bold", className || "text-2xl text-brand-primary")}>
            {formatter(totalTime)}
        </p>
    );
};

export default DurationDisplay;
