import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DateRangePicker from '../shared/DateRangePicker';
import TaskInput from '../tasks/TaskInput';
import TaskItem from '../tasks/TaskItem';
import DurationDisplay from '../analytics/DurationDisplay';
import { filterTasks, splitTasksByStatus } from '../../utils/dateHelpers';
import { Task, Category, FilterType, DateRange, ProjectNote } from '../../types';
import { Virtuoso } from 'react-virtuoso';
import RichTextEditor from '../ui/RichTextEditor';
import PageHeader from '../ui/PageHeader';

interface TaskListViewProps {
    tasks: Task[];
    categories: Category[];
    filter: FilterType;
    onAdd: (title: string, catId: string | number) => void;
    onToggleComplete: (id: string) => void;
    onEdit: (task: Task) => void;
    onToggleTimer: (id: string) => void;
    onDelete: (task: Task) => void;
    scrollContainer: HTMLElement | null;
    getProjectNote?: (categoryId: string) => ProjectNote | undefined;
    saveProjectNote?: (categoryId: string, content: string) => void;
}

// Inline component for tab consistency
const TabButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
        onClick={onClick}
        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${active
            ? 'bg-bg-main text-blue-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
            : 'text-text-secondary hover:text-text-primary'
            }`}
    >
        {label}
    </button>
);

const TaskListView: React.FC<TaskListViewProps> = ({
    tasks,
    categories,
    filter,
    onAdd,
    onToggleComplete,
    onEdit,
    onToggleTimer,
    onDelete,
    scrollContainer,
    getProjectNote,
    saveProjectNote
}) => {
    const { t } = useTranslation();
    const [dateFilter, setDateFilter] = useState<DateRange>(() => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
    });

    const filteredTasks = filterTasks(tasks, dateFilter, filter);
    const { visible: visibleTasks, completed: completedTasks } = splitTasksByStatus(filteredTasks);

    // Get current category name for header
    const currentCategory = filter === 'all'
        ? null
        : categories.find(c => String(c.id) === String(filter));

    const categoryName = currentCategory ? currentCategory.name : t('navigation.all_tasks');

    const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
    const [noteContent, setNoteContent] = useState('');

    // Reset tab and load note when filter changes
    React.useEffect(() => {
        setActiveTab('tasks');
    }, [filter]);

    // Load note content when opening notes or filter changes
    React.useEffect(() => {
        if (getProjectNote && filter !== 'all') {
            const note = getProjectNote(filter);
            // Always update content when switching filters or initial load
            // The RichTextEditor uses this 'content' prop to initialize.
            if (note) {
                setNoteContent(note.content);
            } else {
                setNoteContent(''); // Clear if no note exists for this project
            }
        }
    }, [filter, getProjectNote]);

    // Debounce save to prevent Firestore spam
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleNoteChange = (content: string) => {
        setNoteContent(content);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (saveProjectNote && filter !== 'all') {
                saveProjectNote(filter, content);
            }
        }, 1000); // Save after 1 second of inactivity
    };

    return (
        <div className={`mx-auto w-full pb-20 ${filter !== 'all' ? 'max-w-[1600px]' : 'max-w-4xl'}`}>
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 relative z-30">
                <div className="text-left w-full">
                    <PageHeader
                        title={
                            <>
                                {currentCategory?.color && (
                                    <span className={`w-8 h-8 rounded-full ${currentCategory.color}`}></span>
                                )}
                                {filter === 'all' ? t('tasks.overview') : categoryName || t('tasks.project_view')}
                            </>
                        }
                        className="mb-0" // Override default margin since we have custom layout here
                    />

                    {filter === 'all' && (
                        <div className="mt-2 text-text-secondary font-medium text-lg">
                            {/* Subtitle or DatePicker area if needed specifically under title */}
                            <DateRangePicker selectedRange={dateFilter} onChange={setDateFilter} />
                        </div>
                    )}
                </div>

                {filter !== 'all' && (
                    <div className="flex bg-bg-surface p-1.5 rounded-xl lg:hidden w-full md:w-auto">
                        <TabButton
                            active={activeTab === 'tasks'}
                            onClick={() => setActiveTab('tasks')}
                            label={t('tasks.tasks_tab')}
                        />
                        <TabButton
                            active={activeTab === 'notes'}
                            onClick={() => setActiveTab('notes')}
                            label={t('tasks.notes')}
                        />
                    </div>
                )}

                <div className="w-full md:w-auto bg-bg-surface px-5 py-3 rounded-xl border border-border shadow-sm flex items-center justify-between md:block">
                    <p className="text-xs font-bold text-text-secondary uppercase mb-0 md:mb-1">{t('tasks.total_time')}</p>
                    <DurationDisplay tasks={filteredTasks} />
                </div>
            </div>

            <div className={`grid gap-8 ${filter !== 'all' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
                {/* Tasks Column - Always visible on Desktop, or on Mobile if tab is tasks */}
                <div className={`${filter !== 'all' ? 'lg:col-span-7 xl:col-span-8' : ''} ${(activeTab === 'tasks' || filter === 'all') ? 'block' : 'hidden lg:block'}`}>
                    <div className="relative z-20 mb-6">
                        <TaskInput key={filter} categories={categories} onAdd={onAdd} currentFilter={filter} />
                    </div>

                    <div className="flex-1">
                        {visibleTasks.length > 0 ? (
                            <Virtuoso
                                customScrollParent={scrollContainer || undefined}
                                data={visibleTasks}
                                itemContent={(index, task) => (
                                    <div className="pb-3 px-1">
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            categories={categories}
                                            onToggleComplete={onToggleComplete}
                                            onEdit={onEdit}
                                            onToggleTimer={onToggleTimer}
                                            onDelete={onDelete}
                                        />
                                    </div>
                                )}
                            />
                        ) : (
                            /* Show Empty State if no tasks */
                            <div className="text-center py-20 opacity-50">
                                <div className="inline-flex bg-bg-surface p-6 rounded-full mb-4">
                                    <FolderKanban size={48} className="text-text-secondary" />
                                </div>
                                <p className="text-lg font-bold text-text-secondary">
                                    {filter === 'all'
                                        ? t('tasks.empty_date')
                                        : t('tasks.empty_project', { project: categoryName })
                                    }
                                </p>
                                <p className="text-sm text-text-secondary mt-2">{t('tasks.create_hint')}</p>
                            </div>
                        )}
                    </div>

                    {completedTasks.length > 0 && (
                        <div className="pt-8">
                            <h3 className="text-xs font-bold text-text-secondary uppercase mb-3">{t('tasks.completed_section')}</h3>
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {completedTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            animate={{ opacity: 0.6, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, height: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <TaskItem
                                                task={task}
                                                categories={categories}
                                                onToggleComplete={onToggleComplete}
                                                onEdit={onEdit}
                                                onToggleTimer={onToggleTimer}
                                                onDelete={onDelete}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes Column - Split on desktop, Tab on mobile */}
                {filter !== 'all' && (
                    <div className={`lg:col-span-5 xl:col-span-4 ${activeTab === 'notes' ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-bg-surface rounded-2xl border border-border h-[calc(100vh-280px)] sticky top-6 overflow-hidden flex flex-col shadow-sm">
                            <div className="p-4 border-b border-border flex items-center justify-between bg-bg-surface">
                                <h3 className="font-bold text-text-primary flex items-center gap-2">
                                    <Edit3 size={16} />
                                    {t('tasks.project_notes')}
                                </h3>
                                <span className="text-xs text-text-secondary font-mono">{t('tasks.markdown_supported')}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <RichTextEditor
                                    key={filter}
                                    content={noteContent}
                                    onChange={handleNoteChange}
                                    placeholder={t('tasks.notes_placeholder')}
                                    className="min-h-full !border-0 !shadow-none !rounded-none !bg-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskListView;
