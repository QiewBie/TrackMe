import { cn } from '../../utils/cn';

interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface ContainerProps extends LayoutProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    centered?: boolean;
}

export const Page: React.FC<LayoutProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                "min-h-[100dvh] bg-bg-main text-text-primary transition-colors duration-300",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const Container: React.FC<ContainerProps> = ({
    children,
    size = 'xl',
    centered = true,
    className,
    ...props
}) => {
    const sizes = {
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
        xl: 'max-w-[1920px]',
        full: 'max-w-full'
    };

    return (
        <div
            className={cn(
                "w-full px-4 sm:px-6 lg:px-8",
                sizes[size],
                centered && "mx-auto",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
