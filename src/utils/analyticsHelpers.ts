import { Task, DateRange } from '../types';
import {
    isSameDay,
    subDays,
    parseISO,
    eachDayOfInterval,
    format,
    startOfDay,
    isWithinInterval
} from 'date-fns';

/**
 * Calculates the current and longest daily activity streaks.
 * Activity is defined as Creating OR Completing a task on that day.
 */
export const calculateStreak = (tasks: Task[]): { current: number; max: number } => {
    // 1. Identify all "Active Dates"
    const activeDates = new Set<string>();

    tasks.forEach(task => {
        if (task.createdAt) {
            activeDates.add(format(parseISO(task.createdAt), 'yyyy-MM-dd'));
        }
        if (task.completedAt) {
            activeDates.add(format(parseISO(task.completedAt), 'yyyy-MM-dd'));
        }
    });

    // 2. Iterate backwards from today to find current streak
    let current = 0;
    const today = new Date();
    // Check today
    if (activeDates.has(format(today, 'yyyy-MM-dd'))) {
        current++;
    } else {
        // If not active today, streak might be 0, or it might be "active yesterday" (streak generally allows skipping today if it's early?)
        // Strict streak: Must be active Today or Yesterday to keep alive.
        // If inactive today, check yesterday. If yesterday active, streak = 1 (pending today).
        // Let's stick to simple: Consecutive days ENDING today or yesterday.
    }

    // Simplification: Check max 365 days back
    let checkDay = subDays(today, activeDates.has(format(today, 'yyyy-MM-dd')) ? 1 : 0);

    // If we didn't count today yet, and yesterday is active, start counting from yesterday
    if (current === 0 && activeDates.has(format(checkDay, 'yyyy-MM-dd'))) {
        // current starts at 0, loop below will pick it up
    } else if (current === 0 && !activeDates.has(format(checkDay, 'yyyy-MM-dd'))) {
        // No activity today or yesterday -> Streak broken/zero.
        return { current: 0, max: calculateMaxStreak(activeDates) };
    }

    // Now loop backwards
    // Note: If we already counted today (current=1), we check yesterday.
    // If we didn't count today, we check yesterday (current=0, but loop increments).

    // Let's refine:
    // A streak is alive if Today OR Yesterday was active.
    const isTodayActive = activeDates.has(format(today, 'yyyy-MM-dd'));
    const yesterday = subDays(today, 1);
    const isYesterdayActive = activeDates.has(format(yesterday, 'yyyy-MM-dd'));

    if (!isTodayActive && !isYesterdayActive) {
        return { current: 0, max: calculateMaxStreak(activeDates) };
    }

    // Start counting back
    let streakCount = isTodayActive ? 1 : 0;
    let dayCursor = subDays(today, 1);

    while (activeDates.has(format(dayCursor, 'yyyy-MM-dd'))) {
        streakCount++;
        dayCursor = subDays(dayCursor, 1);
    }

    return { current: streakCount, max: calculateMaxStreak(activeDates) };
};

const calculateMaxStreak = (activeDates: Set<string>): number => {
    if (activeDates.size === 0) return 0;

    const sortedDates = Array.from(activeDates)
        .sort()
        .map(d => parseISO(d));

    let max = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev = sortedDates[i - 1];
        const curr = sortedDates[i];

        // Difference in days
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (Math.round(diff) === 1) {
            current++;
        } else {
            max = Math.max(max, current);
            current = 1;
        }
    }

    return Math.max(max, current);
};

export const calculateVelocity = (tasks: Task[], daysBack = 14): { date: string; completed: number; created: number }[] => {
    const end = new Date();
    const start = subDays(end, daysBack - 1); // e.g., 14 days including today
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');

        const completedCount = tasks.filter(t =>
            t.completed &&
            t.completedAt &&
            isSameDay(parseISO(t.completedAt), day)
        ).length;

        const createdCount = tasks.filter(t =>
            t.createdAt &&
            isSameDay(parseISO(t.createdAt), day)
        ).length;

        return {
            date: format(day, 'dd.MM'), // Display format
            fullDate: dateKey, // For sorting/key if needed
            completed: completedCount,
            created: createdCount
        };
    });
};

export const calculateEfficiency = (tasks: Task[]) => {
    const completedTasks = tasks.filter(t => t.completed);

    // Completion Rate: Completed vs (Active + Completed)
    const totalActive = tasks.length;
    const completionRate = totalActive > 0 ? (completedTasks.length / totalActive) * 100 : 0;

    const validCompleted = completedTasks.filter(t => t.cachedTotalTime > 0);
    const totalTime = validCompleted.reduce((acc, t) => acc + t.cachedTotalTime, 0);
    const avgDuration = validCompleted.length > 0 ? totalTime / validCompleted.length : 0;

    return {
        completionRate: Math.round(completionRate),
        avgDuration // in seconds
    };
};

import { Session, TimeLog } from '../types/models';

/**
 * Calculates total time spent per day based on Sessions or TimeLogs.
 */
export const calculateDailyTime = (items: Array<Session | TimeLog>, daysBack = 14): { date: string; fullDate: string; seconds: number }[] => {
    const end = new Date();
    const start = subDays(end, daysBack - 1);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        // Both Session and TimeLog have startTime (ISO string) and duration (number)
        const dayItems = items.filter(s => isSameDay(parseISO(s.startTime), day));
        const totalSeconds = dayItems.reduce((acc, s) => acc + (s.duration || 0), 0);

        return {
            date: format(day, 'dd.MM'),
            fullDate: dateKey,
            seconds: totalSeconds
        };
    });
};

/**
 * Calculates efficiency stats from Sessions/Logs.
 */
export const calculateSessionStats = (items: Array<Session | TimeLog>) => {
    if (items.length === 0) return { avgSessionDuration: 0, totalTime: 0 };
    const totalTime = items.reduce((acc, s) => acc + (s.duration || 0), 0);
    const avgSessionDuration = totalTime / items.length;
    return { avgSessionDuration, totalTime };
};

/**
 * Calculates streak based on Session/Log activity (any work done).
 */
export const calculateSessionStreak = (items: Array<Session | TimeLog>): { current: number; max: number } => {
    const activeDates = new Set<string>();
    items.forEach(s => activeDates.add(format(parseISO(s.startTime), 'yyyy-MM-dd')));
    return calculateStreakFromDates(activeDates);
};

// Re-use logic from calculateStreak
const calculateStreakFromDates = (activeDates: Set<string>): { current: number; max: number } => {
    const today = new Date();
    const isTodayActive = activeDates.has(format(today, 'yyyy-MM-dd'));
    const yesterday = subDays(today, 1);
    const isYesterdayActive = activeDates.has(format(yesterday, 'yyyy-MM-dd'));

    if (!isTodayActive && !isYesterdayActive) {
        return { current: 0, max: calculateMaxStreak(activeDates) };
    }

    let streakCount = isTodayActive ? 1 : 0;
    let dayCursor = subDays(today, 1);
    while (activeDates.has(format(dayCursor, 'yyyy-MM-dd'))) {
        streakCount++;
        dayCursor = subDays(dayCursor, 1);
    }
    return { current: streakCount, max: calculateMaxStreak(activeDates) };
};
