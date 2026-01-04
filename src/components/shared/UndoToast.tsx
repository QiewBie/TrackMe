import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UndoToastProps {
    onUndo: () => void;
    onClose: () => void;
    message?: string;
}

const UndoToast = ({ onUndo, onClose, message }: UndoToastProps) => {
    const { t } = useTranslation();
    const displayMessage = message || t('common.task_deleted');
    const [progress, setProgress] = useState(100);

    // Timer Logic
    useEffect(() => {
        const duration = 5000;
        const interval = 50;
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev - step;
                if (next <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, []);

    // Close when progress hits 0
    useEffect(() => {
        if (progress === 0) {
            onClose();
        }
    }, [progress, onClose]);

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 animate-slide-up">
            <div className="bg-bg-surface text-text-primary rounded-xl shadow-2xl p-4 flex items-center gap-3 md:gap-4 w-full md:min-w-80 overflow-hidden relative border border-border ring-1 ring-white/10">
                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-brand-primary transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />

                <span className="font-bold text-sm flex-1 truncate">{displayMessage}</span>

                <button
                    onClick={onUndo}
                    className="flex items-center gap-2 px-3 py-1.5 bg-bg-main rounded-lg hover:bg-bg-subtle transition-colors text-xs font-bold whitespace-nowrap active:scale-95 text-brand-primary"
                >
                    <RotateCcw size={14} />
                    {t('common.undo')}
                </button>

                <button onClick={onClose} className="p-1 rounded-md hover:bg-bg-main text-ui-disabled hover:text-text-primary transition-colors active:scale-90">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default UndoToast;
