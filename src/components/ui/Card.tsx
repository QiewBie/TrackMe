import React, { memo } from 'react';
import { clsx } from 'clsx';

// --- Card ---
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hoverEffect?: boolean;
}

export const Card = memo(React.forwardRef<HTMLDivElement, CardProps>(({
    children,
    className,
    hoverEffect = false,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={clsx(
                "bg-bg-surface border border-border rounded-3xl shadow-sm overflow-hidden",
                hoverEffect && "transition-transform duration-300 hover:scale-[1.01] hover:shadow-md",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}));

// --- Card Header ---
export const CardHeader = memo(({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={clsx("px-6 pt-6 pb-4 flex items-center justify-between", className)} {...props}>
        {children}
    </div>
));

// --- Card Title ---
export const CardTitle = memo(({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={clsx("text-lg font-bold text-text-primary leading-tight", className)} {...props}>
        {children}
    </h3>
));

// --- Card Content ---
export const CardContent = memo(({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={clsx("p-6 pt-0", className)} {...props}>
        {children}
    </div>
));

export default Card;
