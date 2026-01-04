import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';
import { Check, Play, Pause, Edit3, Trash2, CheckSquare } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useGlobalTimer } from '../../../hooks/useGlobalTimer';
import TaskTimerWidget from './TaskTimerWidget';
import { Task, Category } from '../../../types';
import { useTranslation } from 'react-i18next';
import { getPriorityStyles } from '../../../constants/taskConstants';
import { getCategoryClass } from '../../../utils/theme';

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


    // V2: Check Global Timer for active status (Unified Monitor)
    const { isRunning, isPaused } = useGlobalTimer();
    const isTimerActive = isRunning(task.id);

    return (
        <div
            style={style}
            className={clsx(
                "group relative flex flex-col sm:flex-row items-center p-4 bg-bg-surface rounded-2xl border transition-all duration-300 gap-3 sm:gap-0",
                task.completed
                    ? "border-transparent bg-status-success/5"
                    : (isTimerActive
                        ? "border-brand-primary/50 shadow-brand-deep scale-[1.01] bg-brand-primary/5 dark:bg-brand-primary/10"
                        : "border-border hover:border-brand-primary hover:shadow-card")
            )}
        >
            {/* Left Section: Checkbox & Info */}
            < div className="flex items-center w-full sm:w-auto flex-1 min-w-0" >
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task.id);
                    }}
                    className={clsx(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0 mr-3 sm:mr-4",
                        task.completed
                            ? 'bg-brand-primary border-brand-primary text-white shadow-brand-glow'
                            : 'border-border-subtle hover:border-brand-primary bg-bg-surface'
                    )}
                    aria-label={task.completed ? t('tasks.actions.restore') : t('tasks.actions.complete')}
                >
                    {task.completed && <Check size={14} strokeWidth={3} />}
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
                            <span className={`w-1.5 h-1.5 rounded-full ${category ? getCategoryClass(category.color, 'bg') : 'bg-ui-disabled'}`}></span>
                            <span className="truncate max-w-[80px] sm:max-w-none">{category?.name || t('analytics.no_project')}</span>
                        </span>
                        {task.priority && !task.completed && (
                            <span className={clsx(
                                "text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0",
                                "text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0",
                                getPriorityStyles(task.priority)
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
            </div >

            {/* Right Section: Timer & Actions */}
            < div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2 md:gap-3 pl-9 sm:pl-0 border-t border-border-subtle pt-2 sm:pt-0 sm:border-t-0" >
                <TaskTimerWidget
                    task={task}
                    className={clsx("text-base md:text-xl mr-auto sm:mr-2 font-mono tabular-nums",
                        task.completed ? "text-text-secondary" : (isTimerActive ? "text-text-primary" : "text-text-secondary")
                    )}
                />

                <div className="flex items-center gap-1">
                    <Button
                        variant="icon"
                        onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                        className="p-2 text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors opacity-0 group-hover:opacity-100"
                        title={t('common.delete')}
                        aria-label={t('task_details.delete_task')}
                        icon={Trash2}
                    />

                    <Button
                        variant="icon"
                        onClick={() => onEdit(task)}
                        className="text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10"
                        title={t('tasks.edit')}
                        aria-label={t('tasks.edit')}
                        icon={Edit3}
                    />

                    {!task.completed && (
                        <button
                            onClick={() => onToggleTimer(task.id)}
                            className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 shrink-0 hover:shadow-xl ml-1",
                                isTimerActive
                                    ? "bg-brand-primary hover:bg-brand-hover rotate-0"
                                    : "bg-bg-subtle text-text-secondary hover:bg-brand-primary hover:text-white hover:rotate-12"
                            )}
                            aria-label={isTimerActive ? t('focus.pause') : t('focus.start')}
                        >
                            {isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                        </button>
                    )}
                </div>
            </div >
        </div >
    );
});

export default TaskItem;
