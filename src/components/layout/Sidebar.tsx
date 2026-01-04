import * as React from 'react';
import {
    LayoutDashboard, User as UserIcon, Settings,
    Folder, ListMusic, PlayCircle, Sun, Moon, Languages, Zap, FolderKanban
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import { Category, User as UserType, FilterType } from '../../types';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext'; // Import theme
import Logo from '../ui/Logo';
import { getCategoryClass } from '../../utils/theme';

interface SidebarProps {
    categories: Category[];
    user: UserType;
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    categories,
    user,
    filter, setFilter
}) => {
    const { t, i18n } = useTranslation();
    const {
        darkMode, setDarkMode,
        isMobileMenuOpen, setMobileMenuOpen,
        openCategoryManager,
        isZenMode
    } = useUI();
    const { currentTheme } = useTheme();
    const isMonochrome = currentTheme.id === 'monochrome';

    // Helper to close mobile menu on click
    const handleNavClick = () => setMobileMenuOpen(false);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'uk' ? 'en' : 'uk';
        i18n.changeLanguage(newLang);
    };

    return (
        <aside className={clsx(
            "flex-shrink-0 flex flex-col bg-bg-surface border-r border-border z-modal lg:z-fixed transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[width,transform]",
            "fixed top-0 bottom-0 left-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto",
            // Mobile logic
            isMobileMenuOpen ? "translate-x-0 shadow-2xl w-72" : "-translate-x-full w-72",
            // Desktop logic
            !isMobileMenuOpen && (isZenMode ? "lg:w-0 lg:border-none lg:overflow-hidden opacity-0" : "lg:w-72 opacity-100 lg:translate-x-0"),
            // Safe Area
            "pt-safe"
        )}>
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
                <div className="animate-pop-in">
                    <Logo />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6 custom-scrollbar">
                <div className="animate-slide-in delay-100">
                    <p className="px-3 text-xs font-bold text-text-secondary uppercase mb-2 hidden lg:block">{t('navigation.title')}</p>
                    <NavLink
                        to="/"
                        end
                        onClick={handleNavClick}
                        className={({ isActive }: { isActive: boolean }) => clsx(
                            "w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all mb-1 hidden lg:flex outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
                            isActive
                                ? (isMonochrome
                                    ? "bg-bg-main border-2 border-brand-primary text-brand-primary shadow-brand-glow translate-x-1"
                                    : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 translate-x-1")
                                : "text-text-secondary hover:bg-bg-main hover:text-text-primary active:scale-95 active:bg-bg-subtle"
                        )}
                    >
                        <LayoutDashboard size={20} />
                        {t('navigation.dashboard')}
                    </NavLink>

                    <NavLink
                        to="/analytics"
                        onClick={handleNavClick}
                        className={({ isActive }: { isActive: boolean }) => clsx(
                            "w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all mb-1 hidden lg:flex outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
                            isActive
                                ? (isMonochrome
                                    ? "bg-bg-main border-2 border-brand-primary text-brand-primary shadow-brand-glow translate-x-1"
                                    : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 translate-x-1")
                                : "text-text-secondary hover:bg-bg-main hover:text-text-primary active:scale-95 active:bg-bg-subtle"
                        )}
                    >
                        <FolderKanban size={20} />
                        {t('navigation.analytics')}
                    </NavLink>


                </div>

                <div className="animate-slide-in delay-200">
                    <div className="flex justify-between items-center px-3 mb-2">
                        <p className="text-xs font-bold text-text-secondary uppercase">{t('navigation.projects')}</p>
                        <Button
                            variant="icon"
                            onClick={openCategoryManager}
                            icon={Settings}
                            className="bg-transparent hover:bg-bg-main"
                            title={t('common.settings')}
                        />
                    </div>

                    <button
                        className={clsx(
                            "w-full flex items-center justify-start gap-3 px-5 py-3.5 lg:px-4 lg:py-2.5 rounded-xl transition-all mb-1",
                            "text-base lg:text-sm font-bold active:scale-[0.98]", // Unified scale
                            filter === 'all'
                                ? "bg-brand-primary/10 text-brand-primary shadow-sm translate-x-1"
                                : "text-text-secondary hover:bg-bg-main hover:text-text-primary"
                        )}
                        onClick={() => { setFilter('all'); setMobileMenuOpen(false) }}
                    >
                        <Folder size={20} className="lg:w-[18px] lg:h-[18px]" />
                        {t('navigation.all_tasks')}
                    </button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { setFilter(c.id); setMobileMenuOpen(false) }}
                            className={clsx(
                                "w-full flex items-center gap-3 px-5 py-3.5 lg:px-4 lg:py-2.5 rounded-xl transition-all mt-1 group",
                                "text-base lg:text-sm font-bold active:scale-[0.98]",
                                String(filter) === String(c.id)
                                    ? "bg-brand-primary/10 text-brand-primary shadow-sm translate-x-1"
                                    : "text-text-secondary hover:bg-bg-main hover:text-text-primary"
                            )}
                        >
                            <span className={clsx(
                                "w-3 h-3 lg:w-2.5 lg:h-2.5 rounded-full shadow-sm transition-transform group-hover:scale-110",
                                getCategoryClass(c.color, 'bg')
                            )}></span>
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="hidden lg:block p-4 border-t-2 border-border shrink-0 space-y-3">
                <NavLink
                    to="/playlists"
                    onClick={handleNavClick}
                    className={({ isActive }: { isActive: boolean }) =>
                        clsx("w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all mb-1 hidden lg:flex",
                            isActive
                                ? (isMonochrome
                                    ? "bg-bg-main border-2 border-brand-primary text-brand-primary shadow-brand-glow translate-x-1"
                                    : "bg-brand/10 text-brand-primary shadow-sm translate-x-1")
                                : "text-text-secondary hover:bg-bg-main hover:text-text-primary"
                        )
                    }
                >
                    <ListMusic size={20} />
                    {t('navigation.playlists') || 'Playlists'}
                </NavLink>

                <NavLink
                    to="/focus"
                    onClick={handleNavClick}
                    className={({ isActive }: { isActive: boolean }) =>
                        clsx("w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all mb-1 hidden lg:flex group relative overflow-hidden",
                            isActive
                                ? "text-white shadow-lg shadow-brand-glow ring-1 ring-brand-accent"
                                : "text-text-secondary hover:bg-bg-main"
                        )
                    }
                >
                    {({ isActive }: { isActive: boolean }) => (
                        <>
                            <div className={`transition-all duration-300 relative z-20 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 group-hover:text-brand-accent'}`}>
                                <Zap size={20} className={isActive ? 'fill-white text-white' : ''} />
                            </div>

                            <div className="flex flex-col relative z-20">
                                <span className={isActive ? 'text-white font-extrabold tracking-wide drop-shadow-sm' : 'group-hover:text-text-primary transition-colors'}>
                                    {t('navigation.quick_focus')}
                                </span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-brand-gradient z-10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </>
                    )}
                </NavLink>




                <NavLink
                    to="/profile"
                    onClick={handleNavClick}
                    className={({ isActive }: { isActive: boolean }) => clsx(
                        "w-full items-center gap-3 p-3 rounded-xl border-2 transition-all group relative overflow-hidden hidden lg:flex",
                        isActive
                            ? "bg-brand-primary/10 border-brand-primary/20"
                            : "bg-bg-main hover:bg-bg-surface border-border"
                    )}
                >
                    {({ isActive }: { isActive: boolean }) => (
                        <>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-hover flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span>{user.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="font-bold text-text-primary text-sm truncate group-hover:text-brand-hover transition-colors">{user.name}</p>
                                <p className="text-xs text-text-secondary truncate">
                                    {user.role === 'User' ? t('sidebar.role_user') : user.role}
                                </p>
                            </div>
                            <UserIcon size={16} className="text-ui-disabled group-hover:text-brand-accent transition-colors" />

                            {/* Active Indicator */}
                            <div className={clsx(
                                "absolute right-0 top-0 bottom-0 w-1 bg-brand-primary transition-transform duration-300",
                                isActive ? "translate-x-0" : "translate-x-full"
                            )} />
                        </>
                    )}
                </NavLink>

                {/* Theme/Lang buttons removed as per request (moved to Profile) */}

            </div>
        </aside >
    );
};

export default Sidebar;
