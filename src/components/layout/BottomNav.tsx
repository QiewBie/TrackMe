import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, Play, Pause, ListMusic, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useFocusState } from '../../context/FocusSessionContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useUI } from '../../context/UIContext';

const BottomNav = () => {
    const { t } = useTranslation();
    const { activeSession } = useFocusState();
    const isFocusing = !!activeSession;
    const haptics = useHaptic();
    const { setMobileMenuOpen } = useUI();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: t('navigation.dashboard', 'Home'), end: true },
        { path: '/analytics', icon: PieChart, label: t('navigation.analytics', 'Analytics') },
        {
            path: '/focus',
            icon: Play,
            label: t('navigation.quick_focus', 'Focus'),
            isPrimary: true
        },
        { path: '/playlists', icon: ListMusic, label: t('navigation.playlists', 'Playlists') },
        { path: '/profile', icon: User, label: t('navigation.profile', 'Profile') },
    ];

    return (
        <nav className="w-full h-full bg-transparent transition-all duration-300">
            {/* Reduced height (h-14 = 56px) for sleeker mobile look */}
            <div className="flex justify-around items-center h-14 px-6">
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
