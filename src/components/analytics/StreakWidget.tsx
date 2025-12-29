import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreakWidgetProps {
    current: number;
    max: number;
}

const StreakWidget: React.FC<StreakWidgetProps> = ({ current, max }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 rounded-3xl px-4 py-3 text-white shadow-sm relative overflow-hidden group h-full flex items-center justify-between">
            {/* Background Decoration */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 transform translate-x-1/4">
                <Flame size={80} />
            </div>

            <div className="relative z-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1 opacity-90">
                    <Flame className="animate-pulse" size={16} fill="currentColor" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t('analytics.streak_title', 'Daily Streak')}</span>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight">{current}</span>
                    <span className="text-sm font-medium opacity-80">{t('analytics.days', 'days')}</span>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-end justify-center">
                <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    <Trophy size={12} className="text-amber-200" />
                    <span>
                        {t('analytics.best_streak', 'Best')}: <b>{max}</b>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StreakWidget;
