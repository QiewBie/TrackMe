import { describe, test, expect } from 'vitest';
import { DEFAULT_THEME, THEMES, ThemePalette } from '../../../config/ThemeRegistry';

describe('Theme System Integrity', () => {

    // 1. Define the Expected Contract (Canonical Keys)
    // These keys MUST be present in every theme for the UI to render correctly.
    const REQUIRED_KEYS: (keyof ThemePalette)[] = [
        '--bg-main',
        '--bg-surface',
        '--bg-subtle',
        '--bg-inverse',
        '--text-primary',
        '--text-secondary',
        '--text-inverse',
        '--text-on-brand',
        '--border-color',
        '--border-subtle',
        '--brand-primary',
        '--brand-hover',
        '--brand-active',
        '--brand-subtle',
        '--brand-accent',
        '--brand-accent-hover',
        '--gradient-start',
        '--gradient-mid',
        '--gradient-end',
    ];

    test('DEFAULT_THEME contains all required CSS variables', () => {
        const lightKeys = Object.keys(DEFAULT_THEME.colors.light);
        const darkKeys = Object.keys(DEFAULT_THEME.colors.dark);

        REQUIRED_KEYS.forEach(key => {
            expect(lightKeys).toContain(key);
            expect(darkKeys).toContain(key);
        });
    });

    test('All Registered Themes match the Schema Contract', () => {
        THEMES.forEach(theme => {
            const lightKeys = Object.keys(theme.colors.light);
            const darkKeys = Object.keys(theme.colors.dark);

            REQUIRED_KEYS.forEach(key => {
                if (!lightKeys.includes(key)) {
                    throw new Error(`Theme '${theme.id}' (Light) is missing required key: ${key}`);
                }
                if (!darkKeys.includes(key)) {
                    throw new Error(`Theme '${theme.id}' (Dark) is missing required key: ${key}`);
                }
            });
        });
    });

    test('HSL Value Format Validity', () => {
        // Rudimentary check to ensure values look like "210 50% 50%" (space separated)
        // NOT "hsl(210, 50%, 50%)" which would break the alpha injection logic.

        const pattern = /^\d+(\.\d+)?(\s+)\d+%?(\s+)\d+%/; // E.g. "210 40% 98%"

        const checkPalette = (palette: ThemePalette, themeId: string, mode: string) => {
            Object.entries(palette).forEach(([key, value]) => {
                // Skip verification for pure white/black if they lack spacing? No, "0 0% 100%" should match.
                // Simple verify: should not contain "hsl" or "("
                if (value.includes('hsl') || value.includes('(') || value.includes(',')) {
                    throw new Error(`Theme '${themeId}' (${mode}) key '${key}' has invalid format: "${value}". Expected space-separated HSL channels (e.g. "210 50% 50%").`);
                }
            });
        };

        THEMES.forEach(theme => {
            checkPalette(theme.colors.light, theme.id, 'light');
            checkPalette(theme.colors.dark, theme.id, 'dark');
        });
    });
});
