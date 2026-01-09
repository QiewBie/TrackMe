import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line
} from 'recharts';
import { useTranslation } from 'react-i18next';
// import { CHART_THEME } from '../../../constants/theme'; // Deprecated
import { getThemeColor } from '../../../utils/theme';
import Badge from '../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface VelocityChartProps {
    data: { date: string; completed: number; created: number }[];
}

const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
    const { t } = useTranslation();

    // Resolve colors dynamically
    // Use CSS variables directly for Recharts (Modern browser support)
    const primaryColor = 'hsl(var(--brand-primary))';
    const textColor = 'hsl(var(--text-secondary))';
    const borderColor = 'hsl(var(--border-color))';
    const surfaceColor = 'hsl(var(--bg-surface))';

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <CardTitle>{t('analytics.velocity_title', 'Task Velocity')}</CardTitle>
                    <Badge variant="soft">
                        {t('analytics.days_14', '14 Days')}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col pt-0">
                {/* Flex-1 ensures chart acts as a spacer, filling remaining height */}
                <div className="flex-1 w-full min-h-0 outline-none" role="img" aria-label={t('analytics.velocity_title')} tabIndex={-1}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={textColor} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={textColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: textColor, fontSize: 11 }}
                                dy={10}
                                height={30}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: textColor, fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: surfaceColor,
                                    borderColor: borderColor,
                                    color: 'hsl(var(--text-primary))',
                                    borderRadius: '12px',
                                    boxShadow: 'var(--shadow-tooltip)'
                                }}
                                labelStyle={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}
                            />

                            <Area
                                type="monotone"
                                dataKey="created"
                                name={t('analytics.created')}
                                stroke={textColor}
                                strokeOpacity={0.4}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCreated)"
                            />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                name={t('analytics.completed')}
                                stroke={primaryColor}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCompleted)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex gap-6 mt-4 justify-center text-xs font-medium shrink-0">
                    <div className="flex items-center gap-2 text-text-secondary">
                        <div className="w-2.5 h-2.5 rounded-full bg-ui-disabled"></div>
                        <span className="leading-none">{t('analytics.created')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-primary">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                        <span className="leading-none">{t('analytics.completed')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default VelocityChart;
