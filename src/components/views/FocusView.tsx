import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../../context/TaskContext';
import { useCategoryContext } from '../../context/CategoryContext';
import { usePlaylistContext } from '../../context/PlaylistContext';
import { Task } from '../../types';
import { CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useSoundContext } from '../../context/SoundContext';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../context/SessionContext';
import { useFocusSession } from '../../hooks/useFocusSession';
import { useUI } from '../../context/UIContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { motion } from 'framer-motion';

// UI Primitives
import { Heading, Text } from '../ui/Typography';
import { Page } from '../ui/Layout';
import { SessionControls } from '../focus/SessionControls';

// Modular Components
import { COLOR_HEX_MAP } from '../../constants/colors';
import { LAYOUT } from '../../constants/layout';
import { FocusTopBar } from '../focus/FocusTopBar';
import { FocusSidebar } from '../focus/FocusSidebar';
import { FocusStage } from '../focus/FocusStage';
import { FocusSettingsModal } from '../focus/FocusSettingsModal';

const FocusView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { tasks, updateTaskDetails, toggleComplete } = useTaskContext();
    const { categories } = useCategoryContext();
    const { playlists } = usePlaylistContext();
    const { playSfx } = useSoundContext();
    const { isZenMode, setZenMode } = useUI();

    // --- State ---
    // Lazy initialization to prevent layout shift on load
    const [contextPanelOpen, setContextPanelOpen] = useState(() => window.innerWidth >= 1024);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showCompletedWarning, setShowCompletedWarning] = useState(false);
    const [showLastTaskWarning, setShowLastTaskWarning] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [settings, setSettings] = useState({
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartNext: false
    });

    const { activePlaylistId, sessionQueue, setPlaylistContext } = useSession();

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
    const activeTask = useMemo(() => {
        if (resolvedContext.type === 'task') return resolvedContext.data as Task;
        if (resolvedContext.type === 'playlist') {
            const p = resolvedContext.data as typeof playlists[0];
            return tasks.find(t => p.taskIds.includes(t.id) && !t.completed) || tasks.find(t => p.taskIds.includes(t.id));
        }
        return tasks.find(t => t.isRunning);
    }, [resolvedContext, tasks]);

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

    const activeCategory = useMemo(() =>
        categories.find(c => String(c.id) === String(activeTask?.categoryId)),
        [activeTask, categories]
    );

    const ambientColor = useMemo(() => {
        if (!activeCategory?.color) return COLOR_HEX_MAP.slate;
        return COLOR_HEX_MAP[activeCategory.color] || COLOR_HEX_MAP.slate;
    }, [activeCategory]);

    const queue = useMemo(() => {
        if (sessionQueue && sessionQueue.length > 0) {
            return sessionQueue.map(id => tasks.find(t => t.id === id)).filter((t): t is Task => !!t);
        }
        if (activePlaylist) {
            return tasks.filter(t => activePlaylist.taskIds.includes(t.id));
        }
        return tasks.filter(t => !t.completed && t.id !== activeTask?.id);
    }, [tasks, activeTask, activePlaylist, sessionQueue]);

    // --- Hooks ---
    useEffect(() => {
        if (window.innerWidth >= 1024) setContextPanelOpen(true);
    }, []);

    const {
        isTimerRunning,
        toggleTimer,
        timeLeft,
        startNewSet,
        showNewSetPrompt,
        setShowNewSetPrompt
    } = useFocusSession({
        activeTask,
        settings,
        handlers: {
            startTask: () => updateTaskDetails({ ...activeTask!, isRunning: true, lastStartTime: Date.now() }),
            stopTask: () => updateTaskDetails({ ...activeTask!, isRunning: false }),
            updateTaskDetails,
            playCompleteSound: () => playSfx('complete')
        }
    });

    useEffect(() => {
        if (!isTimerRunning) setControlsVisible(true);
    }, [isTimerRunning]);

    // --- Handlers ---
    const handleComplete = useCallback(() => {
        if (activeTask) toggleComplete(activeTask.id);
        const nextTask = queue.find(t => !t.completed && t.id !== activeTask?.id);
        if (nextTask) navigate(`/focus/${nextTask.id}`);
        else setShowNewSetPrompt(true);
    }, [activeTask, queue, toggleComplete, navigate, setShowNewSetPrompt]);

    const handleSkip = useCallback(() => {
        const nextTask = queue.find(t => !t.completed);
        if (nextTask) navigate(`/focus/${nextTask.id}`);
        else setShowLastTaskWarning(true);
    }, [queue, navigate]);

    const handleToggleSubtask = useCallback((subId: string) => {
        if (!activeTask) return;
        const newSubtasks = activeTask.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        updateTaskDetails({ ...activeTask, subtasks: newSubtasks });
    }, [activeTask, updateTaskDetails]);

    const handleAddSubtask = useCallback((title: string) => {
        if (!activeTask) return;
        updateTaskDetails({ ...activeTask, subtasks: [...(activeTask.subtasks || []), { id: Date.now().toString(), title, completed: false }] });
    }, [activeTask, updateTaskDetails]);

    const handleBackgroundClick = () => {
        if (isTimerRunning) setControlsVisible(prev => !prev);
    };

    return (
        <Page
            className={`relative h-[100dvh] w-full bg-bg-main overflow-hidden flex flex-col font-sans transition-all duration-500 ease-[${LAYOUT.FOCUS.TRANSITION_EASE}] ${contextPanelOpen ? LAYOUT.FOCUS.SIDEBAR_SHIFT_CLASS : ''}`}
            onClick={handleBackgroundClick}
        >
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div
                    animate={{
                        background: `radial-gradient(circle at 50% 50%, ${ambientColor}20 0%, transparent 60%)`,
                    }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full opacity-60 dark:opacity-40 scale-150"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-bg-main/50 via-bg-main/80 to-bg-main" />
            </div>

            {/* Top Bar */}
            <FocusTopBar
                isTimerRunning={isTimerRunning}
                controlsVisible={controlsVisible}
                isZenMode={isZenMode}
                setZenMode={setZenMode}
                sidebarOpen={contextPanelOpen}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onToggleSidebar={() => setContextPanelOpen(prev => !prev)}
            />

            {/* Main Stage */}
            <FocusStage
                activeTask={activeTask}
                isTimerRunning={isTimerRunning}
                timeLeft={timeLeft}
                settings={settings}
                controlsVisible={controlsVisible}
                ambientColor={ambientColor}
                contextPanelOpen={contextPanelOpen}
                tasksCount={tasks.length}
                category={activeCategory}
                playlist={activePlaylist || undefined}
            />

            {/* Floating Player */}
            <div
                className={`
                    absolute bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 pointer-events-none
                    transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pb-safe
                    ${(isTimerRunning && !controlsVisible) ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}
                    ${contextPanelOpen ? LAYOUT.FOCUS.PLAYER_SHIFT_CLASS : ''}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pointer-events-auto flex justify-center">
                    <SessionControls
                        isTimerRunning={isTimerRunning}
                        onToggle={toggleTimer}
                        onComplete={handleComplete}
                        onSkip={handleSkip}
                        canSkip={true}
                    />
                </div>
            </div>

            {/* Sidebar */}
            <FocusSidebar
                isOpen={contextPanelOpen}
                onClose={() => setContextPanelOpen(false)}
                activeTask={activeTask}
                queue={queue}
                categories={categories}
                onToggleSubtask={handleToggleSubtask}
                onAddSubtask={handleAddSubtask}
                onReorder={() => { }} // Reorder visual only for now
                onQueueSelect={(t) => navigate(`/focus/${t.id}`)}
            />

            {/* Modals & Overlays */}
            <Modal isOpen={showCompletedWarning} onClose={() => setShowCompletedWarning(false)} title={t('focus.task_completed_title')} className="max-w-sm">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 ring-4 ring-emerald-500/5"><CheckCircle size={32} /></div>
                    <Text className="mb-8 text-text-secondary">{t('focus.completed_warning_msg') || "Task marked as complete."}</Text>
                    <Button onClick={() => setShowCompletedWarning(false)} className="w-full">{t('common.continue') || "Continue"}</Button>
                </div>
            </Modal>

            <Modal isOpen={showLastTaskWarning} onClose={() => setShowLastTaskWarning(false)} title={t('focus.last_task_title') || "Last Task"} className="max-w-sm">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 ring-4 ring-blue-500/5"><CheckCircle size={32} /></div>
                    <Text className="mb-8 text-text-secondary">{t('focus.last_task_msg')}</Text>
                    <Button onClick={() => setShowLastTaskWarning(false)} className="w-full">{t('common.got_it')}</Button>
                </div>
            </Modal>

            {showNewSetPrompt && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <Heading variant="h2" className="text-white mb-2 text-4xl">{t('focus.session_complete_title')}</Heading>
                    <Text className="text-white/60 mb-10 text-lg">{t('focus.session_complete_msg')}</Text>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                        <Button onClick={startNewSet} variant="primary" size="lg" className="w-full shadow-2xl shadow-brand/40 ring-1 ring-white/20">{t('focus.start_next_set')}</Button>
                        <Button onClick={() => setShowNewSetPrompt(false)} variant="secondary" size="lg" className="w-full bg-white/5 border-white/10 hover:bg-white/10">{t('focus.take_break_btn')}</Button>
                    </div>
                </div>
            )}
        </Page>
    );
};

export default function FocusViewWrapped() {
    return (
        <ErrorBoundary>
            <FocusView />
        </ErrorBoundary>
    );
}
