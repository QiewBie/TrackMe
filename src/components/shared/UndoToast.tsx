import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
    onUndo: () => void;
    onClose: () => void;
    message?: string;
}

const UndoToast: React.FC<UndoToastProps> = ({ onUndo, onClose, message = "Завдання видалено" }) => {
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
            <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 md:gap-4 w-full md:min-w-[320px] overflow-hidden relative border border-slate-700 dark:border-slate-600 ring-1 ring-white/10">
                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />

                <span className="font-bold text-sm flex-1 truncate">{message}</span>

                <button
                    onClick={onUndo}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-xs font-bold whitespace-nowrap active:scale-95 text-blue-200 dark:text-blue-400"
                >
                    <RotateCcw size={14} />
                    Відновити
                </button>

                <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-white transition-colors active:scale-90">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default UndoToast;
