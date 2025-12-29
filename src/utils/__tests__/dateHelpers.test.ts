import { describe, it, expect } from 'vitest';
import { filterTasks, splitTasksByStatus } from '../dateHelpers';
import { Task } from '../../types';

const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', categoryId: '1', cachedTotalTime: 100, isRunning: false, completed: false, createdAt: '2023-01-01T10:00:00.000Z', subtasks: [] },
    { id: '2', title: 'Task 2', categoryId: '2', cachedTotalTime: 200, isRunning: false, completed: true, createdAt: '2023-01-02T10:00:00.000Z', completedAt: '2023-01-02T11:00:00.000Z', subtasks: [] },
    { id: '3', title: 'Task 3', categoryId: '1', cachedTotalTime: 300, isRunning: false, completed: false, createdAt: '2023-01-03T10:00:00.000Z', subtasks: [] },
    { id: '4', title: 'Task 4', categoryId: null, cachedTotalTime: 50, isRunning: false, completed: false, createdAt: '2023-01-01T15:00:00.000Z', subtasks: [] },
];

describe('dateHelpers', () => {
    describe('filterTasks', () => {
        it('filters by date range', () => {
            const range = { start: '2023-01-01', end: '2023-01-01' };
            const result = filterTasks(mockTasks, range, 'all');
            // Expected: Task 1 and Task 4 (created on 01-01)
            expect(result).toHaveLength(2);
            expect(result.map(t => t.id)).toContain('1');
            expect(result.map(t => t.id)).toContain('4');
        });

        it('filters by category', () => {
            const range = { start: '2023-01-01', end: '2023-01-03' }; // All days
            const result = filterTasks(mockTasks, range, '1'); // Category 1
            expect(result).toHaveLength(2);
            expect(result.map(t => t.id)).toContain('1');
            expect(result.map(t => t.id)).toContain('3');
        });

        it('filters by date range AND category', () => {
            const range = { start: '2023-01-01', end: '2023-01-01' };
            const result = filterTasks(mockTasks, range, '1');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });
    });

    describe('splitTasksByStatus', () => {
        it('splits tasks into completed and visible (uncompleted + active)', () => {
            const { visible, completed } = splitTasksByStatus(mockTasks);
            expect(completed).toHaveLength(1);
            expect(completed[0].id).toBe('2');

            expect(visible).toHaveLength(3); // 1, 3, 4
        });
    });
});
