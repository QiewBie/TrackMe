
import React, { createContext, useContext, ReactNode } from 'react';
import { usePlaylists } from '../hooks/usePlaylists';
import { Playlist } from '../types';

export interface PlaylistContextType {
    playlists: Playlist[];
    createPlaylist: (title: string) => Promise<Playlist>;
    updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
    deletePlaylist: (id: string) => Promise<void>;
    restorePlaylist: (playlist: Playlist) => Promise<void>;
    addTaskToPlaylist: (playlistId: string, taskId: string) => Promise<void>;
    addTasksToPlaylist: (playlistId: string, taskIds: string[]) => Promise<void>;
    removeTaskFromPlaylist: (playlistId: string, taskId: string) => Promise<void>;
    reorderTasks: (playlistId: string, newTaskIds: string[]) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const playlistState = usePlaylists();

    return (
        <PlaylistContext.Provider value={playlistState}>
            {children}
        </PlaylistContext.Provider>
    );
};

export const usePlaylistContext = () => {
    const context = useContext(PlaylistContext);
    if (!context) throw new Error('usePlaylistContext must be used within a PlaylistProvider');
    return context;
};
