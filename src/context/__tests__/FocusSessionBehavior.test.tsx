import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FocusSessionProvider, useFocusState, useFocusDispatch, useFocusTick } from '../FocusSessionContext';

describe('FocusSessionContext Integration', () => {
    // We don't need to mock FocusEngine because it's implemented INSIDE the provider.

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FocusSessionProvider>{children}</FocusSessionProvider>
    );

    it('should split state, dispatch, and tick contexts independently', () => {
        const { result } = renderHook(() => ({
            state: useFocusState(),
            dispatch: useFocusDispatch(),
            tick: useFocusTick()
        }), { wrapper });

        // Initial State
        expect(result.current.state.activeSession).toBeNull();
        expect(typeof result.current.tick).toBe('number'); // timeLeft is exposed via TickContext
        expect(result.current.tick).toBe(0);
        expect(typeof result.current.dispatch.startSession).toBe('function');
    });

    it('should update state when session starts', async () => {
        const { result } = renderHook(() => ({
            state: useFocusState(),
            dispatch: useFocusDispatch(),
            tick: useFocusTick()
        }), { wrapper });

        // Start Session
        await act(async () => {
            result.current.dispatch.startSession('task-123', { workDuration: 25 });
        });

        // Verify Active Session
        expect(result.current.state.activeSession).not.toBeNull();
        expect(result.current.state.activeSession?.taskId).toBe('task-123');

        // Verify TimeLeft matches config (25 mins * 60)
        expect(result.current.tick).toBe(25 * 60);

        // Verify Status
        expect(result.current.state.isPaused).toBe(false);
    });

    it('should tick down when running', async () => {
        const { result } = renderHook(() => ({
            dispatch: useFocusDispatch(),
            tick: () => useFocusTick() // Read fresh value
        }), { wrapper });

        await act(async () => {
            result.current.dispatch.startSession('task-tick-test', { workDuration: 10 });
        });

        // Initial: 600s
        expect(result.current.tick()).toBe(600);

        // Advance 1s
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        // Should be 599s
        // Note: useFocusTick returns the value from context. 
        // renderHook might not auto-update 'result.current' deeply if we don't re-render, 
        // but react-testing-library handles many hook updates.
        // Let's rely on re-rendering being triggered by state change.
        expect(result.current.tick()).toBe(599);
    });
});
