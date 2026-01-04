import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Edit3, FolderKanban, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import DateRangePicker from '../../components/shared/DateRangePicker';
import TaskInput from './components/TaskInput';
import TaskItem from './components/TaskItem';
import DurationDisplay from '../analytics/components/DurationDisplay';
import { filterTasks, splitTasksByStatus } from '../../utils/dateHelpers';
import { Task, Category, FilterType, DateRange, ProjectNote } from '../../types';
import { Virtuoso } from 'react-virtuoso';
import RichTextEditor from '../../components/ui/RichTextEditor';
import PageHeader from '../../components/ui/PageHeader';
import { Container } from '../../components/ui/Layout';
import { Text } from '../../components/ui/Typography';
import { getCategoryClass } from '../../utils/theme';
import NavSpacer from '../../components/layout/NavSpacer';

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
    <Button
        variant="ghost"
        onClick={onClick}
        className={clsx(
            "flex-1 md:flex-none h-10 px-6 rounded-xl text-sm font-bold transition-all",
            active
                ? 'bg-bg-main text-brand-primary shadow-sm ring-1 ring-border-subtle'
                : 'text-text-secondary hover:text-text-primary bg-transparent'
        )}
    >
        {label}
    </Button>
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
        <Container
            size={filter !== 'all' ? 'xl' : 'md'}
            className="pt-6 animate-in fade-in duration-500"
        >
            <PageHeader
                className="mb-6"
                title={
                    <div className="flex items-center gap-3">
                        {currentCategory?.color && (
                            <span className={`w-3 h-3 lg:w-8 lg:h-8 rounded-full shadow-sm ring-2 ring-border/50 shrink-0 block ${getCategoryClass(currentCategory.color, 'bg')}`}></span>
                        )}
                        <span>{filter === 'all' ? t('tasks.overview') : categoryName || t('tasks.project_view')}</span>
                    </div>
                }
                subtitle={filter === 'all' ? (
                    <div className="mt-1">
                        <DateRangePicker selectedRange={dateFilter} onChange={setDateFilter} />
                    </div>
                ) : (
                    t('tasks.project_subtitle', 'Manage your project tasks.')
                )}
                action={
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto">
                        {filter !== 'all' && (
                            <div className="flex bg-bg-surface p-1 rounded-xl border border-border lg:hidden w-full md:w-auto">
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
                        <div className="w-full md:w-auto bg-bg-surface px-4 py-2 rounded-xl border border-border shadow-sm flex items-center justify-between md:block">
                            <p className="text-xs font-bold text-text-secondary uppercase mb-0 md:mb-0.5">{t('tasks.total_time')}</p>
                            <DurationDisplay tasks={filteredTasks} className="text-xl md:text-2xl font-black text-text-primary leading-none" />
                        </div>
                    </div>
                }
            />

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
                            <Text variant="caption" weight="bold" className="text-text-secondary uppercase mb-3 block">{t('tasks.completed_section')}</Text>
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
                    <NavSpacer />
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
                                    className="min-h-full"
                                    unstyled={true}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Container >
    );
};

export default TaskListView;
