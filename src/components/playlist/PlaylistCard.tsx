import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Edit3, Trash2, ListPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { Task, Playlist, Category } from '../../types';
import { getDeterministicGradient } from '../../constants/colors';

interface PlaylistCardProps {
    playlist: Playlist;
    tasks: Task[];
    categories: Category[]; // Kept for future use if we want to show category dots
    onStart: () => void;
    onDelete: () => void;
    onAddTasks: () => void;
    onViewDetails: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
    playlist, tasks, onStart, onDelete, onAddTasks, onViewDetails
}) => {
    const { t } = useTranslation();
    const bgGradient = useMemo(() => getDeterministicGradient(playlist.id), [playlist.id]);

    const playlistTasks = useMemo(() =>
        playlist.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[],
        [playlist.taskIds, tasks]
    );

    const completedCount = playlistTasks.filter(t => t.completed).length;
    const progress = playlistTasks.length > 0 ? (completedCount / playlistTasks.length) * 100 : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="group relative flex flex-col h-full bg-bg-surface rounded-3xl border border-border shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
            {/* Cover Art Area */}
            <div
                onClick={onViewDetails}
                className={`h-32 w-full bg-gradient-to-br ${bgGradient} relative cursor-pointer`}
            >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />

                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 bg-black/10 md:bg-black/20 backdrop-blur-[0px] md:backdrop-blur-[2px]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onStart(); }}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 active:bg-slate-200 transition-all text-slate-900"
                        aria-label={t('playlists.start_session')}
                    >
                        <Play size={24} className="ml-1" fill="currentColor" />
                    </button>
                </div>

                <div className="absolute bottom-3 left-4 text-white font-bold text-shadow-sm">
                    {playlistTasks.length} {t('playlists.tasks_short', 'tasks')}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-text-primary truncate pr-2" title={playlist.title}>
                        {playlist.title}
                    </h3>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                            className="text-text-secondary hover:text-blue-500 transition-colors p-2 md:p-1"
                            title={t('playlists.manage', 'Manage Tasks')}
                        >
                            <Edit3 size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="text-text-secondary hover:text-red-500 transition-colors p-2 md:p-1"
                            title={t('common.delete', 'Delete')}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Task Preview */}
                <div className="space-y-2 mb-4 flex-1">
                    {playlistTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="text-xs text-text-secondary flex items-center gap-2 truncate">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.completed ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                            <span className={task.completed ? 'line-through opacity-70' : ''}>{task.title}</span>
                        </div>
                    ))}
                    {playlistTasks.length > 3 && (
                        <div className="text-xs text-text-secondary italic pl-3.5">
                            + {playlistTasks.length - 3} more...
                        </div>
                    )}
                    {playlistTasks.length === 0 && (
                        <div className="text-xs text-text-secondary italic">No tasks added yet</div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden mb-4">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <Button
                        variant="secondary"
                        className="flex-1 justify-center text-xs py-2 h-auto"
                        onClick={onAddTasks}
                        icon={ListPlus}
                    >
                        {t('playlists.add_tasks', 'Add Tasks')}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
