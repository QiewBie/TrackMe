import React, { memo } from 'react';
import { Play, Pause, SkipForward, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface SessionControlsProps {
    isTimerRunning: boolean;
    onToggle: () => void;
    onComplete: () => void;
    onSkip: () => void;
    canSkip?: boolean;
    className?: string;
}

export const SessionControls: React.FC<SessionControlsProps> = memo(({
    isTimerRunning,
    onToggle,
    onComplete,
    onSkip,
    canSkip = true,
    className
}) => {
    return (
        <div className={clsx(
            "flex items-center gap-6 p-3 px-6 rounded-2xl bg-bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/60 dark:border-white/10 transition-all hover:scale-[1.02]",
            className
        )}>
            <button
                onClick={onComplete}
                className="group p-4 rounded-xl hover:bg-emerald-500/10 text-text-secondary hover:text-emerald-500 transition-all active:scale-95 duration-200"
                title="Complete Task"
            >
                <CheckCircle size={28} className="group-hover:stroke-[2.5px] transition-all duration-200" />
            </button>

            <button
                onClick={onToggle}
                className={clsx(
                    "p-6 rounded-2xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 duration-200 ease-out",
                    isTimerRunning
                        ? "bg-brand hover:bg-brand-hover shadow-brand/30"
                        : "bg-brand hover:bg-brand-hover shadow-brand/30"
                )}
            >
                {isTimerRunning ? (
                    <Pause size={32} fill="currentColor" />
                ) : (
                    <Play size={32} fill="currentColor" className="ml-1" />
                )}
            </button>

            <button
                onClick={canSkip ? onSkip : undefined}
                disabled={!canSkip}
                className={clsx(
                    "p-4 rounded-xl transition-all active:scale-95 duration-200",
                    canSkip
                        ? "hover:bg-bg-main text-text-secondary hover:text-text-primary"
                        : "text-white/20 cursor-not-allowed hover:bg-transparent"
                )}
                title={canSkip ? "Skip to End" : "Last Task"}
            >
                <SkipForward size={28} />
            </button>
        </div>
    );
});
