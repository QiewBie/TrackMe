import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusSession } from '../useFocusSession';
import { Task } from '../../types';

// Mock the context hook
const mockStartSession = vi.fn();
const mockStopSession = vi.fn();
const mockPauseSession = vi.fn();
const mockResumeSession = vi.fn();

vi.mock('../../context/FocusSessionContext', () => ({
    useFocusContext: () => ({
        timeLeft: 1500, // 25 mins
        isPaused: true,
        activeSession: null,
        startSession: mockStartSession,
        pauseSession: mockPauseSession,
        resumeSession: mockResumeSession,
        stopSession: mockStopSession,
    })
}));

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
        // timeSpent REMOVED
        cachedTotalTime: 0,
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
        // Local state starts idle unless context says otherwise
        expect(result.current.sessionState).toBe('idle');
        expect(result.current.timeLeft).toBe(1500); // From mock
    });

    it('toggleTimer starts a new session if none active', () => {
        const { result } = renderHook(() => useFocusSession({ activeTask, settings, handlers }));

        act(() => {
            result.current.toggleTimer();
        });

        // Should call startSession on context
        expect(mockStartSession).toHaveBeenCalledWith('1', expect.anything());
    });
});
