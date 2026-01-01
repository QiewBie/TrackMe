import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, CheckCircle2, Circle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Task, Category } from '../../../types';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string, selectedTaskIds: string[]) => void;
    tasks: Task[];
    categories: Category[];
    onTaskCreate: (title: string) => Promise<string> | string;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
    isOpen, onClose, onCreate, tasks, categories, onTaskCreate
}) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [newTaskName, setNewTaskName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSearch('');
            setSelectedIds(new Set());
            setNewTaskName('');
        }
    }, [isOpen]);

    const availableTasks = useMemo(() => {
        return tasks
            .filter(t => !t.completed)
            .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [tasks, search]);

    const handleToggle = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleQuickCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = newTaskName.trim() || search.trim();
        if (val) {
            const newId = await onTaskCreate(val);
            setSelectedIds((prev: Set<string>) => new Set(prev).add(newId));
            setNewTaskName('');
            setSearch('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('playlists.create_new', 'Create New Playlist')}
            className="max-w-2xl h-[85vh] flex flex-col"
            disableInnerScroll
        >
            <div className="flex flex-col h-full overflow-hidden p-6 space-y-6">
                {/* 1. Name Input */}
                <div className="shrink-0">
                    <Input
                        id="playlist-title-input"
                        label={t('playlists.templates.name_label', 'Playlist Name')}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t('playlists.name_placeholder', 'My Focus Session')}
                        className="font-bold text-lg"
                        autoFocus
                    />
                </div>

                <div className="border-t border-border shrink-0"></div>

                {/* 2. Task Selector / Creator */}
                <div className="flex-1 flex flex-col min-h-0 bg-bg-main rounded-2xl border border-border p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
                        <label className="text-xs font-bold text-text-secondary uppercase">
                            {t('playlists.select_tasks', 'Select Tasks')} ({selectedIds.size})
                        </label>
                        {/* Quick Create Input */}
                        <form onSubmit={handleQuickCreate} className="flex gap-2 w-full md:w-1/2 items-center">
                            <Input
                                value={newTaskName}
                                onChange={e => setNewTaskName(e.target.value)}
                                placeholder={t('playlists.create_task_placeholder')}
                                className="py-1.5 h-9"
                                containerClassName="flex-1"
                            />
                            <Button
                                type="submit"
                                onClick={(e) => handleQuickCreate(e)}
                                disabled={!newTaskName.trim()}
                                variant="primary"
                                className="w-9 h-9 p-0 rounded-lg shrink-0"
                            >
                                <Plus size={16} />
                            </Button>
                        </form>
                    </div>

                    {/* Search */}
                    <div className="relative mb-3 shrink-0">
                        <Input
                            placeholder={t('playlists.search_placeholder', 'Search existing tasks...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={16} />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {availableTasks.length === 0 ? (
                            <div className="text-center text-text-secondary py-8 text-sm italic">
                                {t('playlists.no_tasks_found', 'No tasks found. Create one above!')}
                            </div>
                        ) : (
                            availableTasks.map(task => {
                                const isSelected = selectedIds.has(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => handleToggle(task.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                            ? 'border-brand-primary bg-brand-primary/10'
                                            : 'border-border hover:bg-bg-surface'
                                            }`}
                                    >
                                        <div className={isSelected ? 'text-brand-primary' : 'text-ui-disabled'}>
                                            {isSelected ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-text-primary text-sm">{task.title}</p>
                                            {task.categoryId && (
                                                <span className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${categories.find(c => c.id == task.categoryId)?.color || 'bg-ui-disabled'}`}></span>
                                                    <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">{categories.find(c => c.id == task.categoryId)?.name}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 shrink-0 pt-2">
                    <Button variant="secondary" onClick={onClose} type="button">{t('common.cancel', 'Cancel')}</Button>
                    <Button
                        variant="primary"
                        icon={Plus}
                        disabled={!title.trim()}
                        onClick={() => onCreate(title.trim(), Array.from(selectedIds))}
                    >
                        {selectedIds.size > 0 ? t('playlists.create_with_tasks', { count: selectedIds.size, defaultValue: `Create Playlist (${selectedIds.size})` }) : t('common.create', 'Create Playlist')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
