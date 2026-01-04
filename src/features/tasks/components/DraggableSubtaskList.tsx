import React, { memo } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { clsx } from 'clsx';
import { Check, X, GripVertical } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Subtask, Task } from '../../../types';

interface DraggableSubtaskItemProps {
    subtask: Subtask;
    onChange: (id: string, updates: Partial<Subtask>) => void;
    onDelete: (id: string) => void;
}

const DraggableSubtaskItem = memo(({ subtask, onChange, onDelete }: DraggableSubtaskItemProps) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={subtask}
            dragListener={false}
            dragControls={controls}
            className="relative touch-none"
        >
            <div className="flex items-center gap-3 p-3 hover:bg-bg-surface group transition-colors">
                <button
                    type="button"
                    onClick={() => onChange(subtask.id, { completed: !subtask.completed })}
                    className={clsx(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                        subtask.completed
                            ? 'bg-brand-primary border-brand-primary text-white'
                            : 'border-border-subtle hover:border-brand-primary bg-bg-surface'
                    )}
                >
                    {subtask.completed && <Check size={12} strokeWidth={3} />}
                </button>
                <Input
                    value={subtask.title}
                    onChange={(e) => onChange(subtask.id, { title: e.target.value })}
                    className={clsx(
                        "py-1 border-b border-transparent rounded-none transition-all px-0 flex-1",
                        subtask.completed ? 'text-ui-disabled line-through decoration-border' : 'text-text-primary'
                    )}
                    variant="ghost"
                />

                <div className="flex items-center gap-1">
                    <Button
                        variant="icon"
                        onClick={() => onDelete(subtask.id)}
                        className="text-text-secondary hover:text-status-error transition-all p-1.5 hover:bg-status-error/10 opacity-0 group-hover:opacity-100"
                        icon={X}
                    />
                    <div
                        className="p-1.5 cursor-grab active:cursor-grabbing text-text-secondary/50 hover:text-text-primary transition-all opacity-0 group-hover:opacity-100 touch-none"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical size={18} />
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
});

DraggableSubtaskItem.displayName = 'DraggableSubtaskItem';

interface SubtaskListProps {
    subtasks: Subtask[];
    onReorder: (newSubtasks: Subtask[]) => void;
    onUpdate: (id: string, updates: Partial<Subtask>) => void;
    onDelete: (id: string) => void;
}

export const SubtaskList = memo(({ subtasks, onReorder, onUpdate, onDelete }: SubtaskListProps) => {
    return (
        <Reorder.Group axis="y" values={subtasks} onReorder={onReorder} className="divide-y divide-border">
            {subtasks.map((subtask) => (
                <DraggableSubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    onChange={onUpdate}
                    onDelete={onDelete}
                />
            ))}
        </Reorder.Group>
    );
});

SubtaskList.displayName = 'SubtaskList';
