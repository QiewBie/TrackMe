import { IStorageAdapter } from './storage';
import { Task, Category, Playlist } from '../../types';

export class LocalStorageAdapter implements IStorageAdapter {
    private isAvailable: boolean = true;
    private memoryStore: Map<string, any> = new Map();
    private userId?: string;

    constructor(userId?: string) {
        this.userId = userId;
        this.checkAvailability();
    }

    private getPrefixedKey(key: string): string {
        return this.userId ? `user_${this.userId}_${key}` : key;
    }

    private checkAvailability() {
        if (typeof window === 'undefined') {
            this.isAvailable = false;
            return;
        }
        try {
            const testKey = '__storage_test__';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            this.isAvailable = true;
        } catch (e) {
            console.warn('LocalStorage unavailable (Private Mode/Quota?), switching to In-Memory mode.');
            this.isAvailable = false;
        }
    }

    getItem<T>(key: string): T | null {
        const prefixedKey = this.getPrefixedKey(key);
        // If unavailable, use memory
        if (!this.isAvailable) {
            return (this.memoryStore.get(prefixedKey) as T) || null;
        }

        try {
            const item = window.localStorage.getItem(prefixedKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading key "${prefixedKey}" from localStorage:`, error);
            return null;
        }
    }

    setItem<T>(key: string, value: T): void {
        const prefixedKey = this.getPrefixedKey(key);
        // If unavailable, write to memory
        if (!this.isAvailable) {
            this.memoryStore.set(prefixedKey, value);
            return;
        }

        try {
            window.localStorage.setItem(prefixedKey, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing key "${prefixedKey}" to localStorage. Switching to In-Memory for this session.`, error);
            // Fallback immediately on write error (e.g. QuotaExceeded)
            this.isAvailable = false;
            this.memoryStore.set(prefixedKey, value);
        }
    }

    removeItem(key: string): void {
        const prefixedKey = this.getPrefixedKey(key);
        if (!this.isAvailable) {
            this.memoryStore.delete(prefixedKey);
            return;
        }

        try {
            window.localStorage.removeItem(prefixedKey);
        } catch (error) {
            console.error(`Error removing key "${prefixedKey}" from localStorage:`, error);
        }
    }

    // --- Granular Emulation (Helper) ---
    private async updateCollectionItem<T extends { id: string }>(collectionKey: string, item: T): Promise<void> {
        // Read current array (default to empty)
        // Note: getItem already handles prefixing, so we pass the raw collectionKey
        const current = this.getItem<T[]>(collectionKey) || [];
        const index = current.findIndex(i => i.id === item.id);

        if (index > -1) {
            current[index] = item;
        } else {
            current.push(item);
        }

        this.setItem(collectionKey, current);
    }

    private async deleteCollectionItem(collectionKey: string, id: string): Promise<void> {
        const current = this.getItem<any[]>(collectionKey) || [];
        const updated = current.filter(i => i.id !== id);
        this.setItem(collectionKey, updated);
    }

    // --- Implementation ---
    async saveTask(task: Task): Promise<void> {
        return this.updateCollectionItem('tasks', task);
    }
    async deleteTask(id: string): Promise<void> {
        return this.deleteCollectionItem('tasks', id);
    }

    async saveCategory(category: Category): Promise<void> {
        return this.updateCollectionItem('categories', category);
    }
    async deleteCategory(id: string): Promise<void> {
        return this.deleteCollectionItem('categories', id);
    }

    async savePlaylist(playlist: Playlist): Promise<void> {
        return this.updateCollectionItem('playlists', playlist);
    }
    async deletePlaylist(id: string): Promise<void> {
        return this.deleteCollectionItem('playlists', id);
    }

    getServerTime(): number {
        return Date.now();
    }
}

// Singleton instance
export const localStorageAdapter = new LocalStorageAdapter();
