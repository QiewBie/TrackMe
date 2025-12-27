import { Task, Category, Playlist } from '../../types';

export interface IStorageAdapter {
    /**
     * Retrieve an item from storage.
     * @param key The key to retrieve.
     * @returns The parsed value or null if not found.
     */
    getItem<T>(key: string): T | null | Promise<T | null>;

    /**
     * Save an item to storage.
     * @param key The key to store under.
     * @param value The value to store.
     */
    setItem<T>(key: string, value: T): void | Promise<void>;

    /**
     * Remove an item from storage.
     * @param key The key to remove.
     */
    removeItem(key: string): void | Promise<void>;

    // --- Domain Specific Operations (Granular) ---

    saveTask(task: Task): Promise<void>;
    deleteTask(id: string): Promise<void>;

    saveCategory(category: Category): Promise<void>;
    deleteCategory(id: string): Promise<void>;

    savePlaylist(playlist: Playlist): Promise<void>;
    deletePlaylist(id: string): Promise<void>;
}

