import { useState, useEffect, cloneElement, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useSearchParams, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

// Hooks
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { readFileAsDataURL } from '../utils/fileHelpers';
import { useDynamicFavicon } from '../hooks/useDynamicFavicon';
import { useCategoryContext } from '../context/CategoryContext';
import { useTaskContext } from '../context/TaskContext';
import { useConfirmation } from '../hooks/useConfirmation';
import { useDataSync } from '../hooks/useDataSync';
import TaskDetailsModal from './tasks/TaskDetailsModal';
import ConfirmationModal from './shared/ConfirmationModal';
import UndoToast from './shared/UndoToast';
// Components
import Sidebar from './layout/Sidebar';
import BottomNav from './layout/BottomNav';
import CategoryManager from './categories/CategoryManager';
import { User, FilterType, Task } from '../types';

import { useProjectNotes } from '../hooks/useProjectNotes';
import { ProjectNote } from '../types';

export interface DashboardContextType {
    user: User;
    setUser: (user: User) => void;
    updateAvatar: (file: File) => void;
    logout: () => void;
    deleteProfile: (id: string) => void;
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
    scrollContainer: HTMLElement | null;
    getProjectNote: (categoryId: string) => ProjectNote | undefined;
    saveProjectNote: (categoryId: string, content: string) => void;
    onEdit: (task: Task | null) => void;
    onDeleteTask: (task: Task) => void;
}

const Dashboard = () => {
    const { t } = useTranslation();
    useDynamicFavicon();
    useDataSync();

    // UI Context
    const {
        isMobileMenuOpen, setMobileMenuOpen,
        isCategoryManagerOpen, openCategoryManager, closeCategoryManager,
        isZenMode
    } = useUI();

    // URL Params for Filter
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filter = (searchParams.get('filter') as FilterType) || 'all';

    const setFilter = (newFilter: FilterType) => {
        navigate(`/?filter=${newFilter}`);
    };

    // Modal State
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Undo State
    const [undoTask, setUndoTask] = useState<Task | null>(null);
    const { user: authUser, updateProfile, logout, deleteProfile } = useAuth();

    // Dashboard is protected by App wrapper, but we handle null for TS safety
    if (!authUser) return null;
    const user = authUser;

    // Adapter for legacy props
    const setUser = updateProfile;
    const updateAvatar = async (file: File) => {
        try {
            const avatarUrl = await readFileAsDataURL(file);
            if (user) {
                updateProfile({ ...user, avatar: avatarUrl });
            }
        } catch (error) {
            console.error("Failed to upload avatar", error);
        }
    };

    // Scroll Container State
    const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

    // Project Notes
    const { getNote: getProjectNote, saveNote: saveProjectNote } = useProjectNotes();

    // We need tasks/handleDelete for the contextValue.
    const {
        tasks,
        updateTaskDetails,
        deleteTask: deleteTaskById,
        restoreTask
    } = useTaskContext();

    // Delete Confirmation Hook
    const {
        itemToDelete: taskToDelete,
        requestDelete: handleDelete,
        cancelDelete: cancelDelete,
        confirmDelete: confirmDelete
    } = useConfirmation<Task>((task) => {
        deleteTaskById(task.id);
        setUndoTask(task); // Start undo timer

        // If deleting open task, close details
        if (selectedTask?.id === task.id) {
            setSelectedTask(null);
        }
    });

    // Context for consumers
    const contextValue: DashboardContextType = useMemo(() => ({
        user,
        setUser, updateAvatar, logout, deleteProfile,
        filter, setFilter,
        scrollContainer,
        getProjectNote, saveProjectNote,
        onEdit: setSelectedTask,
        onDeleteTask: handleDelete
    }), [user, setUser, updateAvatar, logout, deleteProfile, filter, scrollContainer, getProjectNote, saveProjectNote, setSelectedTask, handleDelete]);

    const handleUndo = () => {
        if (undoTask) {
            restoreTask(undoTask);
            setUndoTask(null);
        }
    };

    // Legacy support: The "handleDelete" exposed to context expects "Task" object
    // but consumers might be using it differently.
    // DashboardContextType says: handleDelete: (task: Task) => void;
    // So "requestDelete" from useConfirmation matches this signature perfectly.

    const location = useLocation();
    const outlet = useOutlet(contextValue);

    const { categories, setCategories } = useCategoryContext();

    return (
        <div className="flex h-[100dvh] w-full bg-bg-main text-text-primary font-sans overflow-hidden">
            <Sidebar
                filter={filter} setFilter={setFilter}
                categories={categories}
                user={user}
            />

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 z-[90] lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col min-w-0 h-full">
                {/* Mobile Header */}
                {/* Mobile Header - Dynamic Title */}
                <header className="lg:hidden h-16 bg-bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-40 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {/* Show category color if applicable */}
                        {(() => {
                            // Logic to determine title
                            let title = "TrackMe";
                            let color = "";

                            if (location.pathname === '/analytics') {
                                title = t('analytics.title');
                            } else if (location.pathname === '/profile') {
                                title = t('profile.title');
                            } else if (location.pathname === '/settings') {
                                title = t('settings.title') || "Settings";
                            } else if (location.pathname.startsWith('/focus')) {
                                title = t('focus.title') || "Focus Mode";
                            } else if (filter === 'all') {
                                title = t('tasks.overview');
                            } else {
                                const cat = categories.find(c => String(c.id) === String(filter));
                                title = cat ? cat.name : t('tasks.project_view');
                                color = cat?.color || "";
                            }

                            return (
                                <>
                                    {color && <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />}
                                    <span className="font-bold text-lg truncate">{title}</span>
                                </>
                            );
                        })()}
                    </div>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 active:scale-90 transition-transform text-text-primary" aria-label="Open menu">
                        <Menu />
                    </button>
                </header>

                <div
                    ref={setScrollContainer}
                    className="flex-1 overflow-y-auto scroll-smooth p-0 mb-16 lg:mb-0"
                >
                    <AnimatePresence mode="wait">
                        {outlet && cloneElement(outlet, { key: location.pathname })}
                    </AnimatePresence>
                </div>
            </main>

            <BottomNav />

            {/* Modals */}
            <CategoryManager
                isOpen={isCategoryManagerOpen}
                onClose={closeCategoryManager}
                categories={categories}
                setCategories={setCategories}
            />

            <TaskDetailsModal
                key={selectedTask?.id}
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                categories={categories}
                onSave={updateTaskDetails}
                onDelete={(id) => {
                    const t = tasks.find(t => t.id === id);
                    if (t) handleDelete(t);
                    setSelectedTask(null);
                }}
            />
            <ConfirmationModal
                isOpen={!!taskToDelete}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={t('tasks.delete_confirm_title')}
                message={t('tasks.delete_confirm_msg', { title: taskToDelete?.title || '' })}
            />

            {undoTask && (
                <UndoToast
                    onUndo={handleUndo}
                    onClose={() => setUndoTask(null)}
                />
            )}
        </div >
    );
};

export default Dashboard;
