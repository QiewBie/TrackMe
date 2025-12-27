import React, { memo } from 'react';
import { X, CheckSquare, Plus, CheckCircle, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '../ui/Typography';
import { Task, Category } from '../../types';
import { Reorder, useDragControls } from 'framer-motion';

// Draggable Item Component (Internal)
// We need to pass the color mapping logic in or use style
const DraggableQueueItem = memo(({ task, categoryColor, categoryName, onSelect, isActive }: { task: Task, categoryColor: string, categoryName: string, onSelect: (t: Task) => void, isActive?: boolean }) => {
    const controls = useDragControls();

    // Simple color fallback if token usage is complex, but better to use prop
    return (
        <Reorder.Item
            value={task}
            dragListener={false}
            dragControls={controls}
            className="mb-2 relative"
        >
            <button
                type="button"
                className={`
                    group w-full p-4 rounded-xl border flex items-center gap-4 transition-all cursor-pointer relative overflow-hidden text-left
                    ${isActive
                        ? 'bg-brand/5 border-brand/20 ring-1 ring-brand/10'
                        : 'bg-bg-surface border-border hover:border-border/80 hover:bg-bg-main'
                    } 
                    ${task.completed ? 'opacity-60' : ''}
                `}
                onClick={() => onSelect(task)}
            >
                <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                    ${task.completed ? 'bg-status-success border-status-success' : 'border-border group-hover:border-text-secondary'}
                `}>
                    {task.completed && <CheckCircle size={12} className="text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${task.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                        {task.title}
                    </div>
                    {categoryName && (
                        <div className="text-xs text-text-secondary/80 mt-1 flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_4px_currentColor] ${categoryColor}`} />
                            {categoryName}
                        </div>
                    )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 p-2 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary transition-opacity" onPointerDown={(e) => controls.start(e)}>
                    <GripVertical size={16} />
                </div>
            </button>
        </Reorder.Item>
    );
});


interface FocusSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeTask: Task | undefined;
    queue: Task[];
    categories: Category[];
    onToggleSubtask: (subId: string) => void;
    onAddSubtask: (title: string) => void;
    onReorder: (tasks: Task[]) => void;
    onQueueSelect: (task: Task) => void;
}

export const FocusSidebar: React.FC<FocusSidebarProps> = memo(({
    isOpen,
    onClose,
    activeTask,
    queue,
    categories,
    onToggleSubtask,
    onAddSubtask,
    onReorder,
    onQueueSelect
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed inset-y-0 right-0 w-full md:w-[400px] bg-bg-main/95 backdrop-blur-xl border-l border-border/50 
                flex flex-col z-[70] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Panel Header */}
                <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-border/40">
                    <Heading variant="h4" className="flex items-center gap-2 text-text-primary">
                        {t('focus.session_details') || "Session Details"}
                    </Heading>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 hover:bg-white/5 rounded-xl text-text-secondary transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                    {/* Subtasks */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Text variant="caption" weight="bold" className="uppercase text-text-secondary/60 tracking-wider text-xs">
                                {t('task_details.subtasks_label')}
                            </Text>
                            <span className="px-2 py-0.5 rounded-full bg-bg-surface text-xs font-medium text-text-secondary">
                                {activeTask?.subtasks?.filter(s => s.completed).length || 0}/{activeTask?.subtasks?.length || 0}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {activeTask?.subtasks?.map(subtask => (
                                <div key={subtask.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-surface/50 border border-transparent hover:border-border/50 transition-all group">
                                    <button onClick={() => onToggleSubtask(subtask.id)} className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${subtask.completed ? 'bg-brand border-brand' : 'border-border group-hover:border-brand/50'}`}>
                                        {subtask.completed && <CheckSquare size={12} className="text-white" />}
                                    </button>
                                    <span className={`text-sm leading-snug ${subtask.completed ? 'text-text-secondary line-through decoration-text-secondary/50' : 'text-text-primary'}`}>
                                        {subtask.title}
                                    </span>
                                </div>
                            ))}

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const input = form.elements.namedItem('newStep') as HTMLInputElement;
                                if (!input.value.trim() || !activeTask) return;
                                onAddSubtask(input.value.trim());
                                input.value = '';
                            }}>
                                <div className="flex items-center gap-3 mt-4 px-3 py-2 text-text-secondary hover:text-text-primary transition-colors cursor-text group border-b border-transparent focus-within:border-brand/50">
                                    <Plus size={16} className="text-text-secondary group-hover:text-brand transition-colors" />
                                    <input name="newStep" placeholder={t('focus.add_step_placeholder') || "Add subtask..."} className="bg-transparent text-sm w-full placeholder:text-text-secondary/50 focus:outline-none" autoComplete="off" />
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Queue */}
                    <section className="space-y-4">
                        <Text variant="caption" weight="bold" className="uppercase text-text-secondary/60 tracking-wider text-xs">
                            {t('focus.queue_title')}
                        </Text>
                        <Reorder.Group axis="y" values={queue} onReorder={onReorder} className="space-y-2">
                            {queue.map(task => (
                                <DraggableQueueItem
                                    key={task.id}
                                    task={task}
                                    isActive={activeTask?.id === task.id}
                                    categoryName={categories.find(c => String(c.id) === String(task?.categoryId))?.name || ''}
                                    categoryColor={categories.find(c => String(c.id) === String(task?.categoryId))?.color || 'slate'}
                                    onSelect={onQueueSelect}
                                />
                            ))}
                            {queue.length === 0 && (
                                <div className="p-8 text-center text-text-secondary/50 italic text-sm border-2 border-dashed border-border/30 rounded-xl">
                                    {t('focus.queue_empty') || "No more tasks in queue"}
                                </div>
                            )}
                        </Reorder.Group>
                    </section>
                </div>
            </div>
        </>
    );
});
