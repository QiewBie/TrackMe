import React, { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DateRangePicker from '../shared/DateRangePicker';
import TotalTimeDisplay from './TotalTimeDisplay';
import { formatDuration } from '../../utils/formatters';
import { filterTasks } from '../../utils/dateHelpers';
import { Task, Category, DateRange } from '../../types';
import { CHART_THEME } from '../../constants/theme';
import ActivityHeatmap from './ActivityHeatmap';
import StreakWidget from './StreakWidget';
import VelocityChart from './VelocityChart';
import EfficiencyStats from './EfficiencyStats';
import { calculateVelocity, calculateSessionStats, calculateSessionStreak } from '../../utils/analyticsHelpers';
import { useSession } from '../../context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { Container } from '../ui/Layout';

interface AnalyticsViewProps {
    tasks: Task[];
    categories: Category[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, categories }) => {
    const { t } = useTranslation();

    // Context: Get REAL history
    const { sessionsHistory } = useSession();

    // 0. Date Filter State
    const [dateFilter, setDateFilter] = useState<DateRange>(() => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
    });

    const [isMounted, setIsMounted] = useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Data Processing
    // A. Filtered Data (for specific range metrics)
    const filteredTasks = useMemo(() => filterTasks(tasks, dateFilter), [tasks, dateFilter]);

    // Filter Sessions by Date Range
    const filteredSessions = useMemo(() => {
        if (!sessionsHistory.length) return [];
        // Helper to check if session startTime is within range
        return sessionsHistory.filter(s => {
            // simplified: check simple string compare for ISO date part
            const sessionDate = s.startTime.split('T')[0];
            return sessionDate >= dateFilter.start && sessionDate <= dateFilter.end;
        });
    }, [sessionsHistory, dateFilter]);


    // B. Global Derived Metrics (Streak depends on history, not filter)
    // USE SESSION STREAK!
    const streak = useMemo(() => calculateSessionStreak(sessionsHistory), [sessionsHistory]);

    // C. Velocity Data (Last 14 Days fixed Trend)
    const velocityData = useMemo(() => calculateVelocity(tasks, 14), [tasks]);

    // D. Efficiency (Based on Filtered Selection)
    // USE SESSION STATS!
    const efficiency = useMemo(() => calculateSessionStats(filteredSessions), [filteredSessions]);

    // Calculate Total Time from Sessions
    const totalSelectedTime = useMemo(() => {
        return filteredSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    }, [filteredSessions]);

    // E. Pie Chart Data (Time per Project)
    // Update to use SESSIONS duration if possible, or stick to task.timeSpent for now (as migration backfilled it).
    // Let's stick to task.timeSpent for Pie Chart for now as it maps categories easier involved with Tasks.
    const projectData = useMemo(() => {
        const data = categories.map(cat => {
            const duration = filteredTasks
                .filter(t => String(t.categoryId) === String(cat.id))
                .reduce((acc, t) => acc + t.timeSpent, 0);
            return { name: cat.name, value: duration, color: cat.color.replace('bg-', '') };
        }).filter(d => d.value > 0);

        const noProjectDuration = filteredTasks
            .filter(t => !t.categoryId)
            .reduce((acc, t) => acc + t.timeSpent, 0);

        if (noProjectDuration > 0) {
            data.push({ name: t('analytics.no_project', 'No Project'), value: noProjectDuration, color: 'slate-400' });
        }
        return data.sort((a, b) => b.value - a.value);
    }, [categories, filteredTasks, t]);

    // Helper for duration labels
    const durationLabels = {
        h: t('analytics.hours', 'h'),
        m: t('analytics.minutes', 'm'),
        s: t('analytics.seconds', 's')
    };

    const getHexColor = (twClass: string) => {
        const colors: Record<string, string> = {
            'blue-500': '#3b82f6', 'red-500': '#ef4444', 'green-500': '#22c55e',
            'amber-500': '#f59e0b', 'purple-500': '#a855f7', 'pink-500': '#ec4899',
            'cyan-500': '#06b6d4', 'indigo-500': '#6366f1', 'slate-500': '#64748b',
            'emerald-500': '#10b981', 'slate-400': '#94a3b8'
        };
        return colors[twClass] || '#cbd5e1';
    };

    return (
        <Container size="xl" className="space-y-6 py-6 pb-24">
            {/* Header */}
            <PageHeader
                title={t('analytics.title')}
                subtitle={t('analytics.subtitle')}
                action={<DateRangePicker selectedRange={dateFilter} onChange={setDateFilter} align="right" />}
            />

            {/* Row 1: Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Streak Widget (Global) */}
                <div className="">
                    <StreakWidget current={streak.current} max={streak.max} />
                </div>

                {/* 2. Total Time (Filtered) */}
                {/* 2. Total Time (Filtered) */}
                <Card className="flex items-center gap-3 p-4 relative overflow-hidden">
                    {/* Icon */}
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 z-10">
                        <Timer size={24} />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col z-10">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-0.5">
                            {t('analytics.total_time')}
                        </span>
                        <TotalTimeDisplay
                            overrideSeconds={totalSelectedTime}
                            formatter={(val) => formatDuration(val, durationLabels)}
                            className="text-2xl font-black text-text-primary tracking-tight leading-none"
                        />
                    </div>

                    {/* Background Decor (Optional, subtle) */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transform rotate-12">
                        <Timer size={80} />
                    </div>
                </Card>

                {/* 3. Efficiency Stats (Filtered) - Spans 2 cols on LG */}
                <div className="lg:col-span-2">
                    <EfficiencyStats completionRate={0 /* Deprecated or calc from tasks */} avgDuration={efficiency.avgSessionDuration} />
                </div>
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Velocity Chart (Trends) - 2 Cols */}
                <div className="lg:col-span-2 h-[350px]">
                    <VelocityChart data={velocityData} />
                </div>

                {/* Pie Chart (Distribution) - 1 Col */}
                <Card className="flex flex-col h-[350px]">
                    <CardHeader>
                        <CardTitle>{t('analytics.time_by_project')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full pt-0">
                        {projectData.length > 0 ? (
                            <div className="flex-1 min-h-0 relative outline-none" role="img" aria-label="Project Time Distribution" style={{ outline: 'none' }} tabIndex={-1}>
                                {/* Center Text: Top Project - Placed BEFORE chart to be in background */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-[10px] text-text-secondary uppercase font-bold">{t('analytics.top')}</p>
                                        <p className="text-sm font-bold text-text-primary max-w-[80px] truncate">{projectData[0]?.name}</p>
                                    </div>
                                </div>

                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={projectData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {projectData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getHexColor(entry.color)} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => formatDuration(value, durationLabels)}
                                                contentStyle={CHART_THEME.tooltip}
                                                itemStyle={{ color: CHART_THEME.colors.text }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value) => <span className="text-xs font-medium text-text-secondary ml-1">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
                                {t('analytics.no_data')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Heatmap */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CardTitle>{t('analytics.consistency')}</CardTitle>
                        <Badge variant="soft">
                            {t('analytics.last_year')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ActivityHeatmap tasks={tasks} />
                </CardContent>
            </Card>
        </Container>
    );
};

export default AnalyticsView;
