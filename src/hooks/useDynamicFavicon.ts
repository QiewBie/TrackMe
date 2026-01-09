import { useEffect } from 'react';
import { useSession } from '../context/SessionContext';

/**
 * Updates the site favicon dynamically based on timer state.
 * - Idle: Blue Play Icon (default)
 * - Running: Red Pause Icon (active)
 */
export const useDynamicFavicon = () => {
    const { hasSession, isRunning } = useSession();
    const isActive = hasSession && isRunning;

    useEffect(() => {
        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

        if (!link) return;

        const favicon = isActive ? '/favicon-active.svg' : '/favicon.svg';

        // Only update if changed to prevent flashing/reloading
        if (link.getAttribute('href') !== favicon) {
            link.href = favicon;
        }
    }, [isActive]);
};
