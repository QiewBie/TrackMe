import { useEffect } from 'react';
import { useFocusState } from '../context/FocusSessionContext';

/**
 * Updates the site favicon dynamically based on timer state.
 * - Idle: Blue Play Icon (default)
 * - Running: Red Pause Icon (active)
 */
export const useDynamicFavicon = () => {
    const { activeSession, isPaused } = useFocusState();
    const isRunning = !!activeSession && !isPaused;

    useEffect(() => {
        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

        if (!link) return;

        const favicon = isRunning ? '/favicon-active.svg' : '/favicon.svg';

        // Only update if changed to prevent flashing/reloading
        if (link.getAttribute('href') !== favicon) {
            link.href = favicon;
        }
    }, [isRunning]);
};
