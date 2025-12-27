import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../utils/formatters';
import { Text } from '../ui/Typography';

interface TimerDisplayProps {
    timeLeft: number;
    isTimerRunning: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = memo(({ timeLeft, isTimerRunning }) => {
    const { t } = useTranslation();

    return (
        <div className="relative group cursor-default flex flex-col items-center justify-center select-none perspective-500 transform-gpu will-change-transform w-full">
            {/* Back Glow - Optimized */}
            <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[250%] rounded-full transform transition-all duration-1000 ease-in-out ${isTimerRunning ? 'scale-110 opacity-100' : 'scale-75 opacity-10'}`}
                style={{
                    background: 'radial-gradient(circle, var(--brand-subtle) 0%, transparent 70%)',
                    willChange: 'transform, opacity'
                }}
            />

            {/* Timer Digits */}
            <div className={`
                relative z-10 font-[800] leading-none tracking-tighter tabular-nums text-center
                bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400
                text-[18vw] lg:text-[10vw]
                filter drop-shadow-2xl
                transition-transform duration-500 will-change-transform
                ${isTimerRunning ? 'scale-105' : 'scale-100'}
            `}>
                {formatTime(timeLeft)}
            </div>

            {/* Status Indicator */}
            <div className={`
                mt-4 sm:mt-8 px-6 py-2 rounded-full text-sm sm:text-base font-bold uppercase tracking-widest border transition-all duration-500
                ${isTimerRunning
                    ? 'border-brand/20 text-brand bg-brand/5 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'border-transparent text-slate-400 dark:text-slate-500 bg-white/5'
                }
            `}>
                {isTimerRunning ? t('focus.status_focusing') : t('focus.status_paused')}
            </div>
        </div>
    );
});
