
import { localStorageAdapter } from './storage/LocalStorageAdapter';

/**
 * Migrates legacy data (global localStorage) to a specific user profile.
 * This is used when the first user is created to ensure they inherit the existing state.
 * 
 * @param userId The ID of the user to migrate data to
 * @param userName The name of the user (for logging)
 */
export const migrateLegacyData = (userId: string, userName: string) => {
    const legacyTasks = localStorageAdapter.getItem<any[]>('tasks');
    const legacyCategories = localStorageAdapter.getItem<any[]>('categories');

    let migrated = false;

    if (legacyTasks) {
        localStorageAdapter.setItem(`user_${userId}_tasks`, legacyTasks);
        // console.log(`[Migration] Migrated legacy tasks to user ${userName} (${userId})`);
        migrated = true;
    }

    if (legacyCategories) {
        localStorageAdapter.setItem(`user_${userId}_categories`, legacyCategories);
        // console.log(`[Migration] Migrated legacy categories to user ${userName} (${userId})`);
        migrated = true;
    }

    return migrated;
};
