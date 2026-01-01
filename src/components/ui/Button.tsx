import * as React from 'react';
import { memo } from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'menu' | 'menuActive' | 'icon' | 'ghost'; // Added ghost
    size?: 'sm' | 'md' | 'lg' | 'icon';
    icon?: LucideIcon;
    children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = memo(({ children, onClick, variant = 'primary', size = 'md', className, icon: Icon, disabled, ...props }) => {
    // Base styles: removed fixed padding/text-size, added dynamic mapping
    const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none touch-manipulation";

    const sizes: Record<string, string> = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
        icon: "p-2"
    };

    const variants: Record<string, string> = {
        primary: "bg-brand hover:bg-brand-hover active:bg-brand-active text-[hsl(var(--text-on-brand))] shadow-lg shadow-brand/30 hover:shadow-brand/50",
        secondary: "bg-bg-surface border-2 border-border text-text-primary hover:bg-bg-main active:bg-bg-main hover:border-brand/50 active:border-brand/50 hover:text-brand",
        danger: "bg-status-error/10 text-status-error hover:bg-status-error/20 active:bg-status-error/20 hover:shadow-status-error/10 border border-transparent",
        ghost: "bg-transparent text-text-secondary hover:bg-bg-subtle active:bg-bg-subtle hover:text-text-primary",
        menu: "w-full justify-start text-text-secondary hover:bg-brand-subtle active:bg-brand-subtle hover:text-brand-active hover:pl-6 border-r-4 border-transparent",
        menuActive: "w-full justify-start bg-brand-subtle text-brand-active pl-6 border-r-4 border-brand rounded-r-none",
        icon: "p-2 aspect-square text-text-secondary hover:text-brand active:text-brand hover:bg-bg-main active:bg-bg-main rounded-lg transform hover:rotate-12"
    };

    // Size only applies if not menu/icon variant? No, let's treat menu/icon strictly or merge.
    // For now, simple merge.
    const sizeClasses = (variant === 'menu' || variant === 'menuActive' || variant === 'icon') ? '' : sizes[size];

    return (
        <button onClick={onClick} disabled={disabled} className={clsx(base, variants[variant], sizeClasses, className)} {...props}>
            {Icon && <Icon size={size === 'lg' ? 20 : 18} className={clsx("transition-transform duration-300", variant.includes('menu') && "group-hover:scale-110")} />}
            {children}
        </button>
    );
});

export default Button;
