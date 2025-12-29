import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import { useCategoryContext } from '../context/CategoryContext';
import { usePlaylistContext } from '../context/PlaylistContext';
import { useFocusContext } from '../context/FocusSessionContext';
import { Task } from '../types';
import { COLOR_HEX_MAP } from '../constants/colors';

export const useFocusViewController = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Global Contexts
    const { tasks } = useTaskContext();
    const { categories } = useCategoryContext();
    const { playlists } = usePlaylistContext();
    const { activePlaylistId, sessionQueue, setPlaylistContext, switchTask, activeSession } = useFocusContext();

    // Local UI State
    const [contextPanelOpen, setContextPanelOpen] = useState(() => window.innerWidth >= 1024);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCompletedWarning, setShowCompletedWarning] = useState(false);
    const [showLastTaskWarning, setShowLastTaskWarning] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);

    // Persist settings
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('focus_settings');
        return saved ? JSON.parse(saved) : {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            autoStartNext: false
        };
    });

    useEffect(() => {
        localStorage.setItem('focus_settings', JSON.stringify(settings));
    }, [settings]);

    // --- Route Resolution ---
    const resolvedContext = useMemo(() => {
        if (!id) return { type: 'none', data: null };
        const playlist = playlists.find(p => p.id === id);
        if (playlist) return { type: 'playlist', data: playlist };
        const task = tasks.find(t => t.id === id);
        if (task) return { type: 'task', data: task };
        return { type: 'unknown', data: null };
    }, [id, playlists, tasks]);

    // --- Derived Data ---
    // --- Derived Data ---
    const [lastActiveId, setLastActiveId] = useState(() => localStorage.getItem('last_active_focus_task_id'));

    const activeTask = useMemo(() => {
        if (resolvedContext.type === 'task') return resolvedContext.data as Task;
        if (resolvedContext.type === 'playlist') {
            const p = resolvedContext.data as typeof playlists[0];
            return tasks.find(t => p.taskIds.includes(t.id) && !t.completed) || tasks.find(t => p.taskIds.includes(t.id));
        }
        // Fallback Logic: Running Task -> Last Active Task -> First Incomplete Task in Queue? (Maybe too aggressive)
        return tasks.find(t => t.isRunning) || (lastActiveId ? tasks.find(t => t.id === lastActiveId) : undefined);
    }, [resolvedContext, tasks, lastActiveId]);

    // Persist active task
    useEffect(() => {
        if (activeTask) {
            setLastActiveId(activeTask.id);
            localStorage.setItem('last_active_focus_task_id', activeTask.id);
        }
    }, [activeTask?.id]);

    const activePlaylist = useMemo(() => {
        if (resolvedContext.type === 'playlist') return resolvedContext.data as typeof playlists[0];
        if (activePlaylistId) return playlists.find(p => p.id === activePlaylistId) || null;
        if (activeTask) return playlists.find(p => p.taskIds.includes(activeTask.id)) || null;
        return null;
    }, [resolvedContext, activePlaylistId, playlists, activeTask]);

    // --- Session Hydration ---
    useEffect(() => {
        if (resolvedContext.type === 'playlist') {
            const p = resolvedContext.data as typeof playlists[0];
            if (activePlaylistId !== p.id) {
                setPlaylistContext(p.id, p.taskIds);
            }
        }
    }, [resolvedContext, activePlaylistId, setPlaylistContext]);

    // --- Synchronization: Route <-> Session Context ---
    useEffect(() => {
        if (activeTask && activeSession?.taskId !== activeTask.id) {
            // The user navigated to a new task. Tell the Session Context to switch focus.
            // This ensures the timer displays the correct 'timeLeft' for the NEW task,
            // or creates a fresh session if none exists.
            switchTask(activeTask.id);
        }
    }, [activeTask, activeSession?.taskId, switchTask]);

    // --- Visuals ---
    const activeCategory = useMemo(() =>
        categories.find(c => String(c.id) === String(activeTask?.categoryId)),
        [activeTask, categories]
    );

    const ambientColor = useMemo(() => {
        if (!activeCategory?.color) return COLOR_HEX_MAP.slate;
        return COLOR_HEX_MAP[activeCategory.color] || COLOR_HEX_MAP.slate;
    }, [activeCategory]);

    const queue = useMemo(() => {
        // Priority 1: Explicit Session Queue
        if (sessionQueue && sessionQueue.length > 0) {
            return sessionQueue.map(id => tasks.find(t => t.id === id)).filter((t): t is Task => !!t);
        }
        // Priority 2: Active Playlist
        if (activePlaylist) {
            return tasks.filter(t => activePlaylist.taskIds.includes(t.id));
        }
        // Priority 3: Fallback (Just the active task, no random other tasks)
        // User feedback: "Don't show all account tasks"
        return activeTask ? [activeTask] : [];
    }, [tasks, activeTask, activePlaylist, sessionQueue]);

    // Auto-open sidebar on large screens
    useEffect(() => {
        if (window.innerWidth >= 1024) setContextPanelOpen(true);
    }, []);

    return {
        // Data
        activeTask,
        activePlaylist,
        activeCategory,
        ambientColor,
        queue,
        tasks, // Exposed for count
        categories,

        // Navigation
        navigate,

        // UI State
        contextPanelOpen,
        setContextPanelOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        showCompletedWarning,
        setShowCompletedWarning,
        showLastTaskWarning,
        setShowLastTaskWarning,
        controlsVisible,
        setControlsVisible,
        settings,
        setSettings,

        // Actions
        updateQueue: (newQueue: Task[]) => setPlaylistContext(activePlaylistId || 'temp', newQueue.map(t => t.id))
    };
};
