export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export type Subtask = SubTask;

export interface Task {
    id: string;
    title: string;
    description?: string;
    categoryId: string | null;
    /** @deprecated Migrating to TimeLogs. Use cachedTotalTime instead. */
    savedTime?: number;
    isRunning: boolean;
    completed: boolean;
    createdAt: string; // ISO Date string
    completedAt?: string; // ISO Date string
    updatedAt?: string; // For Sync Conflict Resolution (LWW)
    lastStartTime?: number; // Timestamp for timer logic
    focusOffset?: number; // Time spent when the current focus set started

    // NEW: Source of Truth Cache
    cachedTotalTime: number; // Sum of all TimeLogs duration

    priority?: 'low' | 'medium' | 'high';
    subtasks: SubTask[];
}

export interface ProjectNote {
    id: string;
    categoryId: string;
    content: string; // HTML content
    updatedAt: string;
}
