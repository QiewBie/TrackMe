import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X, ChevronRight, Check, FileText, Trash2, Save, CheckSquare, ListPlus, Calendar, Flag, Clock } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Badge from '../../../components/ui/Badge';
import DateTimePicker from '../../../components/shared/DateTimePicker';
import { Task, Category, Subtask } from '../../../types';
import { SubtaskList } from './DraggableSubtaskList';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface TaskDetailsModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSave: (task: Task) => void;
    onDelete: (id: string) => void;
}

import { PRIORITY_CONFIG, getPriorityStyles } from '../../../constants/taskConstants';
import { getCategoryClass } from '../../../utils/theme';
import { useTranslation } from 'react-i18next';

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose, categories, onSave, onDelete }) => {
    const { t } = useTranslation();
    const [editedTask, setEditedTask] = useState<Task | null>(task);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    const priorityOptions = PRIORITY_CONFIG.map(p => ({
        ...p,
        label: t(`task_details.priority_${p.value}`, p.value.charAt(0).toUpperCase() + p.value.slice(1))
    }));


    const categoryRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);

    useClickOutside(categoryRef, () => {
        if (isCategoryOpen) setIsCategoryOpen(false);
    });

    useClickOutside(priorityRef, () => {
        if (isPriorityOpen) setIsPriorityOpen(false);
    });

    // Only update if task ID changes (prevents overwriting user edits on background updates like timer ticks)
    useEffect(() => {
        if (task && task.id !== editedTask?.id) {
            setEditedTask({ ...task, subtasks: task.subtasks || [] });
        }
    }, [task]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            // Close dropdowns on escape if open? 
            if (e.key === 'Escape' && (isCategoryOpen || isPriorityOpen)) {
                // native behavior might handle it, but let's be safe
                setIsCategoryOpen(false);
                setIsPriorityOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, isCategoryOpen, isPriorityOpen]);

    // If we have no data at all even for stale state, don't render
    if (!editedTask && !isOpen) return null;
    const currentTask = editedTask || task; // Fallback
    if (!currentTask) return null;

    const handleDateChange = (field: keyof Task, isoString: string | undefined) => {
        setEditedTask(prev => prev ? { ...prev, [field]: isoString } : null);
    };

    const selectedCategory = categories.find(c => c.id === currentTask.categoryId) || categories[0];
    const currentPriority = priorityOptions.find(p => p.value === currentTask.priority) || null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-overlay z-overlay"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 right-0 z-modal w-full sm:w-[550px] lg:w-[600px] bg-bg-surface shadow-2xl flex flex-col border-l border-border"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between px-6 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] border-b border-border shrink-0 bg-bg-surface/95 z-10">
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={currentTask.completed ? 'success' : 'primary'}>
                                        {currentTask.completed ? t('task_details.status_completed') : t('task_details.status_in_progress')}
                                    </Badge>
                                    {currentTask.isRunning && (
                                        <Badge variant="warning" className="animate-pulse flex items-center gap-1">
                                            <Clock size={10} /> {t('task_details.status_active')}
                                        </Badge>
                                    )}
                                </div>
                                <Input
                                    value={currentTask.title}
                                    onChange={e => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    className="text-2xl font-bold p-0"
                                    placeholder={t('task_details.title_placeholder')}
                                    variant="ghost"
                                />
                            </div>
                            <Button
                                variant="icon"
                                onClick={onClose}
                                className="text-text-secondary hover:text-text-primary"
                                icon={X}
                            />
                        </div>

                        {/* Content Scrollable Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col lg:flex-row min-h-full">
                                {/* Left Column: Main Content */}
                                <div className="flex-1 p-6 space-y-8 border-r border-border">
                                    {/* Description */}
                                    <div>
                                        <label className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                                            <FileText size={14} /> {t('task_details.description_label')}
                                        </label>
                                        <Textarea
                                            value={currentTask.description || ''}
                                            onChange={e => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                                            className="bg-bg-main min-h-[160px] leading-relaxed"
                                            placeholder={t('task_details.description_placeholder')}
                                            variant="default"
                                        />
                                    </div>

                                    {/* Subtasks */}
                                    <div>
                                        <label className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                                            <CheckSquare size={14} /> {t('task_details.subtasks_label')}
                                        </label>

                                        <div className="bg-bg-main rounded-xl border border-border overflow-hidden">
                                            <div className="divide-y divide-border">
                                                <SubtaskList
                                                    subtasks={currentTask.subtasks || []}
                                                    onReorder={(newSubtasks: Subtask[]) => setEditedTask(prev => prev ? { ...prev, subtasks: newSubtasks } : null)}
                                                    onUpdate={(id: string, updates: Partial<Subtask>) => {
                                                        const updatedSubtasks = (currentTask.subtasks || []).map(s =>
                                                            s.id === id ? { ...s, ...updates } : s
                                                        );
                                                        setEditedTask(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);
                                                    }}
                                                    onDelete={(id: string) => {
                                                        const updatedSubtasks = (currentTask.subtasks || []).filter(s => s.id !== id);
                                                        setEditedTask(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);
                                                    }}
                                                />
                                                <div className="flex items-center gap-3 p-3 bg-bg-main/50">
                                                    <div className="w-5 h-5 flex items-center justify-center text-text-secondary">
                                                        <ListPlus size={16} />
                                                    </div>
                                                    <Input
                                                        placeholder={t('task_details.add_subtask_placeholder')}
                                                        className="px-0"
                                                        variant="ghost"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                                                if (val) {
                                                                    const newSubtask = {
                                                                        id: crypto.randomUUID(),
                                                                        title: val,
                                                                        completed: false
                                                                    };
                                                                    setEditedTask(prev => prev ? {
                                                                        ...prev,
                                                                        subtasks: [...(prev.subtasks || []), newSubtask]
                                                                    } : null);
                                                                    (e.currentTarget as HTMLInputElement).value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Sidebar (Meta) */}
                                <div className="w-full lg:w-72 bg-bg-main/50 p-6 space-y-6 shrink-0">
                                    {/* Project Selector */}
                                    <div>
                                        <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">{t('task_details.project_label')}</label>
                                        <div className="relative" ref={categoryRef}>
                                            <Button
                                                variant="secondary"
                                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                                className="w-full justify-between px-3 py-2.5 bg-bg-surface border-border hover:border-brand-primary"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory ? getCategoryClass(selectedCategory.color, 'bg') : 'bg-ui-disabled'}`}></span>
                                                    <span className="truncate text-text-primary font-medium">{selectedCategory?.name}</span>
                                                </div>
                                                <ChevronRight className={clsx("text-text-secondary transition-transform", isCategoryOpen && 'rotate-90')} size={16} />
                                            </Button>

                                            <AnimatePresence>
                                                {isCategoryOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute top-full left-0 mt-2 w-full bg-bg-surface rounded-xl shadow-xl border border-border p-1 z-20 max-h-60 overflow-y-auto custom-scrollbar"
                                                    >
                                                        {categories.map(c => (
                                                            <button
                                                                type="button"
                                                                key={c.id}
                                                                onClick={() => { setEditedTask(prev => prev ? { ...prev, categoryId: c.id } : null); setIsCategoryOpen(false); }}
                                                                className={clsx(
                                                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                                                                    currentTask.categoryId === c.id
                                                                        ? "bg-brand-subtle text-brand-primary font-medium"
                                                                        : "text-text-secondary hover:bg-bg-main"
                                                                )}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full ${getCategoryClass(c.color, 'bg')}`}></span>
                                                                <span className="truncate flex-1">{c.name}</span>
                                                                {currentTask.categoryId === c.id && <Check size={14} />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Priority Selector */}
                                    <div>
                                        <label className="text-xs font-bold text-text-secondary uppercase mb-2 block flex items-center gap-2">
                                            <Flag size={12} /> {t('task_details.priority_label')}
                                        </label>
                                        <div className="relative" ref={priorityRef}>
                                            <Button
                                                variant="secondary"
                                                onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                                                className={clsx(
                                                    "w-full justify-between px-3 py-2.5",
                                                    currentPriority
                                                        ? getPriorityStyles(currentPriority.value)
                                                        : "bg-bg-surface border-border text-text-secondary hover:border-border-subtle"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Flag size={16} className={currentPriority ? "fill-current" : ""} />
                                                    <span className="text-left font-medium">
                                                        {currentPriority ? currentPriority.label : t('task_details.set_priority')}
                                                    </span>
                                                </div>
                                                <ChevronRight className={clsx("text-current opacity-50 transition-transform", isPriorityOpen && 'rotate-90')} size={16} />
                                            </Button>

                                            <AnimatePresence>
                                                {isPriorityOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute top-full left-0 mt-2 w-full bg-bg-surface rounded-xl shadow-xl border border-border p-1 z-20 overflow-hidden"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => { setEditedTask(prev => prev ? { ...prev, priority: undefined } : null); setIsPriorityOpen(false); }}
                                                            className="w-full justify-start rounded-lg text-sm text-text-secondary hover:bg-bg-main"
                                                            icon={X}
                                                        >
                                                            {t('task_details.clear_priority')}
                                                        </Button>
                                                        {priorityOptions.map(p => (
                                                            <button
                                                                type="button"
                                                                key={p.value}
                                                                onClick={() => { setEditedTask(prev => prev ? { ...prev, priority: p.value } : null); setIsPriorityOpen(false); }}
                                                                className={clsx(
                                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mt-0.5 text-left font-medium",
                                                                    getPriorityStyles(p.value),
                                                                    "hover:brightness-95 dark:hover:brightness-110"
                                                                )}
                                                            >
                                                                <Flag size={14} className="fill-current" />
                                                                {p.label}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <DateTimePicker
                                            label={t('task_details.created_at')}
                                            value={currentTask.createdAt}
                                            onChange={(val) => handleDateChange('createdAt', val)}
                                        />
                                        <DateTimePicker
                                            label={t('task_details.completed_at')}
                                            value={currentTask.completedAt}
                                            onChange={(val) => handleDateChange('completedAt', val)}
                                            disabled={!currentTask.completedAt}
                                        />
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="pt-8 border-t border-border mt-auto">
                                        <Button
                                            variant="danger"
                                            onClick={() => { if (currentTask) onDelete(currentTask.id); onClose(); }}
                                            className="w-full justify-center"
                                            icon={Trash2}
                                        >
                                            {t('task_details.delete_task')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Content Actions */}
                        <div className="p-4 border-t border-border bg-bg-surface/95 shrink-0 flex justify-end gap-3 z-20 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="border-border hover:bg-bg-main text-text-secondary"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={() => { if (currentTask) onSave(currentTask); onClose(); }}
                                icon={Save}
                                className="shadow-lg shadow-brand/20"
                            >
                                {t('task_details.save_changes')}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TaskDetailsModal;
