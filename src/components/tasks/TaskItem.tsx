import React, { memo } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, Play, Pause, Edit3, Trash2, CheckSquare } from 'lucide-react';
import { useFocusContext } from '../../context/FocusSessionContext';
import TimerDisplay from './TimerDisplay';
import { Task, Category } from '../../types';
import { useTranslation } from 'react-i18next';

interface TaskItemProps {
    task: Task;
    categories: Category[];
    onToggleComplete: (id: string) => void;
    onEdit: (task: Task) => void;
    onToggleTimer: (id: string) => void;
    onDelete: (task: Task) => void;
    style?: React.CSSProperties;
}

const TaskItem: React.FC<TaskItemProps> = memo(({ task, categories, onToggleComplete, onEdit, onToggleTimer, onDelete, style }) => {
    const { t } = useTranslation();
    const category = categories.find(c => String(c.id) === String(task.categoryId));

    // V2: Check Session Context for active status
    const { activeSession, isPaused } = useFocusContext();
    const isTimerActive = activeSession?.taskId === task.id && !isPaused;

    return (
        <div
            style={style}
            className={clsx(
                "group relative flex flex-col sm:flex-row items-center p-4 bg-bg-surface rounded-2xl border-2 transition-all duration-300 gap-3 sm:gap-0",
                task.completed
                    ? "border-dashed border-status-success/30 bg-status-success/5"
                    : (isTimerActive
                        ? "border-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] scale-[1.01] bg-amber-50/10 dark:bg-amber-900/10"
                        : "border-border hover:border-brand-primary hover:shadow-card")
            )}
        >
            {/* Left Section: Checkbox & Info */}
            <div className="flex items-center w-full sm:w-auto flex-1 min-w-0">
                <button
                    onClick={() => onToggleComplete(task.id)}
                    className="mr-3 sm:mr-4 group-check focus:outline-none shrink-0"
                    aria-label={task.completed ? t('tasks.actions.restore') : t('tasks.actions.complete')}
                >
                    <div className={clsx(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                        task.completed
                            ? "border-status-success bg-status-success"
                            : "border-border-subtle group-hover:border-brand-primary hover:bg-brand-primary/10"
                    )}>
                        <div className={clsx(
                            "w-3 h-3 rounded-full bg-white transition-transform duration-300",
                            task.completed ? "scale-100 opacity-100" : "scale-0 opacity-0 bg-brand-primary group-active:scale-75 group-active:opacity-50"
                        )} />
                    </div>
                </button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
                    <p className={clsx(
                        "font-bold truncate text-base sm:text-lg transition-colors duration-300",
                        task.completed && "line-through text-status-success/70 decoration-status-success/50 decoration-2",
                        !task.completed && (isTimerActive ? "text-brand-primary" : "text-text-primary")
                    )}>
                        {task.title}
                    </p>
                    <span className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={clsx(
                            "text-xs px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1.5 shrink-0",
                            task.completed ? "bg-bg-main text-ui-disabled" : "bg-bg-main text-text-secondary"
                        )}>
                            <span className={`w-1.5 h-1.5 rounded-full ${category?.color || 'bg-ui-disabled'}`}></span>
                            <span className="truncate max-w-[80px] sm:max-w-none">{category?.name || t('analytics.no_project')}</span>
                        </span>
                        {task.priority && !task.completed && (
                            <span className={clsx(
                                "text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0",
                                task.priority === 'high' && "bg-rose-500/10 text-rose-500",
                                task.priority === 'medium' && "bg-amber-500/10 text-amber-500",
                                task.priority === 'low' && "bg-emerald-500/10 text-emerald-500"
                            )}>
                                {task.priority}
                            </span>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-xs bg-bg-main px-2 py-0.5 rounded text-text-secondary font-medium inline-flex items-center gap-1.5 shrink-0">
                                <CheckSquare size={12} />
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Right Section: Timer & Actions */}
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2 md:gap-3 pl-9 sm:pl-0 border-t border-border-subtle pt-2 sm:pt-0 sm:border-t-0">
                <TimerDisplay
                    task={task}
                    className={clsx("text-base md:text-xl mr-auto sm:mr-2 font-mono tabular-nums",
                        task.completed ? "text-text-secondary" : (isTimerActive ? "text-text-primary" : "text-text-secondary")
                    )}
                />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onDelete(task)}
                        className="p-2 text-text-secondary hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                        title={t('common.delete')}
                        aria-label={t('task_details.delete_task')}
                    >
                        <Trash2 size={18} />
                    </button>

                    <button
                        onClick={() => onEdit(task)}
                        className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                        title={t('tasks.edit')}
                        aria-label={t('tasks.edit')}
                    >
                        <Edit3 size={18} />
                    </button>

                    {!task.completed && (
                        <button
                            onClick={() => onToggleTimer(task.id)}
                            className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 shrink-0 hover:shadow-xl ml-1",
                                isTimerActive
                                    ? "bg-amber-500 hover:bg-amber-600 rotate-0"
                                    : "bg-brand-primary hover:bg-brand-hover hover:rotate-12"
                            )}
                            aria-label={isTimerActive ? t('focus.pause') : t('focus.start')}
                        >
                            {isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default TaskItem;
