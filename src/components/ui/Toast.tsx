import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', isVisible, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <ToastPortal>
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:transform-none md:w-auto md:min-w-80 max-w-md z-toast flex items-center gap-4 px-4 py-3 rounded-xl shadow-2xl bg-bg-surface text-text-primary border border-border ring-1 ring-border-subtle"
                    >
                        <div className="shrink-0 p-2 bg-bg-main rounded-full">
                            {type === 'success' && <CheckCircle2 size={24} className="text-status-success" />}
                            {type === 'error' && <AlertCircle size={24} className="text-status-error" />}
                            {type === 'info' && <CheckCircle2 size={24} className="text-brand-primary" />}
                        </div>

                        <span className="font-bold text-sm md:text-base leading-snug tracking-wide flex-1">{message}</span>

                        <button
                            onClick={onClose}
                            className="shrink-0 p-2 hover:bg-bg-main rounded-full transition-colors -mr-2"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                </ToastPortal>
            )}
        </AnimatePresence>
    );
};

import { createPortal } from 'react-dom';

const ToastPortal = ({ children }: { children: React.ReactNode }) => {
    return createPortal(children, document.body);
};

export default Toast;
