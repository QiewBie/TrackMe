import * as React from 'react';
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTimerDisplay } from './FocusTimerDisplay';
import { Heading, Text } from '../../../components/ui/Typography';
import { ListMusic } from 'lucide-react';
import { Task, Category, Playlist } from '../../../types';
import { useTranslation } from 'react-i18next';
import { LAYOUT } from '../../../constants/layout';
import { getCategoryClass } from '../../../utils/theme';

interface FocusStageProps {
    activeTask: Task | undefined;
    isTimerRunning: boolean;
    timeLeft: number;
    settings: any;
    controlsVisible: boolean;
    ambientColor: string;
    contextPanelOpen: boolean;
    tasksCount: number;
    category?: Category;
    playlist?: Playlist;
}

export const FocusStage: React.FC<FocusStageProps> = memo(({
    activeTask,
    isTimerRunning,
    timeLeft,
    settings,
    controlsVisible,
    ambientColor,
    contextPanelOpen,
    tasksCount,
    category,
    playlist
}) => {
    const { t } = useTranslation();

    return (
        <div className={`
                flex-1 flex flex-col items-center justify-center relative z-10 p-6
                transition-all duration-500 ease-spring
            `}>
            <AnimatePresence mode="popLayout">
                {activeTask ? (
                    <motion.div
                        key="focus-stage"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-2xl flex flex-col items-center gap-10"
                    >
                        {/* Live Timer */}
                        <div className="w-full relative z-20 pointer-events-none">
                            <FocusTimerDisplay
                                timeLeft={timeLeft}
                                isTimerRunning={isTimerRunning}
                            />
                        </div>

                        {/* Active Task Details */}
                        <div className={`
                                flex flex-col items-center gap-6 text-center
                                transition-all duration-700 ease-spring
                                ${isTimerRunning ? 'scale-95' : 'scale-100'} 
                                ${(isTimerRunning && !controlsVisible) ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'}
                            `}>
                            <Heading variant="h2" className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-tight max-w-xl mx-auto drop-shadow-lg">
                                {activeTask.title}
                            </Heading>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {/* Project Badge */}
                                {category && (
                                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-bg-surface/80 backdrop-blur shadow-sm text-sm font-medium text-text-secondary border border-border-subtle">
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full shadow-glow ${getCategoryClass(category.color, 'bg')}`}
                                            style={{
                                                '--shadow-color': ambientColor // Keep glow logic if valid, or remove if ambientColor isn't hex. Assuming ambientColor IS hex for glow, but circle color comes from class.
                                            } as React.CSSProperties}
                                        />
                                        <span>{category.name}</span>
                                    </div>
                                )}

                                {/* Playlist Badge */}
                                {playlist && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/80 backdrop-blur shadow-sm text-sm font-medium text-text-secondary border border-border-subtle">
                                        <ListMusic size={14} />
                                        <span>{playlist.title}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // GHOST STATE
                    <motion.div
                        key="ghost-ui"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-2xl flex flex-col items-center gap-8 text-center"
                    >
                        <div className={`w-full relative z-20 grayscale opacity-50 ${!tasksCount ? 'animate-pulse' : ''}`}>
                            <FocusTimerDisplay
                                timeLeft={settings.workDuration * 60}
                                isTimerRunning={false}
                            />
                        </div>

                        <div className="space-y-4">
                            <Heading variant="h3" className="text-text-secondary font-medium">
                                {tasksCount > 0 ? (t('focus.ready_title')) : (t('common.loading'))}
                            </Heading>
                            {tasksCount > 0 && (
                                <Text className="text-text-secondary/60 max-w-md mx-auto">
                                    {t('focus.select_task_msg')}
                                </Text>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
