import React from 'react';
import { clsx } from 'clsx';

type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4';
type TextVariant = 'body' | 'small' | 'caption';
type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extra-bold';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    variant?: HeadingVariant;
    weight?: FontWeight;
    gradient?: boolean;
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    variant?: TextVariant;
    weight?: FontWeight;
    dimmed?: boolean;
    as?: 'p' | 'span' | 'div';
}

const fontWeights: Record<FontWeight, string> = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
    'extra-bold': 'font-extrabold',
};

export const Heading: React.FC<HeadingProps> = ({
    variant = 'h1',
    weight = 'bold',
    gradient = false,
    className,
    children,
    ...props
}) => {
    const Component = variant;

    const sizes = {
        h1: 'text-3xl md:text-4xl', // consistent with existing focus view headers
        h2: 'text-2xl md:text-3xl',
        h3: 'text-xl md:text-2xl',
        h4: 'text-lg md:text-xl',
    };

    return (
        <Component
            className={clsx(
                sizes[variant],
                fontWeights[weight],
                'tracking-tight text-text-primary',
                gradient && 'bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400',
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};

export const Text: React.FC<TextProps> = ({
    variant = 'body',
    weight = 'normal',
    dimmed = false,
    as: Component = 'p',
    className,
    children,
    ...props
}) => {
    const sizes = {
        body: 'text-base',
        small: 'text-sm',
        caption: 'text-xs',
    };

    return (
        <Component
            className={clsx(
                sizes[variant],
                fontWeights[weight],
                dimmed ? 'text-text-secondary' : 'text-text-primary',
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};
