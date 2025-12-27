import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { usePlaylistContext } from '../../context/PlaylistContext';
import { useTaskContext } from '../../context/TaskContext';
import { useCategoryContext } from '../../context/CategoryContext';
import { DashboardContextType } from '../Dashboard';
import { Plus, Edit3 } from 'lucide-react';
import TaskSelectorModal from '../playlists/TaskSelectorModal';
import PlaylistEditorModal from '../playlists/PlaylistEditorModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import UndoToast from '../shared/UndoToast';
import { Playlist } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../ui/Toast';
import PageHeader from '../ui/PageHeader';

// New Components & Primitives
import { PlaylistCard } from '../playlist/PlaylistCard';
import { TemplateEditor } from '../playlist/TemplateEditor';
import { CreatePlaylistModal } from '../playlist/CreatePlaylistModal';
import { Container } from '../ui/Layout';
import { Heading } from '../ui/Typography';
import { DEFAULT_TEMPLATES } from '../../config/templates';

const PlaylistManager = () => {
    const { t } = useTranslation();
    const {
        createPlaylist, playlists, deletePlaylist, restorePlaylist,
        addTasksToPlaylist, reorderTasks
    } = usePlaylistContext();
    const { tasks, addTask } = useTaskContext();
    const { categories } = useCategoryContext();
    const { onEdit } = useOutletContext<DashboardContextType>();
    const navigate = useNavigate();

    const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
    const [undoPlaylist, setUndoPlaylist] = useState<Playlist | null>(null);
    const [isSelectorOpen, setSelectorOpen] = useState(false);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    // Management State
    const [managingPlaylistId, setManagingPlaylistId] = useState<string | null>(null);
    const [targetPlaylistId, setTargetPlaylistId] = useState<string | null>(null);

    // Template State
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' | 'info', visible: boolean }>({
        msg: '', type: 'info', visible: false
    });

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type, visible: true });
    };

    const handleSaveTemplate = (updated: any) => {
        if (isCreatingTemplate) {
            setTemplates(prev => [...prev, updated]);
            setIsCreatingTemplate(false);
        } else {
            setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
        setEditingTemplateId(null);
    };

    const handleCreateNewTemplate = () => {
        setIsCreatingTemplate(true);
        setEditingTemplateId('new_temp'); // Dummy ID to trigger modal
    };

    // Handlers
    const createFromTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        createPlaylist(template.title); // Fire and forget or await? Usually better to await if we want sequential toast
        // Actually, createPlaylist is async now, so we should await if we want to ensure task creation happens after?
        // But here we don't use 'newPlaylist' ID for adding default tasks yet (logic is simplified).
        // Wait, line 85 uses addTask which is async now.

        // Let's make it awaited for cleaner flow.
        await createPlaylist(template.title);

        // Note: Task creation logic for templates is simplified for now
        if (template.defaultTasks && template.defaultTasks.length > 0) {
            // We can run these in parallel
            await Promise.all(template.defaultTasks.map((taskTitle: string) =>
                // @ts-ignore
                addTask(taskTitle, 'default', false)
            ));
        }
        showToast(t('playlists.created', 'Playlist created!'), 'success');
    };

    const handleCreatePlaylist = async (title: string, selectedTaskIds: string[]) => {
        const newPlaylist = await createPlaylist(title);
        if (selectedTaskIds.length > 0) {
            await addTasksToPlaylist(newPlaylist.id, selectedTaskIds);
        }
        showToast(t('playlists.created', 'Playlist created!'), 'success');
        setCreateModalOpen(false);
    };

    const openTaskSelector = (playlistId: string) => {
        setTargetPlaylistId(playlistId);
        setSelectorOpen(true);
    };

    const handleAddTasks = (taskIds: string[]) => {
        if (targetPlaylistId) {
            addTasksToPlaylist(targetPlaylistId, taskIds);
        }
    };

    const confirmDelete = () => {
        if (playlistToDelete) {
            deletePlaylist(playlistToDelete.id);
            setUndoPlaylist(playlistToDelete);
            setPlaylistToDelete(null);
            showToast(t('common.deleted', 'Deleted'), 'info');
        }
    };

    const handleUndo = () => {
        if (undoPlaylist) {
            restorePlaylist(undoPlaylist);
            setUndoPlaylist(null);
            showToast(t('common.restored', 'Restored'), 'success');
        }
    };

    const openManager = (playlistId: string) => {
        setManagingPlaylistId(playlistId);
    };

    const targetPlaylist = playlists.find(p => p.id === targetPlaylistId);

    return (
        <Container size="xl" className="space-y-10 py-6 pb-20 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col gap-6 border-b border-border pb-8">
                <PageHeader
                    title={t('playlists.title')}
                    subtitle={t('playlists.subtitle', 'Manage your focus flows.')}
                    className="mb-0"
                />

                {/* Templates / Quick Actions Section */}
                <div>
                    <Heading variant="h4" className="text-xs font-bold text-text-secondary uppercase mb-3 tracking-wider">
                        {t('playlists.templates.quick_title', 'Quick Templates')}
                    </Heading>
                    <div className="flex flex-wrap gap-4">
                        {templates.map(template => (
                            <div key={template.id} className="group flex items-center gap-3 pl-3 pr-2 py-2 bg-bg-surface border border-border rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer"
                                onClick={() => createFromTemplate(template.id)}
                            >
                                <div className={`p-2 rounded-lg bg-bg-main ${template.color}`}>
                                    <template.icon size={20} />
                                </div>
                                <span className="font-bold text-text-primary text-sm whitespace-nowrap">
                                    {template.title}
                                </span>
                                <div className="w-px h-6 bg-border mx-1"></div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingTemplateId(template.id); }}
                                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-main rounded-lg transition-all"
                                    title={t('playlists.templates.configure', 'Configure Template')}
                                >
                                    <Edit3 size={14} />
                                </button>
                            </div>
                        ))}

                        {/* Add Custom Template Stub */}
                        <button
                            onClick={handleCreateNewTemplate}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-slate-300 transition-all text-sm font-bold"
                        >
                            <Plus size={18} />
                            <span>{t('playlists.templates.new_preset', 'New Preset')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Card */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col h-full min-h-[200px] md:min-h-[300px] w-full rounded-3xl border-2 border-dashed border-border hover:border-blue-400 dark:hover:border-blue-500 hover:bg-bg-surface transition-all cursor-pointer group items-center justify-center gap-4 text-text-secondary hover:text-blue-500 outline-none focus:ring-4 focus:ring-blue-500/20"
                    onClick={() => setCreateModalOpen(true)}
                    type="button"
                >
                    <div className="w-16 h-16 rounded-full bg-bg-main group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold text-lg">{t('playlists.create_new', 'Create New Playlist')}</span>
                </motion.button>

                <AnimatePresence mode='popLayout'>
                    {playlists.map(p => (
                        <PlaylistCard
                            key={p.id}
                            playlist={p}
                            tasks={tasks}
                            categories={categories}
                            onStart={() => {
                                if (p.taskIds.length === 0) {
                                    showToast(t('playlists.empty_warning', 'Playlist is empty!'), 'error');
                                } else {
                                    navigate(`/focus/${p.id}`);
                                }
                            }}
                            onDelete={() => setPlaylistToDelete(p)}
                            onAddTasks={() => openTaskSelector(p.id)}
                            onViewDetails={() => openManager(p.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Template Editor Modal */}
            <TemplateEditor
                isOpen={!!editingTemplateId}
                onClose={() => {
                    setEditingTemplateId(null);
                    setIsCreatingTemplate(false);
                }}
                template={isCreatingTemplate ? null : templates.find(t => t.id === editingTemplateId)}
                onSave={handleSaveTemplate}
            />

            <CreatePlaylistModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreatePlaylist}
                tasks={tasks}
                categories={categories}
                onTaskCreate={(title) => addTask(title, 'default', false)}
            />

            {/* Playlist Editor Modal (Existing) - To be refactored later if simpler */}
            {
                managingPlaylistId && (
                    <PlaylistEditorModal
                        isOpen={!!managingPlaylistId}
                        onClose={() => setManagingPlaylistId(null)}
                        playlist={playlists.find(p => p.id === managingPlaylistId)!}
                        allTasks={tasks}
                        onSave={reorderTasks}
                    />
                )
            }

            {
                targetPlaylist && (
                    <TaskSelectorModal
                        isOpen={isSelectorOpen}
                        onClose={() => setSelectorOpen(false)}
                        onAdd={handleAddTasks}
                        existingTaskIds={targetPlaylist.taskIds}
                        tasks={tasks}
                        categories={categories}
                        onTaskCreate={(title, catId) => {
                            // @ts-ignore
                            return addTask(title, catId, false);
                        }}
                    />
                )
            }

            <ConfirmationModal
                isOpen={!!playlistToDelete}
                onClose={() => setPlaylistToDelete(null)}
                onConfirm={confirmDelete}
                title={t('playlists.delete_confirm_title')}
                message={t('playlists.delete_confirm_msg', { name: playlistToDelete?.title })}
                confirmVariant="danger"
            />

            {
                undoPlaylist && (
                    <UndoToast
                        onUndo={handleUndo}
                        onClose={() => setUndoPlaylist(null)}
                        message={t('playlists.undo_delete')}
                    />
                )
            }

            <Toast
                message={toast.msg}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </Container>
    );
};

export default PlaylistManager;
