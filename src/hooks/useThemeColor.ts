import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Hook to synchronize the browser's theme-color meta tag with the active application theme.
 * This ensures PWA system bars (status bar, home indicator area) match the app background.
 */
export const useThemeColor = () => {
    const { currentTheme } = useTheme();

    useEffect(() => {
        // Get the computed value of --bg-main or --bg-surface from the root element
        // We use a small timeout to ensure the DOM has updated the CSS variables
        const updateMetaThemeColor = () => {
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');

            // Get the computed background color of the body/html
            const computedColor = getComputedStyle(document.body).backgroundColor;

            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', computedColor);
            } else {
                const newMeta = document.createElement('meta');
                newMeta.name = 'theme-color';
                newMeta.content = computedColor;
                document.head.appendChild(newMeta);
            }
        };

        // Run immediately and after a short delay to catch CSS variable transitions
        // Run immediately and after a short delay to catch CSS variable transitions
        const updateColor = () => requestAnimationFrame(updateMetaThemeColor);

        updateColor();
        const timeoutId = setTimeout(updateColor, 100);
        const timeoutId2 = setTimeout(updateColor, 500); // Fail-safe check

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(timeoutId2);
        };
    }, [currentTheme]); // Re-run when theme changes
};
