import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../useTasks';


// Mock the TimerContext hook
const mockStartTimer = vi.fn();
const mockStopTimer = vi.fn();
const mockActiveTimers = {};

vi.mock('../../context/ActiveTimerContext', () => ({
    useActiveTimer: () => ({
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        activeTimers: mockActiveTimers
    })
}));

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' }
    })
}));

describe('useTasks Hook', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('initializes with empty tasks', () => {
        const { result } = renderHook(() => useTasks());
        expect(result.current.tasks).toEqual([]);
    });

    it('adds a new task and starts timer', () => {
        const { result } = renderHook(() => useTasks());

        act(() => {
            result.current.addTask('New Task', '1');
        });

        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].title).toBe('New Task');
        expect(result.current.tasks[0].isRunning).toBe(true);
        expect(mockStartTimer).toHaveBeenCalledWith(result.current.tasks[0].id);
    });

    it('toggles timer correctly', () => {
        const { result } = renderHook(() => useTasks());

        // Add task first
        act(() => {
            result.current.addTask('Task 1', '1');
        });

        const taskId = result.current.tasks[0].id;
        expect(result.current.tasks[0].isRunning).toBe(true);

        // Toggle Timer (Stop)
        vi.useFakeTimers();
        const startTime = Date.now();
        vi.setSystemTime(startTime + 5000); // Advance 5 seconds

        act(() => {
            result.current.toggleTimer(taskId);
        });

        expect(result.current.tasks[0].isRunning).toBe(false);
        expect(mockStopTimer).toHaveBeenCalledWith(taskId);

        // Check time accumulation (approximate due to test execution time, but with setSystemTime it should be exact if logic uses Date.now())
        // Our logic: sessionTime = (now - lastStartTime) / 1000
        expect(result.current.tasks[0].cachedTotalTime).toBe(5);

        vi.useRealTimers();

        // Toggle Timer (Start)
        act(() => {
            result.current.toggleTimer(taskId);
        });

        expect(result.current.tasks[0].isRunning).toBe(true);
        expect(mockStartTimer).toHaveBeenCalledTimes(2); // Initial add + toggle
    });

    it('deletes a task', () => {
        const { result } = renderHook(() => useTasks());
        act(() => result.current.addTask('Task to delete', '1'));

        const taskId = result.current.tasks[0].id;

        act(() => result.current.deleteTask(taskId));

        expect(result.current.tasks).toHaveLength(0);
    });

    it('toggles completion status', () => {
        const { result } = renderHook(() => useTasks());
        act(() => result.current.addTask('Task to complete', '1'));

        const taskId = result.current.tasks[0].id; // isRunning: true initially

        act(() => result.current.toggleComplete(taskId));

        const task = result.current.tasks[0];
        expect(task.completed).toBe(true);
        expect(task.isRunning).toBe(false); // Should stop timer on complete
        expect(task.completedAt).toBeDefined();
    });
});
