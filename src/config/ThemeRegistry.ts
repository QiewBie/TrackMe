export type ThemePalette = {
    // Backgrounds
    '--bg-main': string;
    '--bg-surface': string;
    '--bg-subtle': string;
    '--bg-inverse': string;

    // Text
    '--text-primary': string;
    '--text-secondary': string;
    '--text-inverse': string;
    '--text-on-brand': string; // [NEW] For button text contrast

    // Borders
    '--border-color': string;
    '--border-subtle': string;

    // Brand Keys
    '--brand-primary': string;
    '--brand-hover': string;
    '--brand-active': string;
    '--brand-subtle': string;
    '--brand-accent': string;
    '--brand-accent-hover': string;

    // Gradients
    '--gradient-start': string;
    '--gradient-mid': string;
    '--gradient-end': string;
};

export interface ThemeConfig {
    id: string;
    label: string;
    colors: {
        light: ThemePalette;
        dark: ThemePalette;
    };
}

/**
 * THEME REGISTRY
 * 
 * This file contains the definitions for all application themes.
 * Each theme must have a unique ID, a display label, and both light/dark palettes.
 * 
 * To add a new theme:
 * 1. Duplicate one of the existing theme objects in the THEMES array.
 * 2. Change the 'id' and 'label'.
 * 3. Adjust the HSL values in the 'colors' object.
 */
export const DEFAULT_THEME: ThemeConfig = {
    id: 'default',
    label: 'Blue',
    colors: {
        light: {
            '--bg-main': '210 20% 96%',   // Distinctly off-white
            '--bg-surface': '0 0% 100%',   // Pure white
            '--bg-subtle': '210 20% 90%', // [Updated] Darker for better contrast (was 94%)
            '--bg-inverse': '222 47% 11%',
            '--text-primary': '222 47% 11%',
            '--text-secondary': '215 16% 47%',
            '--text-inverse': '210 40% 98%',
            '--text-on-brand': '0 0% 100%', // Default White
            '--border-color': '212 27% 84%',
            '--border-subtle': '214 32% 91%',
            '--brand-primary': '221 83% 53%',
            '--brand-hover': '221 76% 48%',
            '--brand-active': '224 71% 40%',
            '--brand-subtle': '214 100% 97%',
            '--brand-accent': '239 84% 67%',
            '--brand-accent-hover': '243 75% 59%',
            '--gradient-start': '239 84% 67%',
            '--gradient-mid': '271 91% 65%',
            '--gradient-end': '330 81% 60%',
        },
        dark: {
            '--bg-main': '222 47% 10%',   // Deep Slate
            '--bg-surface': '220 35% 15%', // Lighter, slightly tinted Slate
            '--bg-subtle': '217 30% 25%', // [Updated] Lighter for better contrast vs Surface (was 18%)
            '--bg-inverse': '210 40% 98%',
            '--text-primary': '210 40% 98%',
            '--text-secondary': '215 20% 65%',
            '--text-inverse': '222 47% 11%',
            '--text-on-brand': '0 0% 100%',
            '--border-color': '217 30% 20%', // Visible border
            '--border-subtle': '217 30% 25%',
            '--brand-primary': '217 91% 60%',
            '--brand-hover': '213 94% 68%',
            '--brand-active': '221 83% 53%',
            '--brand-subtle': '217 91% 60%',
            '--brand-accent': '234 89% 74%',
            '--brand-accent-hover': '239 84% 67%',
            '--gradient-start': '234 89% 74%',
            '--gradient-mid': '271 91% 65%',
            '--gradient-end': '330 81% 60%',
        }
    }
};

export const THEMES: ThemeConfig[] = [
    DEFAULT_THEME,
    {
        id: 'serenity',
        label: 'Purple',
        colors: {
            light: {
                ...DEFAULT_THEME.colors.light,
                '--brand-primary': '265 50% 60%', // Restrained Purple
                '--brand-hover': '265 55% 50%',
                '--brand-active': '265 60% 40%',
                '--brand-subtle': '265 50% 96%',
                '--brand-accent': '280 40% 60%',
                '--brand-accent-hover': '280 45% 55%',
                '--gradient-start': '265 50% 60%',
                '--gradient-mid': '280 40% 60%',
                '--gradient-end': '300 30% 60%',
                '--text-on-brand': '0 0% 100%',
            },
            dark: {
                ...DEFAULT_THEME.colors.dark,
                '--bg-main': '265 20% 10%',   // Deep Purple
                '--bg-surface': '265 25% 14%',
                '--brand-primary': '265 50% 65%',
                '--brand-hover': '265 55% 70%',
                '--brand-active': '265 60% 55%',
                '--brand-subtle': '265 50% 15%',
                '--gradient-start': '265 50% 65%',
                '--gradient-mid': '280 40% 60%',
                '--gradient-end': '300 30% 60%',
            }
        }
    },
    {
        id: 'amber',
        label: 'Amber',
        colors: {
            light: {
                ...DEFAULT_THEME.colors.light,
                '--brand-primary': '38 92% 50%',
                '--brand-hover': '38 92% 45%',
                '--brand-active': '38 92% 40%',
                '--brand-subtle': '48 100% 96%',
                '--brand-accent': '12 85% 65%', // Orange/Rose
                '--brand-accent-hover': '12 85% 60%',
                '--gradient-start': '38 92% 50%',
                '--gradient-mid': '12 85% 65%',
                '--gradient-end': '330 81% 60%',
                '--text-on-brand': '0 0% 100%',
            },
            dark: {
                ...DEFAULT_THEME.colors.dark,
                '--bg-main': '30 10% 9%',
                '--bg-surface': '30 15% 13%',
                '--brand-primary': '38 92% 50%',
                '--brand-hover': '38 92% 60%',
                '--brand-active': '38 92% 45%',
                '--brand-subtle': '38 92% 15%', // Darker tint, not solid color
                '--gradient-start': '38 92% 50%',
                '--gradient-mid': '12 85% 65%',
                '--gradient-end': '330 81% 60%',
            }
        }
    },
    {
        id: 'rose',
        label: 'Rose',
        colors: {
            light: {
                ...DEFAULT_THEME.colors.light,
                '--brand-primary': '336 80% 60%', // Pink-500
                '--brand-hover': '336 80% 55%',
                '--brand-active': '336 80% 50%',
                '--brand-subtle': '336 100% 96%',
                '--brand-accent': '280 60% 60%', // Purple accent
                '--brand-accent-hover': '280 60% 55%',
                '--gradient-start': '336 80% 60%',
                '--gradient-mid': '280 60% 60%', // Purple
                '--gradient-end': '38 92% 50%',  // Amber
                '--text-on-brand': '0 0% 100%',
            },
            dark: {
                ...DEFAULT_THEME.colors.dark,
                '--bg-main': '336 10% 9%',    // Deep Wine
                '--bg-surface': '336 15% 13%', // Lighter Wine
                '--brand-primary': '336 80% 65%',
                '--brand-hover': '336 80% 70%',
                '--brand-active': '336 80% 55%',
                '--brand-subtle': '336 70% 15%', // Tinted dark
                '--gradient-start': '336 80% 65%',
                '--gradient-mid': '280 60% 55%',
                '--gradient-end': '30 80% 55%',
                '--text-on-brand': '0 0% 100%',
            }
        }
    },
    {
        id: 'birch',
        label: 'Sage',
        colors: {
            light: {
                ...DEFAULT_THEME.colors.light,
                '--bg-main': '120 10% 97%',   // Very pale greenish silver
                '--brand-primary': '140 25% 40%', // Sage Green
                '--brand-hover': '140 30% 35%',
                '--brand-active': '140 35% 30%',
                '--brand-subtle': '140 30% 94%',
                '--text-on-brand': '0 0% 100%',
                '--gradient-start': '140 25% 40%',
                '--gradient-mid': '100 20% 60%',
                '--gradient-end': '60 30% 70%',
            },
            dark: {
                ...DEFAULT_THEME.colors.dark,
                '--bg-main': '140 10% 9%',    // Deep Forest Bark
                '--bg-surface': '140 10% 13%',
                '--brand-primary': '140 40% 60%', // Lighter Sage
                '--brand-hover': '140 40% 70%',
                '--brand-active': '140 40% 50%',
                '--brand-subtle': '140 20% 15%',
                '--text-on-brand': '0 0% 95%',
                '--gradient-start': '140 40% 60%',
                '--gradient-mid': '100 30% 50%',
                '--gradient-end': '60 40% 40%',
            }
        }
    },
    {
        id: 'monochrome',
        label: 'Monochrome',
        colors: {
            light: {
                ...DEFAULT_THEME.colors.light,
                '--bg-main': '0 0% 100%',      // Pure White
                '--bg-surface': '0 0% 96%',    // Light Grey
                '--bg-subtle': '0 0% 92%',     // [Fixed] Pure Grey (was inherited blueish)
                '--text-primary': '0 0% 0%',   // Pure Black
                '--brand-primary': '0 0% 10%', // Near Black
                '--brand-hover': '0 0% 25%',
                '--brand-active': '0 0% 0%',
                '--brand-subtle': '0 0% 90%',
                '--brand-accent': '0 0% 40%',  // Dark Grey
                '--brand-accent-hover': '0 0% 30%',
                '--text-on-brand': '0 0% 100%', // White text on Black button
                '--gradient-start': '0 0% 20%',
                '--gradient-mid': '0 0% 50%',
                '--gradient-end': '0 0% 80%',
            },
            dark: {
                ...DEFAULT_THEME.colors.dark,
                '--bg-main': '0 0% 0%',       // Pure Black
                '--bg-surface': '0 0% 10%',   // Dark Grey
                '--bg-subtle': '0 0% 20%',    // [Fixed] Pure Grey (was inherited blueish)
                '--text-primary': '0 0% 100%', // Pure White
                '--brand-primary': '0 0% 90%', // Near White
                '--brand-hover': '0 0% 70%',
                '--brand-active': '0 0% 100%',
                '--brand-subtle': '0 0% 20%',
                '--brand-accent': '0 0% 60%',  // Light Grey
                '--brand-accent-hover': '0 0% 70%',
                '--text-on-brand': '0 0% 0%',  // Black text on White button
                '--gradient-start': '0 0% 80%',
                '--gradient-mid': '0 0% 50%',
                '--gradient-end': '0 0% 20%',
            }
        }
    }
];
