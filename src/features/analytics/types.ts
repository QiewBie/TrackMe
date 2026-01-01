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
