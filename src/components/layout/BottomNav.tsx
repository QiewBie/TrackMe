import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, Play, Pause, ListMusic, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useActiveTimer } from '../../context/ActiveTimerContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useUI } from '../../context/UIContext';

const BottomNav = () => {
    const { t } = useTranslation();
    const { activeTimers } = useActiveTimer();
    const isFocusing = Object.keys(activeTimers).length > 0;
    const haptics = useHaptic();
    const { setMobileMenuOpen } = useUI();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: t('navigation.dashboard', 'Home'), end: true },
        { path: '/analytics', icon: PieChart, label: t('navigation.analytics', 'Analytics') },
        {
            path: '/focus',
            icon: isFocusing ? Pause : Play,
            label: t('navigation.quick_focus', 'Focus'),
            isPrimary: true
        },
        { path: '/playlists', icon: ListMusic, label: t('navigation.playlists', 'Playlists') },
        { path: '/profile', icon: User, label: t('navigation.profile', 'Profile') },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border z-[105] lg:hidden pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={() => {
                            haptics.light();
                            setMobileMenuOpen(false);
                        }}
                        className={({ isActive }) => clsx(
                            "flex flex-col items-center justify-center w-full h-full transition-colors relative",
                            isActive
                                ? "text-brand-primary"
                                : "text-text-secondary hover:text-text-primary"
                        )}
                    >
                        {({ isActive }) => (
                            <item.icon
                                size={28}
                                fill={isActive && item.icon !== PieChart ? "currentColor" : "none"}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
