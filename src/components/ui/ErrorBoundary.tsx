import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import { Heading, Text } from './Typography';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Wrapper to use hooks in Class Component
const ErrorBoundaryInner = ({ error, reset }: { error: Error | null, reset: () => void }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-status-error/10 text-status-error flex items-center justify-center ring-4 ring-status-error/5">
                <AlertTriangle size={32} />
            </div>

            <div className="space-y-2 max-w-md">
                <Heading variant="h3">{t('common.error_title') || "Something went wrong"}</Heading>
                <Text className="text-text-secondary">
                    {t('common.error_msg') || "We encountered an unexpected issue with this session."}
                </Text>
                {process.env.NODE_ENV === 'development' && error && (
                    <div className="mt-4 p-4 rounded-lg bg-status-error/5 border border-status-error/10 text-left overflow-auto max-h-40">
                        <code className="text-xs text-status-error font-mono">{error.message}</code>
                    </div>
                )}
            </div>

            <Button onClick={reset} variant="primary">
                {t('common.reload') || "Reload Session"}
            </Button>
        </div>
    );
};

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return <ErrorBoundaryInner
                error={this.state.error}
                reset={() => this.setState({ hasError: false, error: null })}
            />;
        }

        return this.props.children;
    }
}
