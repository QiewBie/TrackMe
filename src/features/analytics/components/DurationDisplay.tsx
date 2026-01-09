import React from 'react';
import { clsx } from 'clsx';
import { useSession } from '../../../context/SessionContext';
import { formatTime } from '../../../utils/formatters';
import { Task } from '../../../types';

interface DurationDisplayProps {
    tasks?: Task[];
    className?: string;
    formatter?: (seconds: number) => string;
    overrideSeconds?: number;
}

const DurationDisplay: React.FC<DurationDisplayProps> = ({ tasks = [], className, formatter = formatTime, overrideSeconds }) => {
    const { session, isPaused, elapsed } = useSession();

    const totalTime = overrideSeconds !== undefined ? overrideSeconds : tasks.reduce((acc, t) => {
        let duration = t.cachedTotalTime || 0;

        // If this task is currently active, add the elapsed time from current session
        if (session && session.taskId === t.id && !isPaused) {
            duration += elapsed;
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
