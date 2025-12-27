import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { CHART_THEME } from '../../constants/theme';
import Badge from '../ui/Badge';

interface VelocityChartProps {
    data: { date: string; completed: number; created: number }[];
}

const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                {t('analytics.velocity_title', 'Task Velocity')}
                <Badge variant="soft">
                    {t('analytics.days_14', '14 Days')}
                </Badge>
            </h3>

            {/* Flex-1 ensures chart acts as a spacer, filling remaining height */}
            <div className="flex-1 w-full min-h-0 outline-none" role="img" aria-label={t('analytics.velocity_title')} tabIndex={-1}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_THEME.colors.primary} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={CHART_THEME.colors.primary} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_THEME.colors.text} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={CHART_THEME.colors.text} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} vertical={false} opacity={0.3} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: CHART_THEME.axis.tick, fontSize: 12 }}
                            dy={10}
                            height={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: CHART_THEME.axis.tick, fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ ...CHART_THEME.tooltip, borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="created"
                            name={t('analytics.created', 'New Tasks')}
                            stroke={CHART_THEME.colors.text}
                            strokeOpacity={0.4}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCreated)"
                        />
                        <Area
                            type="monotone"
                            dataKey="completed"
                            name={t('analytics.completed', 'Completed')}
                            stroke={CHART_THEME.colors.primary}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCompleted)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex gap-6 mt-4 justify-center text-xs font-medium shrink-0">
                <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                    <span className="leading-none">{t('analytics.created', 'Created')}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="leading-none">{t('analytics.completed', 'Completed')}</span>
                </div>
            </div>
        </div>
    );
};

export default VelocityChart;
