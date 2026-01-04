import React from 'react';
import { Check } from 'lucide-react';
import { ThemeConfig } from '../../../config/ThemeRegistry';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import Button from '../../../components/ui/Button';

interface ThemeCardProps {
    theme: ThemeConfig;
    isActive: boolean;
    onClick: () => void;
    isDark: boolean;
}

import { useTranslation } from 'react-i18next';

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onClick, isDark }) => {
    const { t } = useTranslation();
    // Resolve colors based on current mode preference for accurate preview
    const palette = isDark ? theme.colors.dark : theme.colors.light;

    // Helper to get raw color values for inline styles since we can't use vars from the theme itself yet (it might not be active)
    const getHsl = (key: keyof typeof palette) => {
        return `hsl(${palette[key]})`;
    };

    // Helper for transparent colors
    const getHslAlpha = (key: keyof typeof palette, alpha: number) => {
        return `hsl(${palette[key]} / ${alpha})`;
    };

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={clsx(
                "w-full h-auto p-0 flex flex-col items-center gap-3 group rounded-2xl transition-all duration-300 relative overflow-hidden ring-offset-2 ring-offset-bg-main",
                isActive ? "ring-2 ring-brand-primary scale-105" : "hover:scale-105"
            )}
        >
            {/* Preview Area - Mini App Interface */}
            <div
                className="h-28 w-full relative"
                style={{ background: getHsl('--bg-main') }}
            >
                {/* Mini Sidebar */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-[25%] border-r border-dashed"
                    style={{
                        background: getHsl('--bg-surface'),
                        borderColor: getHsl('--border-subtle')
                    }}
                >
                    {/* Sidebar Item (Active) */}
                    <div className="mt-4 mx-2 h-1.5 rounded-full opacity-20 bg-current" style={{ color: getHsl('--text-secondary') }} />
                    <div className="mt-2 mx-2 h-1.5 rounded-full opacity-20 bg-current" style={{ color: getHsl('--text-secondary') }} />
                    <div
                        className="mt-2 mx-2 h-4 rounded-md flex items-center px-1"
                        style={{ background: getHslAlpha('--brand-primary', 0.15) }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: getHsl('--brand-primary') }} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="absolute left-[25%] right-0 top-0 bottom-0 p-3 flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="h-2 w-16 rounded-full opacity-80" style={{ background: getHsl('--text-primary') }} />
                        <div className="h-4 w-4 rounded-full" style={{ background: getHsl('--bg-surface') }} />
                    </div>

                    {/* Widget Card 1 */}
                    <div
                        className="flex-1 rounded-lg p-2 shadow-sm border border-transparent"
                        style={{
                            background: getHsl('--bg-surface'),
                            borderColor: getHsl('--border-subtle')
                        }}
                    >
                        {/* Title */}
                        <div className="h-1.5 w-10 rounded-full opacity-40 mb-2" style={{ background: getHsl('--text-secondary') }} />

                        {/* Chart / Value */}
                        <div className="flex items-end gap-1 h-8 mt-auto">
                            <div className="w-2 h-4 rounded-t-sm opacity-30" style={{ background: getHsl('--brand-primary') }} />
                            <div className="w-2 h-6 rounded-t-sm opacity-60" style={{ background: getHsl('--brand-primary') }} />
                            <div className="w-2 h-3 rounded-t-sm opacity-40" style={{ background: getHsl('--brand-primary') }} />
                            <div className="w-2 h-full rounded-t-sm" style={{ background: getHsl('--brand-primary') }} />
                        </div>
                    </div>
                </div>

                {/* Active Checkmark Badge */}
                {isActive && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-sm z-10"
                    >
                        <Check size={14} strokeWidth={3} />
                    </motion.div>
                )}
            </div>

            {/* Label */}
            <div
                className="p-3 border-t flex items-center justify-between"
                style={{
                    background: getHsl('--bg-surface'),
                    borderColor: getHsl('--border-subtle')
                }}
            >
                <span
                    className={clsx("text-sm font-bold")}
                    style={{
                        color: isActive ? getHsl('--brand-primary') : getHsl('--text-primary')
                    }}
                >
                    {t(`themes.${theme.id}` as any)}
                </span>
            </div>
        </Button>
    );
};
