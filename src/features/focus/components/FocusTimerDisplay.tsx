import * as React from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../../utils/formatters';
import { Text } from '../../../components/ui/Typography';

interface TimerDisplayProps {
    timeLeft: number;
    isTimerRunning: boolean;
}

export const FocusTimerDisplay: React.FC<TimerDisplayProps> = memo(({ timeLeft, isTimerRunning }) => {
    const { t } = useTranslation();

    return (
        <div className="relative group cursor-default flex flex-col items-center justify-center select-none perspective-500 transform-gpu will-change-transform w-full">
            {/* Back Glow - Optimized */}
            {/* Back Glow - Optimized */}
            <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[250%] rounded-full transform transition-all duration-700 ease-spring bg-brand-subtle blur-3xl ${isTimerRunning ? 'scale-110 opacity-60' : 'scale-75 opacity-0'}`}
                style={{ willChange: 'transform, opacity' }}
            />

            {/* Timer Digits - Consolidated Gradient */}
            <div className={`
                relative z-10 font-[800] leading-none tracking-tighter tabular-nums text-center
                bg-clip-text text-transparent bg-gradient-to-b from-text-primary to-text-secondary
                text-[18vw] lg:text-[10vw] pr-[2vw] lg:pr-0
                filter drop-shadow-2xl
                transition-transform duration-700 ease-spring will-change-transform
                ${isTimerRunning ? 'scale-105' : 'scale-100'}
            `}>
                {timeLeft < 3600 ? formatTime(timeLeft).substring(3) : formatTime(timeLeft)}
            </div>

            {/* Status Indicator */}
            <div
                className={`
                    mt-4 sm:mt-8 px-6 py-2 rounded-full text-sm sm:text-base font-bold uppercase tracking-widest border transition-all duration-500
                    ${isTimerRunning
                        ? 'border-brand/20 text-brand-primary bg-brand-primary/5 shadow-glow'
                        : 'border-transparent text-text-secondary bg-text-primary/5'
                    }
                `}
                style={isTimerRunning ? { '--shadow-color': 'var(--brand-primary)' } as React.CSSProperties : {}}
            >
                {isTimerRunning ? t('focus.status_focusing') : t('focus.status_paused')}
            </div>
        </div>
    );
});
