import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
    variant?: 'default' | 'ghost';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, containerClassName, variant = 'default', ...props }, ref) => {
    const baseStyles = "w-full outline-none transition-all font-medium placeholder-text-tertiary text-text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-ui-disabled/10";

    const variants = {
        default: "bg-bg-surface border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary/20 focus:bg-bg-surface",
        ghost: "bg-transparent border-none p-0 focus:ring-0"
    };

    const borderStyles = variant === 'default'
        ? (error ? "border-status-error focus:border-status-error" : "border-border hover:border-text-secondary/30")
        : "";

    return (
        <div className={clsx("w-full text-left", containerClassName)}>
            {label && (
                <label className="block text-xs font-bold text-text-secondary uppercase ml-1 mb-1.5">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    borderStyles,
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 ml-1 text-xs text-status-error font-medium">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
