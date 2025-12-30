import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Sunrise, Sun, Flame, Zap, Clock, Briefcase, Code, Monitor, Database, Cpu, Book, GraduationCap, Coffee, Dumbbell, Heart, Music, Gamepad2, Star } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Configuration
export const AVAILABLE_ICONS = [
    { icon: Sunrise, label: 'Morning', color: 'text-amber-500' },
    { icon: Sun, label: 'Day', color: 'text-yellow-500' },
    { icon: Flame, label: 'Fireplace', color: 'text-orange-500' },
    { icon: Zap, label: 'Energy', color: 'text-blue-500' },
    { icon: Clock, label: 'Time', color: 'text-slate-500' },
    { icon: Briefcase, label: 'Work', color: 'text-amber-700' },
    { icon: Code, label: 'Coding', color: 'text-emerald-500' },
    { icon: Monitor, label: 'Screen', color: 'text-indigo-500' },
    { icon: Database, label: 'Data', color: 'text-cyan-600' },
    { icon: Cpu, label: 'Tech', color: 'text-violet-500' },
    { icon: Book, label: 'Study', color: 'text-rose-500' },
    { icon: GraduationCap, label: 'Learn', color: 'text-blue-600' },
    { icon: Coffee, label: 'Break', color: 'text-amber-700' },
    { icon: Dumbbell, label: 'Fitness', color: 'text-red-500' },
    { icon: Heart, label: 'Health', color: 'text-pink-500' },
    { icon: Music, label: 'Music', color: 'text-fuchsia-500' },
    { icon: Gamepad2, label: 'Game', color: 'text-purple-500' },
    { icon: Star, label: 'Focus', color: 'text-yellow-400' },
];

interface TemplateEditorProps {
    isOpen: boolean;
    onClose: () => void;
    template: any;
    onSave: (updated: any) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ isOpen, onClose, template, onSave }) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState(template?.title || '');
    const [keywords, setKeywords] = useState(template?.keywords?.join(', ') || '');
    const [defaultTasks, setDefaultTasks] = useState<string[]>(template?.defaultTasks || []);
    const [selectedIconItem, setSelectedIconItem] = useState(
        AVAILABLE_ICONS.find(i => i.icon === template?.icon) || AVAILABLE_ICONS[4]
    );
    const [newTaskName, setNewTaskName] = useState('');

    useEffect(() => {
        if (template) {
            setTitle(template.title || '');
            setKeywords(template.keywords?.join(', ') || '');
            setDefaultTasks(template.defaultTasks || []);
            const match = AVAILABLE_ICONS.find(i => i.icon === template.icon);
            if (match) setSelectedIconItem(match);
        } else {
            setTitle('');
            setKeywords('');
            setDefaultTasks([]);
            setSelectedIconItem(AVAILABLE_ICONS[4]);
        }
    }, [template, isOpen]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;
        setDefaultTasks(prev => [...prev, newTaskName.trim()]);
        setNewTaskName('');
    };

    const removeTask = (index: number) => {
        setDefaultTasks(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={template?.id ? t('playlists.templates.edit_preset', 'Edit Preset') : t('playlists.templates.new_preset', 'New Preset')}
            className="max-w-md"
        >
            <div className="p-6 space-y-6">
                {/* Header Config */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('playlists.templates.name_label', 'Preset Name')}</label>
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-bg-main ${selectedIconItem.color}`}>
                            <selectedIconItem.icon size={24} />
                        </div>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="font-bold border-transparent focus:border-brand-primary/50"
                            containerClassName="flex-1"
                            placeholder={t('playlists.templates.name_placeholder', 'e.g. Morning Routine')}
                        />
                    </div>
                </div>

                {/* Icon Picker */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('common.icon', 'Icon')}</label>
                    <div className="grid grid-cols-6 gap-2 bg-bg-main p-2 rounded-xl border border-border overflow-y-auto max-h-32 custom-scrollbar">
                        {AVAILABLE_ICONS.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedIconItem(item)}
                                className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-bg-surface transition-all ${selectedIconItem.label === item.label ? 'bg-bg-surface shadow-sm ring-2 ring-brand-primary' : 'opacity-70 hover:opacity-100'}`}
                                title={item.label}
                            >
                                <item.icon size={20} className={item.color} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task List Manager */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">{t('playlists.templates.tasks_label')}</label>
                    <div className="bg-bg-main rounded-xl border border-border overflow-hidden">
                        <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                            {defaultTasks.length === 0 ? (
                                <p className="text-center text-sm text-text-secondary py-4 italic">{t('playlists.templates.no_tasks')}</p>
                            ) : (
                                <div className="space-y-1">
                                    {defaultTasks.map((task, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 pl-3 rounded-lg hover:bg-bg-surface border border-transparent hover:border-border group transition-all">
                                            <span className="text-sm font-medium text-text-primary">{task}</span>
                                            <button
                                                onClick={() => removeTask(i)}
                                                className="p-1 text-text-secondary hover:text-status-error transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Input */}
                        <form onSubmit={handleAddTask} className="border-t border-border p-2 bg-bg-surface">
                            <div className="flex gap-2">
                                <Input
                                    value={newTaskName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskName(e.target.value)}
                                    placeholder={t('playlists.templates.add_task_placeholder', 'Add task...')}
                                    className="bg-transparent border-none focus:ring-0 px-2 h-auto py-1 shadow-none"
                                    containerClassName="flex-1"
                                />
                                <button
                                    type="submit"
                                    disabled={!newTaskName.trim()}
                                    className="p-1.5 rounded-lg bg-bg-main text-text-secondary hover:text-brand-primary disabled:opacity-50 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
                    <Button
                        variant="primary"
                        disabled={!title.trim()}
                        onClick={() => {
                            onSave({
                                ...(template || {}),
                                id: template?.id || crypto.randomUUID(),
                                title,
                                icon: selectedIconItem.icon,
                                color: selectedIconItem.color,
                                defaultTasks,
                                keywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
                            });
                            onClose();
                        }}
                    >
                        {t('playlists.templates.save', 'Save Changes')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
