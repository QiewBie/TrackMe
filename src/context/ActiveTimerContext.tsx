import React, { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, ReactNode } from 'react';

// Define types inline
export interface ActiveTimerContextType {
    activeTimers: Record<string, number>;
    startTimer: (taskId: string) => void;
    stopTimer: (taskId: string) => void;
}

export type ActiveTimerTickContextType = number;

// Create two separate contexts
export const ActiveTimerContext = createContext<ActiveTimerContextType | null>(null); // Stable: activeTimers, start/stop
export const ActiveTimerTickContext = createContext<ActiveTimerTickContextType | null>(null); // Dynamic: currentTime (updates every sec)

interface ActiveTimerProviderProps {
    children: ReactNode;
}

export const ActiveTimerProvider: React.FC<ActiveTimerProviderProps> = ({ children }) => {
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
        <ActiveTimerContext.Provider value={stableValue}>
            <ActiveTimerTickContext.Provider value={currentTime}>
                {children}
            </ActiveTimerTickContext.Provider>
        </ActiveTimerContext.Provider>
    );
};

// Hook for stable actions and state
export const useActiveTimer = (): ActiveTimerContextType => {
    const context = useContext(ActiveTimerContext);
    if (!context) throw new Error('useActiveTimer must be used within a ActiveTimerProvider');
    return context;
};

// Hook for dynamic time updates - ONLY using components will re-render
export const useActiveTimerTick = (): number => {
    const context = useContext(ActiveTimerTickContext);
    if (context === null) throw new Error('useActiveTimerTick must be used within a ActiveTimerProvider');
    return context;
};

// Helper hook to calculate specific task duration
// We use Partial<Task> because maybe we don't have full task object
export const useActiveTaskDuration = (task: { id: string, cachedTotalTime?: number }): number => {
    const { activeTimers } = useActiveTimer();
    const currentTime = useActiveTimerTick();

    const baseTime = task.cachedTotalTime || 0;

    if (!activeTimers[task.id]) return baseTime;

    const sessionDuration = Math.floor((currentTime - activeTimers[task.id]) / 1000);
    return baseTime + sessionDuration;
};
