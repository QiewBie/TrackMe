import { useCallback, useEffect, useState } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';
import { Task } from '../types';
import { useStorage } from '../context/StorageContext';
import { TimeLedger } from '../services/storage/TimeLedger';
import { FinalMigration } from '../services/migration/FinalMigration';

// Helper to update task state without touching time (Time is now Log-based)
const createStoppedTask = (task: Task): Task => {
    return {
        ...task,
        isRunning: false,
        // timeSpent is deprecated, we don't update it anymore.
        // cachedTotalTime will be updated via Repository subscription.
    };
};

interface TaskCallbacks {
    onStart?: (id: string) => void;
    onStop?: (id: string) => void;
    checkActiveTimer?: (id: string) => boolean;
}

export const useTasks = ({ onStart, onStop, checkActiveTimer }: TaskCallbacks = {}) => {
    const storage = useStorage();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initial Load & Hydrate Cache
    useEffect(() => {
        let isMounted = true;
        const loadTasks = async () => {
            // V2 PURGE: Run migration once to ensure all legacy data is in logs
            // and 'timeSpent' is removed from storage.
            await FinalMigration.run();

            const loaded = await storage.getItem<Task[]>('tasks');
            if (isMounted) {
                if (loaded) {
                    // Hydrate cache from Repo
                    // Note: 'timeSpent' is gone now. cachedTotalTime comes purely from Logs.
                    const hydrated = loaded.map(t => ({
                        ...t,
                        cachedTotalTime: TimeLedger.getAggregatedTime(t.id)
                    }));
                    setTasks(hydrated);
                }
                setIsLoading(false);
            }
        };
        loadTasks();
        return () => { isMounted = false; };
    }, [storage]);

    // 2. Subscribe to TimeLog updates (Auto-Refresh Aggregated Time) AND Remote Tasks (Real-time Sync)
    useEffect(() => {
        let unsubscribeLogs = () => { };
        let unsubscribeTasks = () => { };

        // A. TimeLogs Subscription (for cachedTotalTime)
        unsubscribeLogs = TimeLedger.subscribe(() => {
            setTasks(prev => prev.map(t => ({
                ...t,
                cachedTotalTime: TimeLedger.getAggregatedTime(t.id)
            })));
        });

        // B. Remote Tasks Subscription (Real-time Sync)
        const setupTaskSync = async () => {
            // We only access FirestoreAdapter methods via IStorageAdapter interface
            // We need to cast or check availability since IStorageAdapter might be LocalStorageAdapter
            const adapter = storage as any;
            if (adapter.subscribeToTasks) {
                unsubscribeTasks = await adapter.subscribeToTasks((remoteTasks: Task[]) => {
                    console.log('[useTasks] Received remote update:', remoteTasks.length);

                    setTasks(currentLocalTasks => {
                        // Merge Strategy: Remote should generally win for structural changes.
                        // BUT: We need to preserve 'cachedTotalTime' from local TimeLedger calculation 
                        // because remote tasks might have stale 'cachedTotalTime' or it might be deprecated.
                        // Also, we must respect local 'isRunning' state if we are the active device? 
                        // No, if remote says stopped, we should stop (Handoff).

                        // Create a map for faster lookup
                        const currentMap = new Map(currentLocalTasks.map(t => [t.id, t]));

                        return remoteTasks.map(remote => {
                            // Re-calculate time from local ledger source of truth
                            // Alternatively, rely on remote if we sync logs? 
                            // Local TimeLedger is the Aggregator.
                            const localAggregated = TimeLedger.getAggregatedTime(remote.id);

                            return {
                                ...remote,
                                cachedTotalTime: localAggregated
                            };
                        });

                        // Note: What if remote deleted a task? The map above filters purely by remote list.
                        // So deleted tasks vanish. Correct.
                    });

                    setIsLoading(false);
                });
            }
        };

        setupTaskSync();

        return () => {
            unsubscribeLogs();
            if (unsubscribeTasks) unsubscribeTasks();
        };
    }, [storage]);

    // 3. Sync with Active Timers (Legacy / UI Safety)
    useEffect(() => {
        if (tasks.length > 0 && checkActiveTimer && onStart) {
            tasks.forEach(task => {
                if (task.isRunning && !checkActiveTimer(task.id)) {
                    onStart(task.id);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks.length]);

    const addTask = useCallback(async (title: string, catId: string | number, autoStart = false) => {
        const newId = crypto.randomUUID();
        const newTask: Task = {
            id: newId,
            title,
            categoryId: catId ? String(catId) : null,
            description: '',
            cachedTotalTime: 0,
            savedTime: 0,
            lastStartTime: autoStart ? Date.now() : undefined,
            isRunning: autoStart,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: undefined,
            subtasks: []
        };

        if (autoStart) {
            const tasksToStop = tasks.filter(t => t.isRunning);
            tasksToStop.forEach(t => onStop?.(t.id));

            setTasks(prev => {
                const stopped = prev.map(t => t.isRunning ? createStoppedTask(t) : t);
                return [newTask, ...stopped];
            });

            await Promise.all(tasksToStop.map(t => storage.saveTask(createStoppedTask(t))));
            onStart?.(newId);
        } else {
            setTasks(prev => [newTask, ...prev]);
        }

        await storage.saveTask(newTask);
        return newId;
    }, [tasks, onStart, onStop, storage]);

    const toggleTimer = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (task.isRunning) {
            // STOP
            onStop?.(id);
            const stoppedTask = createStoppedTask(task);
            setTasks(prev => prev.map(t => t.id === id ? stoppedTask : t));
            await storage.saveTask(stoppedTask);
        } else {
            // START
            const tasksToStop = tasks.filter(t => t.isRunning && t.id !== id);
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
        }
    }, [tasks, onStart, onStop, storage]);

    const startTask = useCallback(async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task || task.isRunning) return;

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
        // Also clean up logs
        TimeLedger.deleteLogsForTask(id);
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

    // V2: Handle Updates (Manual Edits) via Delta Logs
    const updateTaskDetails = async (updatedTask: Task) => {
        const original = tasks.find(t => t.id === updatedTask.id);
        if (!original) return;

        // Detect Time Change (Manual Edit in UI)
        // We compare cachedTotalTime because the UI updates that field for display
        if (updatedTask.cachedTotalTime !== original.cachedTotalTime) {
            const delta = updatedTask.cachedTotalTime - original.cachedTotalTime;
            if (delta !== 0) {
                TimeLedger.saveLog({
                    id: crypto.randomUUID(),
                    taskId: updatedTask.id,
                    startTime: new Date().toISOString(),
                    duration: delta,
                    type: 'manual',
                    note: 'Manual Adjustment'
                });
                // We let the subscription callback update the task's cachedTotalTime
            }
        }

        // We still save other fields (title, desc)
        // But reset timeSpent to original or just ignore it in DB?
        // The DB 'tasks' table still has 'timeSpent' column. We should probably keep it synced for now
        // to avoid confusion if we rollback, but ideally it's ignored.
        // Let's explicitly NOT update timeSpent in the Task Object sent to storage, 
        // to prevent overwriting the source of truth with stale data?
        // Actually, for safety, let's allow it but know it's deprecated.

        const finalTask = { ...updatedTask };

        // Optimistic UI update (Subscription will overwrite this eventually)
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? finalTask : t));
        await storage.saveTask(finalTask);
    };

    const restoreTask = async (task: Task) => {
        setTasks(prev => {
            if (prev.some(t => t.id === task.id)) return prev;
            return [task, ...prev];
        });
        await storage.saveTask(task);
    };

    return {
        isLoading,
        tasks,
        setTasks,
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


