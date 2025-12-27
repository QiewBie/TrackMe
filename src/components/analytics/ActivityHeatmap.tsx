import React, { useMemo } from 'react';
import { eachDayOfInterval, subDays, format, parseISO, isSameDay, getDay, startOfWeek } from 'date-fns';
import { Task } from '../../types';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface ActivityHeatmapProps {
    tasks: Task[];
    daysBack?: number;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ tasks, daysBack = 364 }) => {
    const { t } = useTranslation();
    const today = new Date();
    const startDate = subDays(today, daysBack);
    const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

    // 1. Prepare Daily Data
    const dailyData = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: today });
        const dataMap = new Map<string, number>();

        // Pre-fill
        days.forEach(d => dataMap.set(format(d, 'yyyy-MM-dd'), 0));

        // Aggregate
        tasks.forEach(task => {
            if (task.completedAt) {
                const dateKey = format(parseISO(task.completedAt), 'yyyy-MM-dd');
                if (dataMap.has(dateKey)) {
                    dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
                }
            }
        });

        return days.map(date => {
            const count = dataMap.get(format(date, 'yyyy-MM-dd')) || 0;
            return { date, count };
        });
    }, [tasks, startDate, today]);

    // 2. Color Scale
    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-200 dark:bg-slate-700/50';
        if (count <= 2) return 'bg-blue-300 dark:bg-blue-900/60';
        if (count <= 4) return 'bg-blue-500 dark:bg-blue-700';
        if (count <= 6) return 'bg-blue-600 dark:bg-blue-500';
        return 'bg-blue-800 dark:bg-blue-400';
    };

    // 3. Grid Layout Logic (Weeks as Columns)
    const weeks = useMemo(() => {
        const weeksArray: { date: Date; count: number }[][] = [];
        let currentWeek: { date: Date; count: number }[] = [];

        dailyData.forEach((day) => {
            if (getDay(day.date) === 0 && currentWeek.length > 0) { // Sunday start
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(day);
        });
        if (currentWeek.length > 0) weeksArray.push(currentWeek);
        return weeksArray;
    }, [dailyData]);

    // Mobile Interaction: Select day to show details below
    const [selectedDayAndCount, setSelectedDayAndCount] = React.useState<{ date: Date; count: number } | null>(null);

    // Reset selection when tasks change
    React.useEffect(() => {
        setSelectedDayAndCount(null);
    }, [tasks]);

    return (
        <div className="w-full space-y-6">
            {/* Scrollable Container */}
            <div className="w-[calc(100%+3rem)] -ml-6 -mr-6 px-6 pt-4 pb-4 overflow-x-auto custom-scrollbar md:w-full md:ml-0 md:mr-0 md:px-0">
                <div
                    className="flex gap-[4px] w-max"
                    onMouseLeave={() => setHoveredDate(null)}
                >
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-[4px]">
                            {week.map((day, dIndex) => {
                                const dateKey = format(day.date, 'yyyy-MM-dd');
                                const isHovered = hoveredDate === dateKey;
                                const isSelected = selectedDayAndCount && isSameDay(selectedDayAndCount.date, day.date);

                                return (
                                    <div
                                        key={dIndex}
                                        onMouseEnter={() => setHoveredDate(dateKey)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle selection
                                            if (isSelected) {
                                                setSelectedDayAndCount(null);
                                            } else {
                                                setSelectedDayAndCount({ date: day.date, count: day.count });
                                            }
                                        }}
                                        className={clsx(
                                            "w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-[3px] transition-all relative cursor-pointer",
                                            (isHovered || isSelected) ? "ring-2 ring-slate-400 dark:ring-slate-500 z-10 scale-110" : "hover:ring-1 hover:ring-slate-300",
                                            getColor(day.count)
                                        )}
                                    >
                                        {/* Desktop Tooltip (Hover only) - Hidden on touch via media query ideally, or just rely on click logic */}
                                        {isHovered && !selectedDayAndCount && (
                                            <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-xl pointer-events-none whitespace-nowrap z-50">
                                                {format(day.date, 'MMM d')}: {day.count}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Panel & Legend */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t dark:border-slate-800 pt-4">

                {/* Active Selection Info */}
                <div className="h-5 flex items-center">
                    {selectedDayAndCount ? (
                        <div className="text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-200">
                            <span className="text-text-primary">{format(selectedDayAndCount.date, 'MMMM d, yyyy')}:</span>
                            <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
                                {selectedDayAndCount.count} {t('analytics.tasks_completed_short', 'tasks')}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-text-secondary italic">
                            {t('analytics.click_to_view_details', 'Click a square to view details')}
                        </span>
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>{t('analytics.less')}</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[1px] bg-slate-200 dark:bg-slate-700/50"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-blue-300 dark:bg-blue-900/60"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-blue-500 dark:bg-blue-700"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-blue-600 dark:bg-blue-500"></div>
                        <div className="w-3 h-3 rounded-[1px] bg-blue-800 dark:bg-blue-400"></div>
                    </div>
                    <span>{t('analytics.more')}</span>
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
