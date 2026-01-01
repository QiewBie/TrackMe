import React from 'react';
import { clsx } from 'clsx';
import { useFocusState, useFocusTick } from '../../../context/FocusSessionContext';
import { formatTime } from '../../../utils/formatters';
import { Task } from '../../../types';

interface DurationDisplayProps {
    tasks?: Task[];
    className?: string;
    formatter?: (seconds: number) => string;
    overrideSeconds?: number;
}

const DurationDisplay: React.FC<DurationDisplayProps> = ({ tasks = [], className, formatter = formatTime, overrideSeconds }) => {
    const { activeSession, isPaused } = useFocusState();
    // Subscribe to tick ONLY if we have tasks and one is running, to force re-render
    useFocusTick();

    const now = Date.now();

    const totalTime = overrideSeconds !== undefined ? overrideSeconds : tasks.reduce((acc, t) => {
        let duration = t.cachedTotalTime || 0;

        // If this task is currently active, add the elapsed time from current session
        if (activeSession && activeSession.taskId === t.id && !isPaused) {
            const elapsed = Math.floor((now - new Date(activeSession.startTime).getTime()) / 1000);
            duration += Math.max(0, elapsed);
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
