import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, Play, Pause, ListMusic, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useSession } from '../../context/SessionContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useUI } from '../../context/UIContext';

const BottomNav = () => {
    const { t } = useTranslation();
    const { hasSession } = useSession();
    const isFocusing = hasSession;
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
                            "flex flex-col items-center justify-center w-full h-full transition-colors relative z-10",
                            isActive
                                ? "text-brand-primary"
                                : "text-text-secondary hover:text-text-primary"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="liquid-nav-pill"
                                        className="absolute inset-0 m-1.5 rounded-2xl bg-gradient-to-tr from-brand-primary/15 to-brand-primary/5 -z-10 shadow-[inset_0_0_10px_rgba(var(--brand-primary),0.1)] border border-brand-primary/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon
                                    size={28}
                                    fill={isActive && item.icon !== PieChart ? "currentColor" : "none"}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="relative z-10"
                                />
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
