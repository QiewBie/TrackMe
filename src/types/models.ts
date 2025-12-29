export interface Category {
    id: string;
    name: string;
    color: string;
    isDefault?: boolean;
}

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
    lastStartTime?: number; // Timestamp for timer logic
    focusOffset?: number; // Time spent when the current focus set started

    // NEW: Source of Truth Cache
    cachedTotalTime: number; // Sum of all TimeLogs duration

    priority?: 'low' | 'medium' | 'high';
    subtasks: SubTask[];
}

export interface TimeLog {
    id: string;
    taskId: string;
    userId?: string;
    startTime: string; // ISO 8601
    endTime?: string;  // ISO 8601
    duration: number;  // Seconds
    type: 'auto' | 'manual' | 'migration';
    note?: string;     // Optional context
}

export interface ProjectNote {
    id: string;
    categoryId: string;
    content: string; // HTML content
    updatedAt: string;
}

export interface User {
    id: string; // UUID
    username: string; // Unique local identifier
    name: string; // Display Name
    role: string;
    avatar?: string; // Base64 or URL
    createdAt: string;
    preferences: UserSettings;
}

export interface Playlist {
    id: string;
    title: string;
    taskIds: string[];
    settings: {
        mode: 'manual' | 'pomodoro' | 'flow';
        workDuration: number; // minutes
        shortBreak: number;
        longBreak: number;
        autoStartNext: boolean;
    };
    createdAt: string;
}

export interface UserSettings {
    theme: 'light' | 'dark';
    language: 'en' | 'uk';
    // Add known settings here instead of allowing [key: string]: any
    soundEnabled?: boolean;
    autoStartBreaks?: boolean;
}

export interface Session {
    id: string;
    taskId: string;
    startTime: string; // ISO String
    endTime?: string;  // ISO String (undefined = active)
    duration: number;  // Seconds (calculated on completion)
    remainingTime?: number; // Snapshot of checking for pauses/resumes
    status?: 'active' | 'paused' | 'completed';
    config?: {
        mode: 'focus' | 'break';
        duration: number;
    };
    legacy?: boolean;  // If migrated from old counter
}

