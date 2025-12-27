import React, { memo } from 'react';
import { clsx } from 'clsx';

interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const PageHeader = memo(({ title, subtitle, action, className }: PageHeaderProps) => {
    return (
        <div className={clsx("flex flex-col md:flex-row justify-between md:items-start gap-4 mb-8", className)}>
            <div className="flex-1">
                <div className="text-4xl md:text-[2.75rem] font-extrabold text-text-primary hidden lg:flex items-center gap-3 tracking-tight leading-tight">
                    {title}
                </div>
                {subtitle && (
                    <div className="text-text-secondary font-medium text-base md:text-lg mt-3 max-w-2xl leading-relaxed">
                        {subtitle}
                    </div>
                )}
            </div>
            {action && (
                <div className="shrink-0 flex items-center">
                    {action}
                </div>
            )}
        </div>
    );
});

export default PageHeader;
