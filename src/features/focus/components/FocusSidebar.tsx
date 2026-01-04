import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';
import { X, CheckSquare, Plus, CheckCircle, GripVertical, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '../../../components/ui/Typography';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Task, Category } from '../../../types';
import { Reorder, useDragControls, motion } from 'framer-motion';
import { getCategoryClass } from '../../../utils/theme';

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
                    ? 'bg-brand/10 border-brand shadow-brand-card ring-1 ring-brand/20'
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
                                className={`w-2 h-2 rounded-full shadow-sm ${getCategoryClass(categoryColor, 'bg')}`}
                            />
                            {categoryName}
                        </div>
                    )}
                </div>

                <div className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-text-secondary/50 hover:text-text-primary transition-all z-10" onPointerDown={(e) => controls.start(e)} style={{ touchAction: 'none' }}>
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
                fixed inset-y-0 right-0 w-80 md:w-sidebar-focus bg-bg-surface border-l border-border 
                flex flex-col z-modal lg:z-fixed shadow-2xl transform transition-transform duration-500 ease-spring
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Panel Header */}
                <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-bg-surface pt-safe box-content h-[calc(4rem+env(safe-area-inset-top,0px))] md:h-16 md:pt-0 md:box-border">
                    <div className="flex flex-row items-center gap-3">
                        <Heading variant="h4" className="text-text-secondary font-bold text-xs tracking-wider">
                            {t('focus.session_details')}
                        </Heading>
                        {activePlaylist && (
                            <div className="flex items-center gap-2 pl-4 border-l-2 border-border-subtle h-4 shrink-0 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 shadow-sm"></span>
                                <Text className="text-xs text-text-primary font-bold truncate">
                                    {activePlaylist.title}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-12">
                    {/* Subtasks */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                {t('task_details.subtasks_label')}
                            </p>
                            <span className="px-2.5 py-1 rounded-md bg-transparent text-xs font-semibold text-text-secondary">
                                {activeTask?.subtasks?.filter(s => s.completed).length || 0}/{activeTask?.subtasks?.length || 0}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {activeTask?.subtasks?.map(subtask => (
                                <div key={subtask.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-main/50 transition-colors group">
                                    <Button
                                        variant="ghost"
                                        onClick={() => onToggleSubtask(subtask.id)}
                                        className={clsx(
                                            "w-6 h-6 p-0 rounded-lg flex items-center justify-center border-2 transition-all",
                                            subtask.completed ? "bg-brand-primary border-brand-primary text-white" : "border-border-subtle hover:border-brand-primary"
                                        )}
                                    >
                                        <Check size={14} className={clsx("transition-transform duration-200", subtask.completed ? "scale-100" : "scale-0")} strokeWidth={3} />
                                    </Button>
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
                        <p className="px-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                            {t('focus.queue_title')}
                        </p>
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
