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
    lastUpdated: string; // ISO String (Mandatory for sync anchor)
    playlistId?: string | null; // Synced Playlist Context
    queue?: string[]; // Synced Queue Context

    // Version metadata for cloud sync conflict resolution
    _version?: number;
    _updatedAt?: string;
    _deviceId?: string;
}
