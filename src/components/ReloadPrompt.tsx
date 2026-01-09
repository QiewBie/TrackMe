import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

export const ReloadPrompt = () => {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: any) {
            console.log('[PWA] Service Worker registered', r);
        },
        onRegisterError(error: any) {
            console.error('[PWA] Service Worker registration failed', error);
        },
    });

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (needRefresh) setIsVisible(true);
    }, [needRefresh]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 bg-surface-nav border border-brand-primary/20 p-4 rounded-xl shadow-lg animate-in slide-in-from-bottom">
            <div className="flex flex-col">
                <h4 className="text-sm font-medium text-text-primary">Update Available</h4>
                <p className="text-xs text-text-secondary">New version ready to install.</p>
            </div>
            <button
                onClick={() => updateServiceWorker(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-medium rounded-lg hover:bg-brand-primary/90 transition-colors"
            >
                <RefreshCcw className="w-3 h-3" />
                Update
            </button>
            <button
                onClick={() => setIsVisible(false)}
                className="text-text-secondary hover:text-text-primary text-lg leading-none px-2"
            >
                ×
            </button>
        </div>
    );
};
