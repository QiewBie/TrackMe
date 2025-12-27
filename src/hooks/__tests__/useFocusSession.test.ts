import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusSession } from '../useFocusSession';
import { Task } from '../../types';

describe('useFocusSession', () => {
    // Mock handlers
    const handlers = {
        startTask: vi.fn(),
        stopTask: vi.fn(),
        updateTaskDetails: vi.fn(),
        playCompleteSound: vi.fn(),
    };

    const settings = {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartNext: false,
    };

    const activeTask: Task = {
        id: '1',
        title: 'Test',
        categoryId: null,
        timeSpent: 0,
        isRunning: false,
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: []
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes with idle state', () => {
        const { result } = renderHook(() => useFocusSession({ activeTask, settings, handlers }));
        expect(result.current.sessionState).toBe('idle');
        expect(result.current.timeLeft).toBe(25 * 60);
    });

    it('toggleTimer starts the timer and calls startTask', () => {
        const { result } = renderHook(() => useFocusSession({ activeTask, settings, handlers }));

        act(() => {
            result.current.toggleTimer();
        });

        expect(result.current.sessionState).toBe('work');
        expect(handlers.startTask).toHaveBeenCalledWith('1');
    });

    it('auto-completes session when time runs out', () => {
        // Setup task that is running and near completion
        const runningTask = {
            ...activeTask,
            isRunning: true,
            lastStartTime: Date.now(),
            timeSpent: (25 * 60) - 1 // 1 second left
        };

        const { result, rerender } = renderHook(
            (props) => useFocusSession(props),
            { initialProps: { activeTask: runningTask, settings, handlers } }
        );

        // Advance time by 1s
        act(() => {
            vi.advanceTimersByTime(1000);
            rerender({ activeTask: runningTask, settings, handlers });
        });

        // Check if we hit the condition. 
        // Note: In real app, re-renders happen. Here we rely on the internal setInterval of the hook
        // but also the hook memoizes totalTimeSpent based on activeTask. 
        // Since activeTask prop didn't change "timeSpent" or "lastStartTime", hook calc uses Date.now().

        // We need to simulate the hook update cycle
        act(() => {
            // Internal state update for forceUpdate
            vi.advanceTimersByTime(100);
            // Also update the sessionState manually to 'work' as it would be if started
            result.current.setSessionState('work');
        });

        // Advance past 0
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        // To verify the "useEffect" for auto-stop, we might need to rerender so useMemo recalculates
        rerender({ activeTask: runningTask, settings, handlers });

        expect(handlers.stopTask).toHaveBeenCalled();
        expect(handlers.playCompleteSound).toHaveBeenCalled();
        expect(result.current.showNewSetPrompt).toBe(true);
    });
});
