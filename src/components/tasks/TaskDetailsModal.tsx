import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X, ChevronRight, Check, FileText, Trash2, Save, CheckSquare, ListPlus, Calendar, Flag, Clock } from 'lucide-react';
import Button from '../ui/Button';
import DateTimePicker from '../shared/DateTimePicker';
import { Task, Category } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickOutside } from '../../hooks/useClickOutside';

interface TaskDetailsModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSave: (task: Task) => void;
    onDelete: (id: string) => void;
}

import { PRIORITY_CONFIG } from '../../constants/taskConstants';
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
                        className="fixed inset-0 bg-black/60 z-[90]"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-y-0 right-0 z-[90] w-full sm:w-[550px] lg:w-[600px] bg-bg-surface shadow-2xl flex flex-col border-l border-border"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-border shrink-0 bg-bg-surface/95 z-10">
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                        currentTask.completed
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    )}>
                                        {currentTask.completed ? t('task_details.status_completed') : t('task_details.status_in_progress')}
                                    </span>
                                    {currentTask.isRunning && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse">
                                            <Clock size={10} /> {t('task_details.status_active')}
                                        </span>
                                    )}
                                </div>
                                <input
                                    value={currentTask.title}
                                    onChange={e => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    className="text-2xl font-bold bg-transparent outline-none text-text-primary w-full placeholder:text-text-secondary/50"
                                    placeholder={t('task_details.title_placeholder')}
                                />
                            </div>
                            <Button
                                variant="icon"
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <FileText size={14} /> {t('task_details.description_label')}
                                        </label>
                                        <textarea
                                            value={currentTask.description || ''}
                                            onChange={e => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                                            className="w-full bg-bg-main border-0 rounded-xl p-4 text-sm outline-none min-h-[160px] resize-none text-text-primary focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-text-secondary/50 leading-relaxed"
                                            placeholder={t('task_details.description_placeholder')}
                                        />
                                    </div>

                                    {/* Subtasks */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <CheckSquare size={14} /> {t('task_details.subtasks_label')}
                                        </label>

                                        <div className="bg-bg-main rounded-xl border border-border overflow-hidden">
                                            <div className="divide-y divide-border">
                                                {currentTask.subtasks?.map((subtask) => (
                                                    <div key={subtask.id} className="flex items-center gap-3 p-3 hover:bg-bg-surface group transition-colors">
                                                        <button
                                                            onClick={() => {
                                                                const updatedSubtasks = currentTask.subtasks.map(s =>
                                                                    s.id === subtask.id ? { ...s, completed: !s.completed } : s
                                                                );
                                                                setEditedTask(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);
                                                            }}
                                                            className={clsx(
                                                                "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                                                                subtask.completed
                                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
                                                            )}
                                                        >
                                                            {subtask.completed && <Check size={12} strokeWidth={3} />}
                                                        </button>
                                                        <input
                                                            value={subtask.title}
                                                            onChange={(e) => {
                                                                const updatedSubtasks = currentTask.subtasks.map(s =>
                                                                    s.id === subtask.id ? { ...s, title: e.target.value } : s
                                                                );
                                                                setEditedTask(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);
                                                            }}
                                                            className={clsx(
                                                                "flex-1 bg-transparent text-sm outline-none py-1 border-b border-transparent rounded transition-all",
                                                                subtask.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700 dark:text-slate-200'
                                                            )}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const updatedSubtasks = currentTask.subtasks.filter(s => s.id !== subtask.id);
                                                                setEditedTask(prev => prev ? { ...prev, subtasks: updatedSubtasks } : null);
                                                            }}
                                                            className="text-slate-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="flex items-center gap-3 p-3 bg-bg-main/50">
                                                    <div className="w-5 h-5 flex items-center justify-center text-slate-300">
                                                        <ListPlus size={16} />
                                                    </div>
                                                    <input
                                                        placeholder={t('task_details.add_subtask_placeholder')}
                                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = e.currentTarget.value.trim();
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
                                                                    e.currentTarget.value = '';
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
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{t('task_details.project_label')}</label>
                                        <div className="relative" ref={categoryRef}>
                                            <button
                                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                                className="w-full flex items-center gap-3 bg-bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-medium hover:border-brand-primary transition-colors"
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory?.color}`}></span>
                                                <span className="truncate flex-1 text-left dark:text-slate-200">{selectedCategory?.name}</span>
                                                <ChevronRight className={clsx("text-slate-400 transition-transform", isCategoryOpen && 'rotate-90')} size={16} />
                                            </button>

                                            <AnimatePresence>
                                                {isCategoryOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-20 max-h-60 overflow-y-auto custom-scrollbar"
                                                    >
                                                        {categories.map(c => (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => { setEditedTask(prev => prev ? { ...prev, categoryId: c.id } : null); setIsCategoryOpen(false); }}
                                                                className={clsx(
                                                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                                                    currentTask.categoryId === c.id
                                                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                                        : "text-text-secondary hover:bg-bg-main"
                                                                )}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full ${c.color}`}></span>
                                                                <span className="truncate">{c.name}</span>
                                                                {currentTask.categoryId === c.id && <Check size={14} className="ml-auto" />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Priority Selector */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                                            <Flag size={12} /> {t('task_details.priority_label')}
                                        </label>
                                        <div className="relative" ref={priorityRef}>
                                            <button
                                                onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                                                className={clsx(
                                                    "w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                                    currentPriority
                                                        ? `${currentPriority.color}`
                                                        : "bg-bg-surface border-border text-text-secondary hover:border-border-subtle"
                                                )}
                                            >
                                                <Flag size={16} className={currentPriority ? "fill-current" : ""} />
                                                <span className="flex-1 text-left">
                                                    {currentPriority ? currentPriority.label : t('task_details.set_priority')}
                                                </span>
                                                <ChevronRight className={clsx("text-current opacity-50 transition-transform", isPriorityOpen && 'rotate-90')} size={16} />
                                            </button>

                                            <AnimatePresence>
                                                {isPriorityOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-20 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => { setEditedTask(prev => prev ? { ...prev, priority: undefined } : null); setIsPriorityOpen(false); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <X size={14} /> {t('task_details.clear_priority')}
                                                        </button>
                                                        {priorityOptions.map(p => (
                                                            <button
                                                                key={p.value}
                                                                onClick={() => { setEditedTask(prev => prev ? { ...prev, priority: p.value } : null); setIsPriorityOpen(false); }}
                                                                className={clsx(
                                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mt-0.5",
                                                                    p.color,
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
                        <div className="p-4 border-t border-border bg-bg-surface/95 shrink-0 flex justify-end gap-3 z-20 pb-[env(safe-area-inset-bottom,20px)]">
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
                                className="shadow-lg shadow-blue-500/20"
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
