import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';
import { useCategoryContext } from '../context/CategoryContext';
import { usePlaylistContext } from '../context/PlaylistContext';
import { useSession } from '../context/SessionContext';
import { Task } from '../types';
import { getThemeColor } from '../utils/theme';

export const useFocusViewController = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Global Contexts
    const { tasks } = useTaskContext();
    const { categories } = useCategoryContext();
    const { playlists } = usePlaylistContext();

    // NEW: Use SessionContext instead of FocusSessionContext
    const { session, switchTask, setPlaylist, stop, start } = useSession();

    // Auto-cleanup Zombie Manual Sessions
    // SAFEGUARDS to prevent false positives during navigation:
    // 1. No playlist (manual session only)
    // 2. Session is PAUSED (not running)
    // 3. Tasks are loaded (prevent race condition)
    // 4. Active task exists AND is completed
    useEffect(() => {
        // Guard: Skip if no session or has playlist
        if (!session || session.playlistId) return;

        // Guard: Only cleanup paused sessions
        if (session.status === 'running') return;

        // Guard: Wait for tasks to load
        if (tasks.length === 0) return;

        // Check if active task exists
        const activeTask = session.taskId ? tasks.find(t => t.id === session.taskId) : null;

        // Guard: If task doesn't exist, it was deleted - cleanup orphan
        if (session.taskId && !activeTask) {
            console.log('[FocusVC] Orphan session (task deleted), cleaning up');
            stop();
            return;
        }

        // Only cleanup if task is completed AND no pending tasks
        if (activeTask?.completed) {
            const hasPending = session.queue?.some(id => !tasks.find(t => t.id === id)?.completed);
            if (!hasPending) {
                console.log('[FocusVC] All tasks completed, cleaning up session');
                stop();
            }
        }
    }, [session, tasks, stop]);

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
        // PRIORITY 0: Route-derived task takes precedence (user explicitly navigated)
        if (resolvedContext.type === 'task') return resolvedContext.data as Task;
        if (resolvedContext.type === 'playlist') {
            const p = resolvedContext.data as typeof playlists[0];
            // Fix: Return undefined if all tasks are completed. Do NOT fallback to first task.
            // Safely access taskIds in case of malformed data
            return tasks.find(t => p.taskIds?.includes(t.id) && !t.completed) || undefined;
        }

        // PRIORITY 1: If no explicit route, use session's taskId as source of truth
        if (session?.taskId) {
            // Fix: If session has a playlistId that doesn't exist, ignore the task (orphaned session)
            if (session.playlistId && !playlists.find(p => p.id === session.playlistId)) {
                return undefined;
            }

            const task = tasks.find(t => t.id === session.taskId);
            if (task) return task;
        }

        // Fallback Logic:
        // REMOVED: tasks.find(t => t.isRunning).
        // REASON: Stale 'isRunning' flags on tasks (from V1 or uncleaned sessions) cause "Zombie Tasks" to persist.
        const candidate = undefined;

        // (Dead logic removed)

        return candidate;
    }, [resolvedContext, tasks, lastActiveId, session?.taskId, session?.playlistId, playlists]);

    // Persist active task
    useEffect(() => {
        if (activeTask) {
            setLastActiveId(activeTask.id);
            localStorage.setItem('last_active_focus_task_id', activeTask.id);
        }
    }, [activeTask?.id]);

    const activePlaylist = useMemo(() => {
        if (resolvedContext.type === 'playlist') return resolvedContext.data as typeof playlists[0];
        if (session?.playlistId) return playlists.find(p => p.id === session.playlistId) || undefined;
        if (activeTask) return playlists.find(p => p.taskIds?.includes(activeTask.id)) || undefined;
        return undefined;
    }, [resolvedContext, session?.playlistId, playlists, activeTask]);

    // --- Session Hydration & Sync (SIMPLIFIED for new SessionContext) ---
    useEffect(() => {
        if (resolvedContext.type === 'playlist') {
            const p = resolvedContext.data as typeof playlists[0];
            const firstTask = tasks.find(t => p.taskIds.includes(t.id) && !t.completed);

            // FIX: Create session if none exists
            if (!session && firstTask) {
                console.log('[FocusVC] Creating new session for playlist:', p.id);
                // Add catch to prevent unhandled rejections
                start(firstTask.id, { mode: 'focus', duration: settings.workDuration }, p.id, p.taskIds)
                    .catch(err => console.error('[FocusVC] Failed to auto-start session:', err));
                return;
            }

            // Update playlist in session if different
            if (session && session.playlistId !== p.id) {
                // Add catch blocks
                setPlaylist(p.id, p.taskIds).catch(err => console.error('[FocusVC] Failed to set playlist:', err));

                // Also switch to first incomplete task in new playlist
                if (firstTask && session.taskId !== firstTask.id) {
                    switchTask(firstTask.id).catch(err => console.error('[FocusVC] Failed to switch task:', err));
                }
            }
        }
    }, [resolvedContext, session, setPlaylist, playlists, tasks, switchTask, start, settings.workDuration]);

    // --- Synchronization: Route <-> Session Context (SIMPLIFIED) ---
    const lastRouteTaskId = useRef<string | undefined>(activeTask?.id);

    useEffect(() => {
        // User Navigated (Route -> Session)
        if (activeTask?.id && activeTask.id !== lastRouteTaskId.current) {
            lastRouteTaskId.current = activeTask.id;

            // Switch session task if different
            if (session?.taskId !== activeTask.id) {
                switchTask(activeTask.id);
            }
        }

        // Remote Session Changed (Session -> Route)
        if (session?.taskId && activeTask?.id !== session.taskId) {
            navigate(`/focus/${session.taskId}`, { replace: true });
        }
    }, [activeTask?.id, session?.taskId, switchTask, navigate]);

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
        // Priority 1: Explicit Session Queue from cloud
        if (session?.queue && session.queue.length > 0) {
            // Fix: If session has a playlistId that doesn't exist, ignore the queue (it's orphaned)
            if (session.playlistId && !playlists.find(p => p.id === session.playlistId)) {
                return [];
            }

            const mapped = session.queue
                .map(id => tasks.find(t => t.id === id))
                .filter((t): t is Task => {
                    if (!t) return false;
                    if (activePlaylist && !activePlaylist.taskIds.includes(t.id)) return false;
                    return true;
                });
            return mapped;
        }
        // Priority 2: Active Playlist
        if (activePlaylist) {
            return tasks.filter(t => activePlaylist.taskIds?.includes(t.id));
        }
        // Priority 3: Fallback (Just the active task)
        return activeTask ? [activeTask] : [];
    }, [tasks, activeTask, activePlaylist, session?.queue]); // Note: data.tasks updates frequently (cachedTotalTime).
    // This causes 'queue' to be new array reference every second if playing.
    // Framer Motion Reorder.Group CANNOT handle reference churn during drag.
    // We must stabilize this in the UI (Sidebar) or here.
    // Stabilizing here is hard because tasks DO change.
    // See FocusSidebar for local state fix.

    // Auto-open sidebar on large screens
    useEffect(() => {
        if (window.innerWidth >= 1024) setContextPanelOpen(true);
    }, []);

    // Actions
    const { updateQueue: updateSessionQueue } = useSession();
    const updateQueue = useCallback((newQueue: Task[]) => {
        updateSessionQueue(newQueue.map(t => t.id));
    }, [updateSessionQueue]);

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
