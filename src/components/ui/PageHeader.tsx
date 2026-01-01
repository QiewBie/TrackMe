import React, { memo } from 'react';
import { clsx } from 'clsx';
import { useLayout } from '../../context/LayoutContext';

interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const PageHeader = memo(({ title, subtitle, action, className }: PageHeaderProps) => {
    const { setMobileHeader } = useLayout();

    React.useEffect(() => {
        setMobileHeader({
            title: title,
            subtitle: subtitle  // Optional: Sidebar/Nav might not render this, but we pass it.
        });
        // Cleanup not strictly necessary if we always overwrite on mount, 
        // but good practice might be to clear on unmount? 
        // Actually, if we navigate away, the new page will overwrite. 
        // If we clear on unmount, we might flash empty state.
    }, [title, subtitle, setMobileHeader]);

    return (
        <div className={clsx("flex flex-col md:flex-row justify-between md:items-start gap-4 mb-8", className)}>
            <div className="flex-1">
                {/* Title: Hidden on Mobile, Visible on Desktop */}
                <div className="hidden lg:flex text-4xl md:text-5xl font-extrabold text-text-primary items-center gap-3 tracking-tight leading-tight">
                    {title}
                </div>

                {/* Subtitle: Visible on both (acts as Page Description on Mobile) */}
                {subtitle && (
                    <div className="text-text-secondary font-medium text-base md:text-lg mt-3 max-w-2xl leading-relaxed">
                        {subtitle}
                    </div>
                )}
            </div>

            {/* Action: Visible on both Mobile and Desktop (kept in body) */}
            {action && (
                <div className="shrink-0 flex items-center">
                    {action}
                </div>
            )}
        </div>
    );
});

export default PageHeader;
