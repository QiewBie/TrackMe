import * as React from 'react';
import { memo } from 'react';
import { X, CheckSquare, Plus, CheckCircle, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '../ui/Typography';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Task, Category } from '../../types';
import { Reorder, useDragControls, motion } from 'framer-motion';

// Draggable Item Component (Internal)
// We need to pass the color mapping logic in or use style
const DraggableQueueItem = memo(({ task, categoryColor, categoryName, onSelect, isActive }: { task: Task, categoryColor: string, categoryName: string, onSelect: (t: Task) => void, isActive?: boolean }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={task}
            dragListener={false}
            dragControls={controls}
            className="relative"
            style={{ touchAction: 'none' }}
        >
            <div className={`              
                group w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 relative overflow-hidden text-left
                ${task.completed ? 'cursor-default opacity-80 bg-status-success/5 border-status-success/20' : 'cursor-pointer'}
                ${!task.completed && isActive
                    ? 'bg-brand/10 border-brand shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)] ring-1 ring-brand/20'
                    : !task.completed ? 'bg-bg-surface border-border-subtle hover:border-border hover:shadow-sm' : ''
                } 
            `}
                onClick={() => !task.completed && onSelect(task)}
            >
                {isActive && !task.completed && (
                    <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 bg-brand/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}

                <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 z-10
                    ${task.completed
                        ? 'bg-status-success border-status-success'
                        : isActive
                            ? 'border-brand text-brand'
                            : 'border-text-secondary/30 group-hover:border-text-primary'
                    }
                `}>
                    {task.completed && <CheckCircle size={12} className="text-white" />}
                    {!task.completed && isActive && <motion.div layoutId="active-dot" className="w-2.5 h-2.5 rounded-full bg-brand shadow-sm" />}
                </div>

                <div className="flex-1 min-w-0 z-10">
                    <div className={`font-medium truncate transition-colors ${task.completed ? 'text-text-secondary line-through decoration-status-success/50' : isActive ? 'text-brand font-bold' : 'text-text-primary'}`}>
                        {task.title}
                    </div>
                    {categoryName && (
                        <div className="text-xs text-text-secondary/70 mt-1 flex items-center gap-1.5">
                            <div
                                className={`w-2 h-2 rounded-full shadow-sm ${categoryColor}`}
                            />
                            {categoryName}
                        </div>
                    )}
                </div>

                <div className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-text-secondary/50 hover:text-text-primary transition-all z-10" onPointerDown={(e) => controls.start(e)}>
                    <GripVertical size={18} />
                </div>
            </div>
        </Reorder.Item>
    );
});


interface FocusSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeTask: Task | undefined;
    activePlaylist?: { title: string } | null; // Use partial type or import Playlist
    queue: Task[];
    categories: Category[];
    onToggleSubtask: (subId: string) => void;
    onAddSubtask: (title: string) => void;
    onReorder: (tasks: Task[]) => void;
    onQueueSelect: (task: Task) => void;
}

export const FocusSidebar = memo<FocusSidebarProps>(({
    isOpen,
    onClose,
    activeTask,
    activePlaylist,
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
                    className="fixed inset-0 bg-overlay z-overlay lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed inset-y-0 right-0 w-full md:w-sidebar-focus bg-bg-surface border-l border-border 
                flex flex-col z-modal shadow-2xl transform transition-transform duration-500 ease-spring
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Panel Header */}
                <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-bg-surface">
                    <div className="flex flex-row items-center gap-3">
                        <Heading variant="h4" className="text-text-primary font-bold tracking-tight text-base whitespace-nowrap">
                            {t('focus.session_details')}
                        </Heading>
                        {activePlaylist && (
                            <div className="flex items-center gap-2 pl-4 border-l-2 border-border-subtle h-6 shrink-0 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-brand shrink-0 shadow-sm"></span>
                                <Text className="text-sm text-text-primary font-bold truncate tracking-tight">
                                    {activePlaylist.title}
                                </Text>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="icon"
                        onClick={onClose}
                        className="-mr-2"
                        icon={X}
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-12">
                    {/* Subtasks */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Text variant="caption" weight="bold" className="uppercase text-text-secondary/60 tracking-wider text-xs">
                                {t('task_details.subtasks_label')}
                            </Text>
                            <span className="px-2.5 py-1 rounded-md bg-transparent text-xs font-semibold text-text-secondary">
                                {activeTask?.subtasks?.filter(s => s.completed).length || 0}/{activeTask?.subtasks?.length || 0}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {activeTask?.subtasks?.map(subtask => (
                                <div key={subtask.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-main/50 transition-colors group">
                                    <button
                                        onClick={() => onToggleSubtask(subtask.id)}
                                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${subtask.completed ? 'bg-status-success border-status-success' : 'border-border-subtle group-hover:border-brand'}`}
                                    >
                                        {subtask.completed && <CheckSquare size={10} className="text-white" />}
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
                                <div className="mt-4">
                                    <Input
                                        name="newStep"
                                        placeholder={t('focus.add_step_placeholder')}
                                        containerClassName="w-full"
                                        className="w-full"
                                        autoComplete="off"
                                    />
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
                                    {t('focus.queue_empty')}
                                </div>
                            )}
                        </Reorder.Group>
                    </section>
                </div>
            </div>
        </>
    );
});
