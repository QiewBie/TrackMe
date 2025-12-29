import React, { useState, useEffect, useCallback } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { Task } from '../../types';
import { CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useSoundContext } from '../../context/SoundContext';
import { useTranslation } from 'react-i18next';
import { useFocusSession } from '../../hooks/useFocusSession';
import { useUI } from '../../context/UIContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusViewController } from '../../hooks/useFocusViewController';

// UI Primitives
import { Heading, Text } from '../ui/Typography';
import { Page } from '../ui/Layout';
import { SessionControls } from '../focus/SessionControls';

// Modular Components
import { LAYOUT } from '../../constants/layout';
import { FocusTopBar } from '../focus/FocusTopBar';
import { FocusSidebar } from '../focus/FocusSidebar';
import { FocusStage } from '../focus/FocusStage';
import { FocusSettingsModal } from '../focus/FocusSettingsModal';
import { useFocusHotkeys } from '../../hooks/useFocusHotkeys';

const FocusView = () => {
    const { t } = useTranslation();

    // --- Controller ---
    const {
        activeTask,
        activePlaylist,
        activeCategory,
        ambientColor,
        queue,
        tasks,
        categories,
        navigate,
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
        updateQueue
    } = useFocusViewController();

    const { updateTaskDetails, toggleComplete } = useTaskContext();
    const { playSfx } = useSoundContext();
    const { isZenMode, setZenMode, setMobileMenuOpen } = useUI();

    // --- Mobile Logic ---
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [setMobileMenuOpen]);

    // --- Session Logic ---
    // Memoize handlers to prevent unstable references causing re-renders/glitches
    const handlers = React.useMemo(() => ({
        // Legacy handlers stubbed - SessionContext handles logic now
        startTask: () => { },
        stopTask: () => { },
        updateTaskDetails,
        playCompleteSound: () => playSfx('complete')
    }), [activeTask, updateTaskDetails, playSfx]);

    const {
        isTimerRunning,
        toggleTimer,
        timeLeft,
        startNewSet,
        showNewSetPrompt,
        setShowNewSetPrompt,
        stopSession, // V2: Use stopSession to flush logs
        updateSessionConfig // Exposed from context
    } = useFocusSession({
        activeTask,
        settings,
        handlers
    });

    // --- Sync Settings to Context ---
    useEffect(() => {
        updateSessionConfig(settings);
    }, [settings, updateSessionConfig]);

    // --- Effects ---
    useEffect(() => {
        if (!isTimerRunning) setControlsVisible(true);
    }, [isTimerRunning, setControlsVisible]);

    // --- Handlers ---
    const handleComplete = useCallback(() => {
        if (activeTask) {
            // STOP session to flush log
            stopSession();
            toggleComplete(activeTask.id);
        }
        const nextTask = queue.find(t => !t.completed && t.id !== activeTask?.id);
        if (nextTask) navigate(`/focus/${nextTask.id}`);
        else setShowNewSetPrompt(true);
    }, [activeTask, queue, toggleComplete, navigate, setShowNewSetPrompt, stopSession]);

    const handleSkip = useCallback(() => {
        if (!activeTask) return;

        // Do NOT stop session here. Let switchTask handle the transition and inheritance.

        const currentIndex = queue.findIndex(t => t.id === activeTask.id);

        // Find next UNCOMPLETED task after current index
        let nextTask = queue.slice(currentIndex + 1).find(t => !t.completed);

        // Wrap around if no next task found in linear order
        if (!nextTask) {
            nextTask = queue.find(t => !t.completed && t.id !== activeTask.id);
        }

        if (nextTask) {
            navigate(`/focus/${nextTask.id}`);
            return;
        }

        setShowLastTaskWarning(true);
    }, [queue, activeTask, navigate, handlers, setShowLastTaskWarning]);

    const handleToggleSubtask = useCallback((subId: string) => {
        if (!activeTask) return;
        const newSubtasks = activeTask.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        updateTaskDetails({ ...activeTask, subtasks: newSubtasks });
    }, [activeTask, updateTaskDetails]);

    const handleAddSubtask = useCallback((title: string) => {
        if (!activeTask) return;
        updateTaskDetails({ ...activeTask, subtasks: [...(activeTask.subtasks || []), { id: Date.now().toString(), title, completed: false }] });
    }, [activeTask, updateTaskDetails]);

    // --- Hotkeys ---
    useFocusHotkeys({
        handlers: {
            toggleTimer,
            skipTask: handleSkip,
            toggleZenMode: () => setZenMode(!isZenMode),
            toggleSidebar: () => setContextPanelOpen(prev => !prev)
        }
    });

    // --- Interaction Logic (Move-to-Wake) ---
    const [mouseMoving, setMouseMoving] = useState(false);
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleMouseMove = () => {
            setControlsVisible(true);
            setMouseMoving(true);
            clearTimeout(timeout);
            if (isTimerRunning) {
                timeout = setTimeout(() => {
                    setControlsVisible(false);
                    setMouseMoving(false);
                }, 3000); // Hide after 3s of stillness
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchstart', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isTimerRunning]);

    return (
        <Page
            className={`w-full h-full relative bg-bg-main overflow-hidden flex flex-col font-sans transition-all duration-500 ease-spring z-30 ${contextPanelOpen ? 'md:pr-sidebar-focus' : ''}`}
        >
            {/* Ambient Background - Optimized */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div
                    className="absolute inset-0 w-full h-full opacity-60 dark:opacity-40 scale-150 transition-colors duration-1000 ease-in-out"
                    style={{
                        background: `radial-gradient(circle at 50% 50%, ${ambientColor}20 0%, transparent 60%)`
                    }}
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
                onBack={() => navigate('/')}
            />

            {/* Main Stage */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTask?.id || 'empty'}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex-1 w-full flex flex-col items-center justify-center relative min-h-0"
                >
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
                </motion.div>
            </AnimatePresence>

            {/* Floating Player */}
            <div
                className={`
                    absolute bottom-6 left-4 right-4 z-40 flex items-end justify-center pointer-events-none
                    lg:bottom-12 lg:left-0 lg:right-0 lg:w-full lg:px-0
                    transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pb-safe
                    ${(isTimerRunning && !controlsVisible) ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}
                    ${contextPanelOpen ? 'lg:pr-[400px]' : ''}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pointer-events-auto w-full flex justify-center px-4">
                    <SessionControls
                        isTimerRunning={isTimerRunning}
                        onToggle={toggleTimer}
                        onSkip={handleSkip}
                        onComplete={handleComplete}
                        canSkip={true}
                    />
                </div>
            </div>

            {/* Sidebar */}
            <FocusSidebar
                isOpen={contextPanelOpen}
                onClose={() => setContextPanelOpen(false)}
                activeTask={activeTask}
                activePlaylist={activePlaylist}
                queue={queue}
                categories={categories}
                onToggleSubtask={handleToggleSubtask}
                onAddSubtask={handleAddSubtask}
                onReorder={updateQueue}
                onQueueSelect={(t) => navigate(`/focus/${t.id}`)}
            />

            {/* Modals & Overlays */}
            <Modal isOpen={showCompletedWarning} onClose={() => setShowCompletedWarning(false)} title={t('focus.task_completed_title')} className="max-w-sm">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mb-6 ring-4 ring-status-success/5"><CheckCircle size={32} /></div>
                    <Text className="mb-8 text-text-secondary">{t('focus.completed_warning_msg') || "Task marked as complete."}</Text>
                    <Button onClick={() => setShowCompletedWarning(false)} className="w-full">{t('common.continue') || "Continue"}</Button>
                </div>
            </Modal>

            <Modal isOpen={showLastTaskWarning} onClose={() => setShowLastTaskWarning(false)} title={t('focus.last_task_title') || "Last Task"} className="max-w-sm">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6 ring-4 ring-brand-primary/5"><CheckCircle size={32} /></div>
                    <Text className="mb-8 text-text-secondary">{t('focus.last_task_msg')}</Text>
                    <Button onClick={() => setShowLastTaskWarning(false)} className="w-full">{t('common.got_it')}</Button>
                </div>
            </Modal>

            {/* Settings Modal - Wired up */}
            <FocusSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={setSettings}
            />

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
