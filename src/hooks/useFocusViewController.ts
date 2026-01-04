import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import { useCategoryContext } from '../context/CategoryContext';
import { usePlaylistContext } from '../context/PlaylistContext';
import { useFocusContext } from '../context/FocusSessionContext';
import { Task } from '../types';
import { getThemeColor } from '../utils/theme';

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
            // Fix: Return undefined if all tasks are completed. Do NOT fallback to first task.
            return tasks.find(t => p.taskIds.includes(t.id) && !t.completed) || undefined;
        }

        // Fallback Logic: Running Task -> Last Active Task -> First Incomplete Task in Queue?
        const candidate = tasks.find(t => t.isRunning) || (lastActiveId ? tasks.find(t => t.id === lastActiveId) : undefined);

        // CRITICAL FIX: If we have an active playlist (from context), we MUST NOT select a task 
        // that is completed, or one that is not in the playlist (if we want strict scope).
        // Check if candidate matches active playlist logic
        if (activePlaylistId && candidate) {
            const p = playlists.find(pl => pl.id === activePlaylistId);
            if (p) {
                // If the candidate task is IN the playlist but COMPLETED, discard it to show "All Done".
                if (p.taskIds.includes(candidate.id) && candidate.completed) {
                    // Try to find ANY incomplete task in this playlist instead
                    const next = tasks.find(t => p.taskIds.includes(t.id) && !t.completed);
                    return next || candidate;
                }
            }
        }

        return candidate;
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
        if (activePlaylistId) return playlists.find(p => p.id === activePlaylistId) || undefined;
        if (activeTask) return playlists.find(p => p.taskIds.includes(activeTask.id)) || undefined;
        return undefined;
    }, [resolvedContext, activePlaylistId, playlists, activeTask]);

    // --- Session Hydration & Sync ---
    useEffect(() => {
        // ZOMBIE CHECK: If we have an ID but no playlist matches, it must have been deleted.
        // We only check this if NOT loading by route ID (which might be invalid for other reasons).
        if (activePlaylistId && !playlists.find(p => p.id === activePlaylistId)) {
            console.log('[FocusVC] Active playlist deleted. Clearing session context.');
            setPlaylistContext(null, []);
            return;
        }

        if (resolvedContext.type === 'playlist') {
            const p = resolvedContext.data as typeof playlists[0];

            // Scenario 1: First Load / Switch Playlist
            if (activePlaylistId !== p.id) {
                setPlaylistContext(p.id, p.taskIds);
            }
        }

        // UNIVERSAL SYNC: Always check if the active playlist (in context) has drifted from its source
        // This handles cases where we are on /focus (resolvedContext='none') but the playlist changed in background.
        if (activePlaylistId) {
            const sourcePlaylist = playlists.find(p => p.id === activePlaylistId);
            if (sourcePlaylist) {
                const sourceSig = JSON.stringify(sourcePlaylist.taskIds);
                const localSig = JSON.stringify(sessionQueue);

                if (sourceSig !== localSig) {
                    console.log('[FocusVC] Universal Sync: Updating Session Queue', sourcePlaylist.taskIds);
                    setPlaylistContext(activePlaylistId, sourcePlaylist.taskIds);
                }
            }
        }
    }, [resolvedContext, activePlaylistId, sessionQueue, setPlaylistContext, playlists]);

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
        if (!activeCategory?.color) return getThemeColor('--palette-slate'); // Default to slate

        // activeCategory.color might be 'indigo' (semantic ID) or 'bg-indigo-500' (legacy)
        let colorKey = activeCategory.color.replace('bg-', '').split('-')[0]; // Extract 'indigo'

        // Map common color names to CSS variables
        // We can just rely on getThemeColor if we map names to variables:
        const varMap: Record<string, string> = {
            indigo: '--palette-indigo',
            blue: '--palette-blue',
            emerald: '--palette-emerald',
            green: '--palette-green',
            red: '--palette-red',
            rose: '--palette-red',
            amber: '--palette-amber',
            orange: '--palette-amber', // Map orange to amber for now or add specific var
            purple: '--palette-purple',
            violet: '--palette-purple',
            pink: '--palette-pink',
            cyan: '--palette-cyan',
            slate: '--palette-slate',
            gray: '--palette-slate',
        };

        const varName = varMap[colorKey] || '--palette-slate';
        return getThemeColor(varName);

    }, [activeCategory]);

    const queue = useMemo(() => {
        // Priority 1: Explicit Session Queue
        if (sessionQueue && sessionQueue.length > 0) {
            // FIX: Filter to ensure tasks actually exist (handles deletion)
            // AND if there is an active playlist, restrict to its taskIds (strict sync)
            return sessionQueue
                .map(id => tasks.find(t => t.id === id))
                .filter((t): t is Task => {
                    if (!t) return false;
                    if (activePlaylist && !activePlaylist.taskIds.includes(t.id)) return false; // Strict Playlist Sync
                    return true;
                });
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

    // Actions
    const updateQueue = useCallback((newQueue: Task[]) => {
        setPlaylistContext(activePlaylistId || 'temp', newQueue.map(t => t.id));
    }, [activePlaylistId, setPlaylistContext]);

    const controllerAPI = useMemo(() => ({
        // Data
        activeTask,
        activePlaylist,
        activeCategory,
        ambientColor,
        queue,
        tasks,
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
        updateQueue
    }), [
        activeTask, activePlaylist, activeCategory, ambientColor, queue, tasks, categories,
        navigate,
        contextPanelOpen, isSettingsOpen, showCompletedWarning, showLastTaskWarning, controlsVisible, settings,
        updateQueue
    ]);

    return controllerAPI;
};
