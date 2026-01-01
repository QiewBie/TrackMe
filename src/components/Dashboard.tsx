import * as React from 'react';
import { cloneElement } from 'react';
import { Menu } from 'lucide-react';
import { Outlet, useLocation, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

// Hooks
import { useUI } from '../context/UIContext';
import { useDynamicFavicon } from '../hooks/useDynamicFavicon';
import { useCategoryContext } from '../context/CategoryContext';
import { useDataSync } from '../hooks/useDataSync';
import { useDashboardController } from '../hooks/useDashboardController';
import { useLayout } from '../context/LayoutContext';

// Components
import TaskDetailsModal from '../features/tasks/components/TaskDetailsModal';
import ConfirmationModal from './shared/ConfirmationModal';
import UndoToast from './shared/UndoToast';
import Sidebar from './layout/Sidebar';
import BottomNav from './layout/BottomNav';
import CategoryManager from './categories/CategoryManager';
import LoadingSpinner from './ui/LoadingSpinner';

// Types
import { User, FilterType, Task } from '../types';
import { ProjectNote } from '../types';

export interface DashboardContextType {
    user: User | null;
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
        isCategoryManagerOpen, closeCategoryManager
    } = useUI();

    const { mobileHeader } = useLayout();

    const { categories, setCategories } = useCategoryContext();
    const location = useLocation();

    // Controller
    const {
        user,
        filter,
        setFilter,
        selectedTask,
        setSelectedTask,
        undoTask,
        setUndoTask,
        handleUndo,
        taskToDelete,
        cancelDelete,
        confirmDelete,
        handleDelete,
        updateTaskDetails,
        setScrollContainer,
        contextValue,
        tasks
    } = useDashboardController();

    const outlet = useOutlet(contextValue);

    if (!user) {
        return (
            <div className="flex h-[100dvh] w-full bg-bg-main items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

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
                        className="fixed inset-0 bg-overlay z-[90] lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col min-w-0 h-full">
                {/* Mobile Header - Hide in Focus Mode */}
                {!location.pathname.startsWith('/focus') && (
                    <header className="lg:hidden h-16 bg-bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-40 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden flex-1 text-xl font-extrabold tracking-tight text-text-primary">
                            {mobileHeader.title}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setMobileMenuOpen(true)} className="p-2 active:scale-90 transition-transform text-text-primary" aria-label={t('navigation.open_menu', 'Open menu')}>
                                <Menu />
                            </button>
                        </div>
                    </header>
                )}

                <div
                    ref={setScrollContainer}
                    className={`relative flex-1 overflow-y-auto scroll-smooth p-0 lg:mb-0 ${location.pathname.startsWith('/focus') ? '' : 'mb-16'}`}
                >
                    {outlet}
                </div>
            </main>

            <AnimatePresence>
                {!location.pathname.startsWith('/focus') && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
                    >
                        <BottomNav />
                    </motion.div>
                )}
            </AnimatePresence>

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
                onDelete={(id: string) => {
                    const t = tasks.find(t => t.id === id);
                    if (selectedTask && selectedTask.id === id && t) handleDelete(t);
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

            {
                undoTask && (
                    <UndoToast
                        onUndo={handleUndo}
                        onClose={() => setUndoTask(null)}
                    />
                )
            }
        </div >
    );
};

export default Dashboard;
