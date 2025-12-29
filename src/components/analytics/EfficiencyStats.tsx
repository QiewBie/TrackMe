import React from 'react';
import { Target, Clock, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '../../utils/formatters';
import { Card } from '../ui/Card';

interface EfficiencyStatsProps {
    completionRate: number;
    avgDuration: number;
}

const EfficiencyStats: React.FC<EfficiencyStatsProps> = ({ completionRate, avgDuration }) => {
    const { t } = useTranslation();

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <Card className="p-4 flex items-center gap-3 h-full relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transform rotate-12">
                <Icon size={80} />
            </div>

            <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 z-10`}>
                <Icon size={20} className={color.replace('bg-', 'text-')} />
            </div>
            <div className="z-10">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-text-primary leading-none mt-0.5">{value}</p>
            </div>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            <StatCard
                icon={Target}
                label={t('analytics.completion_rate', 'Completion Rate')}
                value={`${completionRate}%`}
                color="bg-emerald-500"
            />
            <StatCard
                icon={Clock}
                label={t('analytics.avg_duration', 'Avg Time/Task')}
                value={formatDuration(avgDuration, { h: 'h', m: 'm', s: 's' })}
                color="bg-violet-500"
            />
            {/* Future metric: Focus Quality */}
        </div>
    );
};

export default EfficiencyStats;
