import { useCallback, useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { Playlist } from '../types';

export const usePlaylists = () => {
    const storage = useStorage();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    // Initial Load & Sync
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupSync = async () => {
            const adapter = storage as any;

            // Check if adapter supports subscription (Firestore)
            if (adapter && adapter.subscribeToPlaylists) {
                console.log('[usePlaylists] Subscribing to Cloud Playlists');
                unsubscribe = await adapter.subscribeToPlaylists((remotePlaylists: Playlist[]) => {
                    setPlaylists(remotePlaylists);
                });
            } else {
                // Fallback for LocalStorage
                const loaded = await storage.getItem<Playlist[]>('playlists');
                if (loaded) {
                    setPlaylists(loaded);
                }
            }
        };

        setupSync();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [storage]);

    const createPlaylist = useCallback(async (title: string) => {
        const newPlaylist: Playlist = {
            id: crypto.randomUUID(),
            title,
            taskIds: [],
            settings: {
                mode: 'manual',
                workDuration: 25,
                shortBreak: 5,
                longBreak: 15,
                autoStartNext: false
            },
            createdAt: new Date().toISOString()
        };

        setPlaylists(prev => [newPlaylist, ...prev]);
        await storage.savePlaylist(newPlaylist);

        return newPlaylist;
    }, [storage]);

    const updatePlaylist = useCallback(async (id: string, updates: Partial<Playlist>) => {
        setPlaylists(prev => {
            const current = prev.find(p => p.id === id);
            if (!current) return prev;

            const updated = { ...current, ...updates };
            storage.savePlaylist(updated); // Side effect in setter callback? Ideally separate.

            return prev.map(p => p.id === id ? updated : p);
        });
    }, [storage]);

    const deletePlaylist = useCallback(async (id: string) => {
        setPlaylists(prev => prev.filter(p => p.id !== id));
        await storage.deletePlaylist(id);
    }, [storage]);

    const addTasksToPlaylist = useCallback(async (playlistId: string, taskIds: string[]) => {
        setPlaylists(prev => {
            const current = prev.find(p => p.id === playlistId);
            if (!current) return prev;

            const newIds = taskIds.filter(id => !current.taskIds.includes(id));
            if (newIds.length === 0) return prev;

            const updated = { ...current, taskIds: [...current.taskIds, ...newIds] };
            storage.savePlaylist(updated);

            return prev.map(p => p.id === playlistId ? updated : p);
        });
    }, [storage]);

    const addTaskToPlaylist = useCallback(async (playlistId: string, taskId: string) => {
        await addTasksToPlaylist(playlistId, [taskId]);
    }, [addTasksToPlaylist]);

    const removeTaskFromPlaylist = useCallback(async (playlistId: string, taskId: string) => {
        setPlaylists(prev => {
            const current = prev.find(p => p.id === playlistId);
            if (!current) return prev;

            const updated = { ...current, taskIds: current.taskIds.filter(id => id !== taskId) };
            storage.savePlaylist(updated);

            return prev.map(p => p.id === playlistId ? updated : p);
        });
    }, [storage]);

    const reorderTasks = useCallback(async (playlistId: string, newTaskIds: string[]) => {
        setPlaylists(prev => {
            const current = prev.find(p => p.id === playlistId);
            if (!current) return prev;

            const updated = { ...current, taskIds: newTaskIds };
            storage.savePlaylist(updated);

            return prev.map(p => p.id === playlistId ? updated : p);
        });
    }, [storage]);

    const restorePlaylist = useCallback(async (playlist: Playlist) => {
        setPlaylists(prev => {
            if (prev.some(p => p.id === playlist.id)) return prev;
            storage.savePlaylist(playlist);
            return [playlist, ...prev];
        });
    }, [storage]);

    return {
        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        restorePlaylist,
        addTaskToPlaylist,
        addTasksToPlaylist,
        removeTaskFromPlaylist,
        reorderTasks
    };
};

