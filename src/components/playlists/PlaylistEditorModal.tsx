import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Reorder } from 'framer-motion';
import { X, Trash2, GripVertical } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Task, Playlist } from '../../types';

interface PlaylistEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: Playlist;
    allTasks: Task[];
    onSave: (playlistId: string, newTaskIds: string[]) => void;
}

// Memoized Item Component to prevent re-renders during drag
const PlaylistTaskItem = React.memo(({ taskId, task, onRemove }: { taskId: string, task: Task, onRemove: (id: string) => void }) => {
    return (
        <Reorder.Item value={taskId} className="touch-none select-none">
            <div className="flex items-center gap-3 p-3 bg-bg-surface rounded-xl border border-border shadow-sm">
                <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <GripVertical size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{task.title}</p>
                </div>
                <button
                    onClick={() => onRemove(taskId)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    aria-label="Remove from playlist"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </Reorder.Item>
    );
});

const PlaylistEditorModal: React.FC<PlaylistEditorModalProps> = ({
    isOpen, onClose, playlist, allTasks, onSave
}) => {
    const { t } = useTranslation();
    const [items, setItems] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && playlist) {
            setItems(playlist.taskIds);
        }
    }, [isOpen, playlist]);

    const handleRemove = React.useCallback((idToRemove: string) => {
        setItems(prev => prev.filter(id => id !== idToRemove));
    }, []);

    const handleSave = () => {
        onSave(playlist.id, items);
        onClose();
    };

    // Optimization: Create Map for O(1) lookup
    const taskMap = React.useMemo(() => {
        return new Map(allTasks.map(t => [t.id, t]));
    }, [allTasks]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('playlists.editor.title', 'Edit Playlist Tasks')}
            className="max-w-md w-full max-h-[85vh] flex flex-col"
        >
            <div
                className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar"
                style={{ contain: 'content' }}
            >
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t('playlists.editor.subtitle', 'Drag to reorder. Swipe or click trash to remove.')}
                </p>

                <Reorder.Group axis="y" values={items} onReorder={setItems} layoutScroll className="space-y-2">
                    {items.map((taskId) => {
                        const task = taskMap.get(taskId);
                        if (!task) return null;

                        return (
                            <PlaylistTaskItem
                                key={taskId}
                                taskId={taskId}
                                task={task}
                                onRemove={handleRemove}
                            />
                        );
                    })}
                </Reorder.Group>

                {items.length === 0 && (
                    <div className="text-center py-10 text-slate-400 italic">
                        {t('playlists.editor.empty', 'No tasks in this playlist.')}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3 shrink-0">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
                <Button variant="primary" onClick={handleSave}>{t('common.save', 'Save Changes')}</Button>
            </div>
        </Modal>
    );
};

export default PlaylistEditorModal;
