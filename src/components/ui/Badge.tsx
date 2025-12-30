import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'outline' | 'soft' | 'success' | 'warning' | 'error' | 'primary';
    children: React.ReactNode;
    className?: string;
}

const Badge = memo<BadgeProps>(({
    children,
    className,
    variant = 'default',
    ...props
}) => {
    const baseFn = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors";

    const variants = {
        default: "bg-bg-inverse text-text-inverse",
        outline: "border border-border text-text-secondary",
        soft: "bg-bg-main text-text-secondary",
        success: "bg-status-success/10 text-status-success",
        warning: "bg-status-warning/10 text-status-warning",
        error: "bg-status-error/10 text-status-error",
        primary: "bg-brand-primary/10 text-brand-primary"
    };

    return (
        <span className={clsx(baseFn, variants[variant], className)} {...props}>
            {children}
        </span>
    );
});

export default Badge;
