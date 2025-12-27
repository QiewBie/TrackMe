import { parseISO, isWithinInterval } from 'date-fns';
import { Task, DateRange, FilterType } from '../types';

/**
 * Filters a list of tasks by date range and category.
 */
export const filterTasks = (tasks: Task[], dateFilter: DateRange, categoryFilter: FilterType = 'all'): Task[] => {
    return tasks.filter(t => {
        // Date Check
        if (!t.createdAt) return false;

        // Use Local Time for comparison
        const taskDate = new Date(t.createdAt);
        // Reset time component to ensure date-only comparison
        taskDate.setHours(0, 0, 0, 0);

        const start = new Date(dateFilter.start);
        start.setHours(0, 0, 0, 0);

        const end = new Date(dateFilter.end);
        end.setHours(23, 59, 59, 999);

        const isDateMatch = taskDate >= start && taskDate <= end;

        // Category Check
        const isCatMatch = categoryFilter === 'all' || String(t.categoryId) === String(categoryFilter);

        return isDateMatch && isCatMatch;
    });
};

/**
 * Splits tasks into visible (active) and completed lists.
 */
export const splitTasksByStatus = (filteredTasks: Task[]): { visible: Task[]; completed: Task[] } => {
    const visible: Task[] = [];
    const completed: Task[] = [];

    filteredTasks.forEach(t => {
        if (t.completed) {
            completed.push(t);
        } else {
            visible.push(t);
        }
    });

    return { visible, completed };
};
