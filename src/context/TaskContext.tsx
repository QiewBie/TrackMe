
import React, { createContext, useContext, ReactNode } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types';



export interface TaskContextType {
    isLoading: boolean;
    tasks: Task[];
    setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
    addTask: (title: string, catId: string | number, autoStart?: boolean) => Promise<string>;
    toggleTimer: (id: string) => Promise<void> | void; // Delegated to GlobalTimer in UI
    startTask: (id: string) => Promise<void> | void;
    stopTask: (id: string) => Promise<void> | void;
    deleteTask: (id: string) => Promise<void> | void;
    toggleComplete: (id: string) => Promise<void> | void;
    updateTaskDetails: (updatedTask: Task) => Promise<void> | void;
    restoreTask: (task: Task) => Promise<void> | void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Decoupled: No dependencies on Timer or Session here.
    // Sync is handled by <TaskOrchestrator /> in the tree.

    const taskState = useTasks();

    return (
        <TaskContext.Provider value={taskState}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) throw new Error('useTaskContext must be used within a TaskProvider');
    return context;
};
