import { useCallback, useEffect, useState } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';
import { Task } from '../types';
import { useStorage } from '../context/StorageContext';

// Helper to calculate session time and update task state
const createStoppedTask = (task: Task): Task => {
    const now = Date.now();
    const sessionTime = Math.floor((now - (task.lastStartTime || now)) / 1000);
    return {
        ...task,
        isRunning: false,
        timeSpent: task.timeSpent + sessionTime,
        savedTime: (task.savedTime || 0) + sessionTime
    };
};

// Define side-effect interfaces
interface TaskCallbacks {
    onStart?: (id: string) => void;
    onStop?: (id: string) => void;
    checkActiveTimer?: (id: string) => boolean;
}

export const useTasks = ({ onStart, onStop, checkActiveTimer }: TaskCallbacks = {}) => {
    const storage = useStorage();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        let isMounted = true;
        const loadTasks = async () => {
            const loaded = await storage.getItem<Task[]>('tasks');
            if (isMounted) {
                if (loaded) setTasks(loaded);
                setIsLoading(false);
            }
        };
        loadTasks();
        return () => { isMounted = false; };
    }, [storage]);

    // Sync tasks with active timers on mount (after load)
    useEffect(() => {
        if (tasks.length > 0 && checkActiveTimer && onStart) {
            tasks.forEach(task => {
                if (task.isRunning && !checkActiveTimer(task.id)) {
                    onStart(task.id);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks.length]); // Check once when tasks are loaded

    const addTask = useCallback(async (title: string, catId: string | number, autoStart = false) => {
        const newId = crypto.randomUUID();
        const newTask: Task = {
            id: newId,
            title,
            categoryId: catId ? String(catId) : null,
            description: '',
            timeSpent: 0,
            savedTime: 0,
            lastStartTime: autoStart ? Date.now() : undefined,
            isRunning: autoStart,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: undefined,
            subtasks: []
        };

        // Handle auto-start side effects
        if (autoStart) {
            // Stop other running tasks
            const tasksToStop = tasks.filter(t => t.isRunning);
            tasksToStop.forEach(t => onStop?.(t.id));

            // Optimistic update
            setTasks(prev => {
                const stopped = prev.map(t => t.isRunning ? createStoppedTask(t) : t);
                return [newTask, ...stopped];
            });

            // Persist stops
            await Promise.all(tasksToStop.map(t => storage.saveTask(createStoppedTask(t))));
            onStart?.(newId);
        } else {
            setTasks(prev => [newTask, ...prev]);
        }

        // Persist new task
        await storage.saveTask(newTask);

        return newId;
    }, [tasks, onStart, onStop, storage]);

    const toggleTimer = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (task.isRunning) {
            // --- STOPPING ---
            onStop?.(id);
            const stoppedTask = createStoppedTask(task);

            setTasks(prev => prev.map(t => t.id === id ? stoppedTask : t));
            await storage.saveTask(stoppedTask);
        } else {
            // --- STARTING ---
            // Stop others
            const tasksToStop = tasks.filter(t => t.isRunning && t.id !== id);
            tasksToStop.forEach(t => onStop?.(t.id));

            onStart?.(id);

            const startedTask = { ...task, isRunning: true, lastStartTime: Date.now() };

            setTasks(prev => prev.map(t => {
                if (t.id === id) return startedTask;
                if (t.isRunning) return createStoppedTask(t);
                return t;
            }));

            // Persist all changes
            await Promise.all([
                storage.saveTask(startedTask),
                ...tasksToStop.map(t => storage.saveTask(createStoppedTask(t)))
            ]);
        }
    }, [tasks, onStart, onStop, storage]);

    const startTask = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task || task.isRunning) return;

        // Stop others
        const tasksToStop = tasks.filter(t => t.isRunning);
        tasksToStop.forEach(t => onStop?.(t.id));

        onStart?.(id);

        const startedTask = { ...task, isRunning: true, lastStartTime: Date.now() };

        setTasks(prev => prev.map(t => {
            if (t.id === id) return startedTask;
            if (t.isRunning) return createStoppedTask(t);
            return t;
        }));

        await Promise.all([
            storage.saveTask(startedTask),
            ...tasksToStop.map(t => storage.saveTask(createStoppedTask(t)))
        ]);
    }, [tasks, onStart, onStop, storage]);

    const stopTask = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task || !task.isRunning) return;

        onStop?.(id);
        const stoppedTask = createStoppedTask(task);

        setTasks(prev => prev.map(t => t.id === id ? stoppedTask : t));
        await storage.saveTask(stoppedTask);
    }, [tasks, onStop, storage]);

    const deleteTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task?.isRunning) onStop?.(id);

        setTasks(p => p.filter(t => t.id !== id));
        await storage.deleteTask(id);
    };

    const toggleComplete = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const isComplete = !task.completed;
        let updatedTask = {
            ...task,
            completed: isComplete,
            completedAt: isComplete ? new Date().toISOString() : undefined
        };

        if (isComplete && task.isRunning) {
            updatedTask.isRunning = false;
            onStop?.(id);
        }

        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
        await storage.saveTask(updatedTask);
    };

    const updateTaskDetails = async (updatedTask: Task) => {
        // We need to calculate newTimeSpent logic here if logic demands it, 
        // but it seems the component passing updatedTask might have done it?
        // Checking original: The logic WAS in the hook. Copying it back.

        const original = tasks.find(t => t.id === updatedTask.id);
        if (!original) return;

        let newTimeSpent = updatedTask.timeSpent;
        const datesChanged = original.createdAt !== updatedTask.createdAt || original.completedAt !== updatedTask.completedAt;

        if (datesChanged && updatedTask.completedAt && updatedTask.createdAt) {
            const start = parseISO(updatedTask.createdAt);
            const end = parseISO(updatedTask.completedAt);
            const diff = differenceInSeconds(end, start);
            newTimeSpent = diff > 0 ? diff : 0;
        }

        const finalTask = { ...updatedTask, timeSpent: newTimeSpent };

        setTasks(prev => prev.map(t => t.id === updatedTask.id ? finalTask : t));
        await storage.saveTask(finalTask);
    };

    const restoreTask = async (task: Task) => {
        setTasks(prev => {
            if (prev.some(t => t.id === task.id)) return prev;
            return [task, ...prev];
        });
        // Check if it already exists to avoid overwrite? 
        // Logic says "restore", so we likely want to save it.
        await storage.saveTask(task);
    };

    return {
        isLoading,
        tasks,
        setTasks, // exposing setTasks might be dangerous now if used directly to bulk update
        addTask,
        toggleTimer,
        startTask,
        stopTask,
        deleteTask,
        toggleComplete,
        updateTaskDetails,
        restoreTask
    };
};

