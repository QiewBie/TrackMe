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
