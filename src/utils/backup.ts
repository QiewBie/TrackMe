import { Task, Category, Playlist, User, UserSettings } from '../types';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';

export interface BackupData {
    version: number;
    timestamp: number;
    data: {
        tasks: Task[];
        categories: Category[];
        playlists: Playlist[];
        user: User | null;
        settings: UserSettings | null;
    };
}

const BACKUP_VERSION = 1;

export const createBackup = (userId?: string): BackupData => {
    const prefix = userId ? `user_${userId}_` : '';

    const getItem = <T>(key: string): T | null => {
        return localStorageAdapter.getItem<T>(prefix + key);
    };

    return {
        version: BACKUP_VERSION,
        timestamp: Date.now(),
        data: {
            tasks: getItem<Task[]>('tasks') || [],
            categories: getItem<Category[]>('categories') || [],
            playlists: getItem<Playlist[]>('playlists') || [],
            // User and settings might be global or prefixed. 
            // We'll read them prefixed if user is passed, assuming full isolation.
            user: getItem<User>('user'),
            settings: getItem<UserSettings>('user_settings')
        }
    };
};

export const downloadBackup = (backup: BackupData) => {
    const filename = `timetracker_backup_${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
};

export const validateBackup = (data: any): data is BackupData => {
    if (!data || typeof data !== 'object') return false;

    // Basic structural check
    if (!('version' in data) || !('timestamp' in data) || !('data' in data)) {
        return false;
    }

    const { data: innerData } = data;
    if (!innerData || typeof innerData !== 'object') return false;

    return true;
};

export const restoreBackup = (backup: BackupData, userId?: string) => {
    const { data } = backup;
    const prefix = userId ? `user_${userId}_` : '';

    if (data.tasks) localStorageAdapter.setItem(prefix + 'tasks', data.tasks);
    if (data.categories) localStorageAdapter.setItem(prefix + 'categories', data.categories);
    if (data.playlists) localStorageAdapter.setItem(prefix + 'playlists', data.playlists);
    // Skipping 'user' restore to avoid overwriting auth state with potentially stale data,
    // unless this is a full migration feature. For "Data Backup", restoring tasks/cats/playlists is specific enough.

    if (data.settings) localStorageAdapter.setItem(prefix + 'user_settings', data.settings);
};
