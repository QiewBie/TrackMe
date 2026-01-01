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
