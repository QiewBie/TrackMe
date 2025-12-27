import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';

interface UIContextType {
    // Theme
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
    toggleTheme: () => void;

    // Mobile Menu
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (isOpen: boolean) => void;
    toggleMobileMenu: () => void;

    // Modals
    isCategoryManagerOpen: boolean;
    openCategoryManager: () => void;
    closeCategoryManager: () => void;

    // Zen Mode
    isZenMode: boolean;
    setZenMode: (isZen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Theme State
    const [darkMode, setDarkMode] = useState(() => localStorageAdapter.getItem<string>('theme') === 'dark');

    // Mobile Menu State
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Modal State
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

    // Zen Mode State
    const [isZenMode, setZenMode] = useState(false);

    // Theme Effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorageAdapter.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const toggleTheme = () => setDarkMode(prev => !prev);
    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

    const openCategoryManager = () => setIsCategoryManagerOpen(true);
    const closeCategoryManager = () => setIsCategoryManagerOpen(false);

    const value = {
        darkMode,
        setDarkMode,
        toggleTheme,
        isMobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
        isCategoryManagerOpen,
        openCategoryManager,
        closeCategoryManager,
        isZenMode,
        setZenMode
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
