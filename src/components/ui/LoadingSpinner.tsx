import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => {
    const { t } = useTranslation();
    return (
        <div className={`flex items-center justify-center w-full h-full min-h-[50vh] ${className || ''}`} aria-label={t('common.loading')}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
    );
};

export default LoadingSpinner;
