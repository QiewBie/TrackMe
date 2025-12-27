import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConfirmation } from '../useConfirmation';

describe('useConfirmation', () => {
    it('should initialize with closed state', () => {
        const { result } = renderHook(() => useConfirmation<string>(vi.fn()));

        expect(result.current.itemToDelete).toBeNull();
    });

    it('should set itemToDelete when requestDelete is called', () => {
        const { result } = renderHook(() => useConfirmation<string>(vi.fn()));

        act(() => {
            result.current.requestDelete('task-1');
        });

        expect(result.current.itemToDelete).toBe('task-1');
    });

    it('should clear itemToDelete when cancelDelete is called', () => {
        const { result } = renderHook(() => useConfirmation<string>(vi.fn()));

        act(() => {
            result.current.requestDelete('task-1');
        });

        act(() => {
            result.current.cancelDelete();
        });

        expect(result.current.itemToDelete).toBeNull();
    });

    it('should call onConfirmCallback and clear state when confirmDelete is called', () => {
        const onConfirmMock = vi.fn();
        const { result } = renderHook(() => useConfirmation<string>(onConfirmMock));

        act(() => {
            result.current.requestDelete('task-1');
        });

        act(() => {
            result.current.confirmDelete();
        });

        expect(onConfirmMock).toHaveBeenCalledWith('task-1');
        expect(result.current.itemToDelete).toBeNull();
    });

    it('should not call onConfirmCallback if there is no item to delete', () => {
        const onConfirmMock = vi.fn();
        const { result } = renderHook(() => useConfirmation<string>(onConfirmMock));

        act(() => {
            result.current.confirmDelete();
        });

        expect(onConfirmMock).not.toHaveBeenCalled();
    });
});
