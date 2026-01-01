import React, { createContext, useContext, useState, useLayoutEffect, useEffect, ReactNode, useRef } from 'react';
import { THEMES, ThemeConfig, DEFAULT_THEME } from '../config/ThemeRegistry';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { PreferencesService, DEFAULT_PREFERENCES } from '../services/preferences/PreferencesService';
import { UserSettings } from '../types';
import i18n from '../i18n';

interface ThemeContextType {
    currentTheme: ThemeConfig;
    setThemeId: (id: string) => Promise<void>;
    availableThemes: ThemeConfig[];
    language: 'en' | 'uk';
    setLanguage: (lang: 'en' | 'uk') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { darkMode, setDarkMode } = useUI();
    const { user } = useAuth(); // We only care about Identity (user.id)

    // State is authoritative here, not in AuthContext
    const [themeCode, setThemeState] = useState<string>(() => {
        return localStorage.getItem('color-theme') || DEFAULT_PREFERENCES.themeId!;
    });

    const [language, setLanguageState] = useState<'en' | 'uk'>(() => {
        const saved = localStorage.getItem('i18nextLng');
        return (saved === 'uk' || saved === 'en') ? saved : DEFAULT_PREFERENCES.language;
    });

    // Track previous user to detect Login/Logout transitions
    const prevUserRef = useRef<string | null>(null);

    // 1. Resolve Config
    const currentTheme = THEMES.find(t => t.id === themeCode) || DEFAULT_THEME;

    // 2. Runtime Injection (CSS Vars)
    useLayoutEffect(() => {
        const root = document.documentElement;
        const palette = darkMode ? currentTheme.colors.dark : currentTheme.colors.light;
        Object.entries(palette).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }, [themeCode, darkMode, currentTheme]);

    // 3. Language Sync
    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language]);

    // 4. V3 Sync Engine Connection

    // Use Ref to access latest state inside stable callback without re-subscribing
    const stateRef = useRef({ themeCode, language, darkMode });
    useEffect(() => {
        stateRef.current = { themeCode, language, darkMode };
    }, [themeCode, language, darkMode]);

    useEffect(() => {
        const userId = user?.id;
        const isLoginEvent = prevUserRef.current === null && userId !== undefined;
        prevUserRef.current = userId || null;

        if (!userId) return;

        // "Smart Merge" Subscription
        const unsubscribe = PreferencesService.subscribe(userId, (cloudPrefs) => {
            const current = stateRef.current;

            // LOGIC: Guest -> Cloud Transition
            // If we just logged in, and Cloud is effectively "empty" (default),
            // but we have local customizations... we might want to PUSH instead of PULL.
            // However, to be safe and simple: 
            // - If cloud provided explicit themeId, we trust it.
            // - If cloud provided 'default' (fresh account), maybe we respect local?
            // "Scorched Earth" decision: Cloud is Authority. 
            // Exception: If we want to implement "Save my guest settings", we would do it inside the Login flow
            // or perform a check here. For simplicity/stability V3: Server Wins.

            if (cloudPrefs.themeId && cloudPrefs.themeId !== current.themeCode) {
                setThemeState(cloudPrefs.themeId);
                localStorage.setItem('color-theme', cloudPrefs.themeId);
            }

            if (cloudPrefs.language && cloudPrefs.language !== current.language) {
                setLanguageState(cloudPrefs.language);
                // i18n handles storage itself usually, but we sync state
            }

            if (cloudPrefs.theme) {
                const shouldBeDark = cloudPrefs.theme === 'dark';
                if (shouldBeDark !== current.darkMode) {
                    setDarkMode(shouldBeDark);
                }
            }
        });

        // "Smart Push" (The Missing Link):
        // If the user logs in and the cloud data is *missing* or *default*, 
        // we should arguably push our current local state.
        // We'll leave this for Phase 2.5 (Refinement) to avoid accidental overwrites of existing profiles.
        // Current logic: Server > Local.

        return () => {
            unsubscribe();
        };
    }, [user?.id]); // STABLE SUBSCRIPTION: Only changes if User changes.

    // Outgoing Sync for Dark Mode
    const prevDarkMode = useRef(darkMode);
    useEffect(() => {
        if (prevDarkMode.current !== darkMode && user?.id) {
            PreferencesService.update(user.id, { theme: darkMode ? 'dark' : 'light' })
                .catch(err => console.error("Failed to sync dark mode:", err));
        }
        prevDarkMode.current = darkMode;
    }, [darkMode, user?.id]);


    // 5. Public Actions
    const setThemeId = async (id: string) => {
        // console.log(`[ThemeContext] Setting Theme: ${id}`);
        setThemeState(id);
        localStorage.setItem('color-theme', id);

        if (user?.id) {
            try {
                await PreferencesService.update(user.id, { themeId: id });
            } catch (err) {
                console.error("Failed to sync theme:", err);
            }
        }
    };

    const setLanguage = async (lang: 'en' | 'uk') => {
        // console.log(`[ThemeContext] Setting Language: ${lang}`);
        setLanguageState(lang);
        i18n.changeLanguage(lang);

        if (user?.id) {
            try {
                await PreferencesService.update(user.id, { language: lang });
            } catch (err) {
                console.error("Failed to sync language:", err);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            setThemeId,
            availableThemes: THEMES,
            language,
            setLanguage
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
