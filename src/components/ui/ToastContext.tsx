import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast, { ToastType } from './Toast';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (toast: { message: string; type: ToastType }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const DEDUP_WINDOW = 2000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeToast, setActiveToast] = useState<ToastData | null>(null);
    const recentMessagesRef = useRef<Map<string, number>>(new Map());

    const showToast = useCallback((toast: { message: string; type: ToastType }) => {
        const now = Date.now();

        // Deduplication - don't show same message within 2s window
        const lastShown = recentMessagesRef.current.get(toast.message);
        if (lastShown && now - lastShown < DEDUP_WINDOW) {
            return;
        }
        recentMessagesRef.current.set(toast.message, now);

        // Cleanup old entries
        for (const [msg, time] of recentMessagesRef.current) {
            if (now - time > DEDUP_WINDOW * 2) {
                recentMessagesRef.current.delete(msg);
            }
        }

        setActiveToast({
            id: crypto.randomUUID(),
            message: toast.message,
            type: toast.type
        });
    }, []);

    const handleClose = useCallback(() => {
        setActiveToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {activeToast && (
                <Toast
                    key={activeToast.id}
                    message={activeToast.message}
                    type={activeToast.type}
                    isVisible={true}
                    onClose={handleClose}
                />
            )}
        </ToastContext.Provider>
    );
};

/**
 * Hook to show toast notifications.
 * Falls back to console.log if used outside ToastProvider.
 */
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback for components outside provider
        return {
            showToast: (t: { message: string; type: ToastType }) =>
                console.log('[Toast]', t.type, t.message)
        };
    }
    return ctx;
};
