import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DateRangePicker from '../../components/shared/DateRangePicker';
import DurationDisplay from './components/DurationDisplay';
import { formatDuration } from '../../utils/formatters';
import { filterTasks } from '../../utils/dateHelpers';
import { Task, Category, DateRange, TimeLog } from '../../types';
// import { CHART_THEME } from '../../constants/theme'; // Deprecated
import { getThemeColor } from '../../utils/theme';
import ActivityHeatmap from './components/ActivityHeatmap';
import StreakWidget from './components/StreakWidget';
import VelocityChart from './components/VelocityChart';
import EfficiencyStats from './components/EfficiencyStats';
import { calculateVelocity, calculateSessionStats, calculateSessionStreak } from '../../utils/analyticsHelpers';
import { TimeLedger } from '../../services/storage/TimeLedger';
import NavSpacer from '../../components/layout/NavSpacer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { Container } from '../../components/ui/Layout';

interface AnalyticsViewProps {
    tasks: Task[];
    categories: Category[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, categories }) => {
    const { t } = useTranslation();

    // V2: Fetch logs directly from Repository
    const [logs, setLogs] = useState<TimeLog[]>([]);

    useEffect(() => {
        // Initial load
        setLogs(TimeLedger.getAllLogs());
        // Subscribe to real-time updates
        const unsubscribe = TimeLedger.subscribe(setLogs);
        return unsubscribe;
    }, []);

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

    // Filter Logs by Date Range
    const filteredLogs = useMemo(() => {
        if (!logs.length) return [];
        // Helper to check if log startTime is within range
        return logs.filter(l => {
            const sessionDate = l.startTime.split('T')[0];
            return sessionDate >= dateFilter.start && sessionDate <= dateFilter.end;
        });
    }, [logs, dateFilter]);


    // B. Global Derived Metrics (Streak depends on history, not filter)
    const streak = useMemo(() => calculateSessionStreak(logs), [logs]);

    // C. Velocity Data (Last 14 Days fixed Trend)
    const velocityData = useMemo(() => calculateVelocity(tasks, 14), [tasks]);

    // D. Efficiency (Based on Filtered Selection)
    const efficiency = useMemo(() => calculateSessionStats(filteredLogs), [filteredLogs]);

    // Calculate Total Time from Logs
    const totalSelectedTime = useMemo(() => {
        return filteredLogs.reduce((acc, l) => acc + (l.duration || 0), 0);
    }, [filteredLogs]);

    // E. Pie Chart Data (Time per Project)
    // Using cachedTotalTime (Source of Truth V2)
    const projectData = useMemo(() => {
        const data = categories.map(cat => {
            const duration = filteredTasks
                .filter(t => String(t.categoryId) === String(cat.id))
                .reduce((acc, t) => acc + (t.cachedTotalTime || 0), 0); // V2: Use cachedTotalTime
            // Normalize color: If 'bg-indigo-500', becomes 'indigo-500'. If 'indigo', stays 'indigo'.
            return { name: cat.name, value: duration, color: cat.color.replace('bg-', '') };
        }).filter(d => d.value > 0);

        const noProjectDuration = filteredTasks
            .filter(t => !t.categoryId)
            .reduce((acc, t) => acc + (t.cachedTotalTime || 0), 0); // V2: Use cachedTotalTime

        if (noProjectDuration > 0) {
            data.push({ name: t('analytics.no_project', 'No Project'), value: noProjectDuration, color: 'text-tertiary' });
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
        // Recharts requires Hex values for fills.
        // We now resolve these dynamically from CSS variables via generic ThemeService.
        const colors: Record<string, string> = {
            'blue-500': 'hsl(var(--palette-blue))',
            'red-500': 'hsl(var(--palette-red))',
            'green-500': 'hsl(var(--palette-green))',
            'amber-500': 'hsl(var(--palette-amber))',
            'purple-500': 'hsl(var(--palette-purple))',
            'pink-500': 'hsl(var(--palette-pink))',
            'cyan-500': 'hsl(var(--palette-cyan))',
            'indigo-500': 'hsl(var(--palette-indigo))',
            'slate-500': 'hsl(var(--palette-slate))',
            'emerald-500': 'hsl(var(--palette-emerald))',

            // New Semantic IDs
            'blue': 'hsl(var(--palette-blue))',
            'red': 'hsl(var(--palette-red))',
            'green': 'hsl(var(--palette-green))',
            'amber': 'hsl(var(--palette-amber))',
            'purple': 'hsl(var(--palette-purple))',
            'pink': 'hsl(var(--palette-pink))',
            'cyan': 'hsl(var(--palette-cyan))',
            'indigo': 'hsl(var(--palette-indigo))',
            'slate': 'hsl(var(--palette-slate))',
            'emerald': 'hsl(var(--palette-emerald))',
            'rose': 'hsl(var(--palette-red))',
            'violet': 'hsl(var(--palette-purple))',

            'slate-400': 'hsl(var(--palette-slate-light))',
            'text-tertiary': 'hsl(var(--text-secondary))',
            'bg-surface': 'hsl(var(--bg-surface))'
        };
        return colors[twClass] || 'hsl(var(--border-color))';
    };

    return (
        <Container size="xl" className="space-y-6 pt-6 animate-in fade-in duration-500">
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
                <Card className="flex items-center gap-3 p-4 relative overflow-hidden">
                    {/* Icon */}
                    <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0 z-10">
                        <Timer size={24} />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col z-10">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-0.5">
                            {t('analytics.total_time')}
                        </span>
                        <DurationDisplay
                            overrideSeconds={totalSelectedTime}
                            formatter={(val: number) => formatDuration(val, durationLabels)}
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
                            <div className="flex-1 min-h-0 relative outline-none" role="img" aria-label={t('analytics.time_distribution', 'Project Time Distribution')} tabIndex={-1}>
                                {/* Center Text: Top Project - Placed BEFORE chart to be in background */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-xs text-text-secondary uppercase font-bold">{t('analytics.top')}</p>
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
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--bg-surface))',
                                                    borderColor: 'hsl(var(--border-color))',
                                                    color: 'hsl(var(--text-primary))',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                                itemStyle={{ color: 'hsl(var(--text-primary))' }}
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
