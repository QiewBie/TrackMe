import * as React from 'react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import { Heading } from '../../../components/ui/Typography';
import Button from '../../../components/ui/Button';
import { Task, Category } from '../../../types';
import { CheckCircle2, Search, Circle } from 'lucide-react';
import Input from '../../../components/ui/Input';
import TaskInput from '../../tasks/components/TaskInput';

interface TaskSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (taskIds: string[]) => void;
    existingTaskIds: string[];
    tasks: Task[];
    categories: Category[];
    onTaskCreate: (title: string, catId: string | number) => Promise<string | void> | string | void; // Adapter for addTask
}

const TaskSelectorModal: React.FC<TaskSelectorModalProps> = ({ isOpen, onClose, onAdd, existingTaskIds, tasks, categories, onTaskCreate }) => {
    const { t } = useTranslation();
    // Removed internal hooks to rely on parent state (source of truth)
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filter tasks: Not in playlist + match search + not completed (optional, maybe we allow completed?)
    // Let's show all incomplete tasks + completed ones if searched?
    // User wants to add "tasks to do", so mostly incomplete.
    const availableTasks = useMemo(() => {
        return tasks
            .filter(t => !existingTaskIds.includes(t.id)) // Not already in playlist
            .filter(t => !t.completed) // Only incomplete tasks
            .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
    }, [tasks, existingTaskIds, search]);

    const handleToggle = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleCreateTask = async (title: string, catId: number | string) => {
        // Use the prop function which connects to the main state
        // Adapter: TaskInput can return string for category ID (if "no_category" is handled as string "0" or similar)
        // But our system mostly uses numbers. If string comes in, try to parse it.
        const numericCatId = typeof catId === 'string' ? parseInt(catId, 10) : catId;
        const finalCatId = isNaN(numericCatId) ? 0 : numericCatId;

        const newId = await onTaskCreate(title, finalCatId);
        if (newId && typeof newId === 'string') {
            setSelectedIds(prev => new Set(prev).add(newId));
        }
    };

    const handleAdd = () => {
        onAdd(Array.from(selectedIds));
        setSelectedIds(new Set());
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('playlists.modal_title')}
            className="max-w-xl h-[85vh]"
            disableInnerScroll
        >
            <div className="flex flex-col h-full p-4 space-y-4">
                {/* Creation Area */}
                <div className="relative z-50">
                    <Heading variant="h4" className="text-xs font-bold text-text-secondary uppercase mb-2">{t('playlists.create_task')}</Heading>
                    <TaskInput
                        categories={categories}
                        currentFilter="all"
                        onAdd={handleCreateTask}
                    />
                </div>

                <div className="border-t border-border my-2"></div>

                {/* Search Area */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                    <Input
                        placeholder={t('playlists.search_placeholder') || 'Search tasks...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-2 custom-scrollbar">
                    {availableTasks.length === 0 ? (
                        <div className="text-center text-text-secondary py-8">
                            {t('playlists.no_tasks_found')}
                        </div>
                    ) : (
                        availableTasks.map(task => {
                            const isSelected = selectedIds.has(task.id);
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleToggle(task.id)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                        ${isSelected
                                            ? 'border-brand-primary bg-brand-primary/10'
                                            : 'border-border hover:bg-bg-surface'}
                                    `}
                                >
                                    <div className={isSelected ? 'text-brand-primary' : 'text-ui-disabled'}>
                                        {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-text-primary">{task.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                            {task.categoryId && (
                                                <span className="flex items-center gap-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${categories.find(c => c.id == task.categoryId)?.color || 'bg-ui-disabled'}`}></span>
                                                    {categories.find(c => c.id == task.categoryId)?.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>{t('playlists.cancel')}</Button>
                    <Button
                        onClick={handleAdd}
                        disabled={selectedIds.size === 0}
                    >
                        {t('playlists.add_selected', { count: selectedIds.size })}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TaskSelectorModal;
