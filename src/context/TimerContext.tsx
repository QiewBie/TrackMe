import React, { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, ReactNode } from 'react';

// Define types inline
export interface TimerContextType {
    activeTimers: Record<string, number>;
    startTimer: (taskId: string) => void;
    stopTimer: (taskId: string) => void;
}

export type TimerTickContextType = number;

// Create two separate contexts
export const TimerContext = createContext<TimerContextType | null>(null); // Stable: activeTimers, start/stop
export const TimerTickContext = createContext<TimerTickContextType | null>(null); // Dynamic: currentTime (updates every sec)

interface TimerProviderProps {
    children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
    const [activeTimers, setActiveTimers] = useState<Record<string, number>>({}); // { [taskId]: startTime }
    const [currentTime, setCurrentTime] = useState<number>(() => Date.now()); // Dynamic state
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update current time every second if there are active timers
    useEffect(() => {
        const hasActive = Object.keys(activeTimers).length > 0;

        if (hasActive && !intervalRef.current) {
            setCurrentTime(Date.now()); // Sync immediately
            intervalRef.current = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
        } else if (!hasActive && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [activeTimers]); // Re-check when timers change

    const startTimer = useCallback((taskId: string) => {
        setActiveTimers(prev => ({ ...prev, [taskId]: Date.now() }));
        setCurrentTime(Date.now()); // Sync immediately
    }, []);

    const stopTimer = useCallback((taskId: string) => {
        setActiveTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[taskId];
            return newTimers;
        });
    }, []);

    // Stable value - usage of this context WON'T cause re-renders on tick
    const stableValue = useMemo(() => ({
        activeTimers, startTimer, stopTimer
    }), [activeTimers, startTimer, stopTimer]);

    return (
        <TimerContext.Provider value={stableValue}>
            <TimerTickContext.Provider value={currentTime}>
                {children}
            </TimerTickContext.Provider>
        </TimerContext.Provider>
    );
};

// Hook for stable actions and state
export const useTimer = (): TimerContextType => {
    const context = useContext(TimerContext);
    if (!context) throw new Error('useTimer must be used within a TimerProvider');
    return context;
};

// Hook for dynamic time updates - ONLY using components will re-render
export const useCurrentTime = (): number => {
    const context = useContext(TimerTickContext);
    if (context === null) throw new Error('useCurrentTime must be used within a TimerProvider');
    return context;
};

// Helper hook to calculate specific task duration
// We use Partial<Task> because maybe we don't have full task object
export const useTaskDuration = (task: { id: string, timeSpent?: number, savedTime?: number }): number => {
    const { activeTimers } = useTimer();
    const currentTime = useCurrentTime();

    if (!activeTimers[task.id]) return task.timeSpent || 0;

    const sessionDuration = Math.floor((currentTime - activeTimers[task.id]) / 1000);
    return (task.savedTime || task.timeSpent || 0) + sessionDuration;
};
