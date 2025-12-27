import React, { memo } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'outline' | 'soft' | 'success' | 'warning' | 'error';
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = memo(({
    children,
    className,
    variant = 'default',
    ...props
}) => {
    const baseFn = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors";

    const variants = {
        default: "bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900",
        outline: "border border-border text-text-secondary",
        soft: "bg-bg-main text-text-secondary",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        error: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
    };

    return (
        <span className={clsx(baseFn, variants[variant], className)} {...props}>
            {children}
        </span>
    );
});

export default Badge;
