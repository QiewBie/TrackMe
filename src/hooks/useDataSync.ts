import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { FirestoreAdapter } from '../services/storage/FirestoreAdapter';

export const useDataSync = () => {
    const { user } = useAuth();
    const adapter = useStorage();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Only run if we are effectively using Firestore
        if (!(adapter instanceof FirestoreAdapter)) return;

        const checkAndSync = async () => {
            const hasSynced = localStorageAdapter.getItem(`sync_done_${user.id}`);
            if (hasSynced) return;

            // Check if cloud has data (check Main Task Key)
            const prefix = `user_${user.id}_`;
            const cloudTasks = await adapter.getItem(`${prefix}tasks`);

            if (cloudTasks) {
                // Cloud already has data, assume sync is done or not needed (don't overwrite)
                localStorageAdapter.setItem(`sync_done_${user.id}`, true);
                return;
            }

            // Cloud is empty, try to upload local data
            setIsSyncing(true);
            try {
                console.log("Syncing local data to cloud...");
                const localTasks = localStorageAdapter.getItem('tasks');
                const localCategories = localStorageAdapter.getItem('categories');
                // Legacy session key from sessionStorage.ts
                const localSessions = localStorageAdapter.getItem('time_tracker_sessions');

                if (localTasks) await adapter.setItem(`${prefix}tasks`, localTasks);
                if (localCategories) await adapter.setItem(`${prefix}categories`, localCategories);
                if (localSessions) await adapter.setItem(`${prefix}sessions`, localSessions);

                localStorageAdapter.setItem(`sync_done_${user.id}`, true);
                console.log("Sync complete.");
            } catch (e) {
                console.error("Sync failed", e);
            } finally {
                setIsSyncing(false);
            }
        };

        checkAndSync();
    }, [user, adapter]);

    return { isSyncing };
};
