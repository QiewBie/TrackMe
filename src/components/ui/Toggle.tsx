import * as React from 'react';
import { clsx } from 'clsx';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    description?: string;
    disabled?: boolean;
    className?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, disabled, className }) => {
    return (
        <label className={clsx("flex items-center justify-between cursor-pointer group", disabled && "opacity-50 cursor-not-allowed", className)}>
            {(label || description) && (
                <div className="mr-3">
                    {label && <div className="font-medium text-text-primary">{label}</div>}
                    {description && <div className="text-xs text-text-secondary">{description}</div>}
                </div>
            )}
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />
                <div className={clsx(
                    "w-11 h-6 rounded-full transition-colors border",
                    checked ? "bg-brand-primary border-brand-primary" : "bg-bg-subtle border-border-subtle group-hover:border-border dark:bg-bg-surface"
                )}></div>
                <div className={clsx(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-surface transition-transform shadow-sm",
                    checked ? "translate-x-5" : "translate-x-0"
                )}></div>
            </div>
        </label>
    );
};

export default Toggle;
