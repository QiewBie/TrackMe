import React, { memo } from 'react';
import { Play, Pause, SkipForward, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../../../components/ui/Button';
import { useTranslation } from 'react-i18next';

interface SessionControlsProps {
    isTimerRunning: boolean;
    onToggle: () => void;
    onSkip: () => void;
    onComplete: () => void;
    canSkip?: boolean;
    className?: string;
}

export const SessionControls: React.FC<SessionControlsProps> = memo(({
    isTimerRunning,
    onToggle,
    onSkip,
    onComplete,
    canSkip = true,
    className
}) => {
    const { t } = useTranslation();
    return (
        <div className={clsx(
            "flex items-center justify-center gap-6 md:gap-10 p-6 rounded-3xl bg-bg-surface/90 backdrop-blur-xl shadow-2xl border border-border-subtle ring-1 ring-black/5 transition-all w-fit mx-auto",
            className
        )}>
            <Button
                variant="ghost"
                size="lg"
                onClick={onComplete}
                className="rounded-2xl text-text-secondary hover:text-status-success hover:bg-status-success/10 !p-0 !h-14 !w-14 md:!h-16 md:!w-16 flex items-center justify-center transition-transform active:scale-95"
                title={t('focus.controls.complete')}
            >
                <CheckCircle size={24} className="md:w-8 md:h-8" />
            </Button>

            <Button
                variant="primary"
                size="lg"
                onClick={onToggle}
                className={clsx(
                    "shadow-xl shadow-brand/20 !p-0 !h-20 !w-20 md:!h-24 md:!w-24 rounded-3xl flex items-center justify-center transition-transform active:scale-95",
                    isTimerRunning ? "bg-brand hover:bg-brand-hover" : "bg-brand hover:bg-brand-hover"
                )}
            >
                {isTimerRunning ? (
                    <Pause size={32} fill="currentColor" className="md:w-12 md:h-12" />
                ) : (
                    <Play size={32} fill="currentColor" className="ml-1 md:w-12 md:h-12" />
                )}
            </Button>

            <Button
                variant="ghost"
                size="lg"
                onClick={canSkip ? onSkip : undefined}
                disabled={!canSkip}
                className={clsx(
                    "rounded-2xl !p-0 !h-14 !w-14 md:!h-16 md:!w-16 flex items-center justify-center transition-transform active:scale-95",
                    canSkip
                        ? "text-text-secondary hover:text-text-primary hover:bg-text-secondary/5"
                        : "text-ui-disabled cursor-not-allowed"
                )}
                title={canSkip ? t('focus.controls.skip') : t('focus.controls.last_task')}
            >
                <SkipForward size={24} className="md:w-8 md:h-8" />
            </Button>
        </div>
    );
});
