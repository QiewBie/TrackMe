import { useEffect } from 'react';

interface UseFocusHotkeysProps {
    handlers: {
        toggleTimer: () => void;
        skipTask: () => void;
        toggleZenMode: () => void;
        toggleSidebar: () => void;
    };
}

export const useFocusHotkeys = ({ handlers }: UseFocusHotkeysProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault(); // Prevent scrolling
                    handlers.toggleTimer();
                    break;
                case 'KeyN':
                    // "Next"
                    handlers.skipTask();
                    break;
                case 'Escape':
                    // Only toggle the Right Sidebar (Queue)
                    // Global Sidebar is static on Desktop and controlled by Burger on Mobile.
                    handlers.toggleSidebar();
                    break;
                case 'KeyB':
                    handlers.toggleSidebar();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
};
