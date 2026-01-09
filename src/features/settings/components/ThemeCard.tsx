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
    const palette = isDark ? theme.colors.dark : theme.colors.light;

    const getHsl = (key: keyof typeof palette) => `hsl(${palette[key]})`;
    const getHslAlpha = (key: keyof typeof palette, alpha: number) => `hsl(${palette[key]} / ${alpha})`;

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className="w-full h-auto p-0 flex flex-col gap-3 group bg-transparent hover:bg-transparent"
        >
            {/* Preview Card - The "Image" */}
            <div className={clsx(
                "w-full aspect-[1.6/1] relative rounded-2xl overflow-hidden border transition-all duration-300",
                isActive
                    ? "ring-2 ring-brand-primary border-transparent shadow-lg shadow-brand/10 scale-[1.02]"
                    : "border-border-subtle group-hover:border-border group-hover:shadow-md"
            )}>
                {/* Background */}
                <div
                    className="absolute inset-0"
                    style={{ background: getHsl('--bg-main') }}
                />

                {/* Mini Sidebar */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-[25%] border-r border-dashed z-10"
                    style={{
                        background: getHsl('--bg-surface'),
                        borderColor: getHsl('--border-subtle')
                    }}
                >
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
                <div className="absolute left-[25%] right-0 top-0 bottom-0 p-3 flex flex-col gap-2 z-10">
                    <div className="flex items-center justify-between mb-1">
                        <div className="h-2 w-16 rounded-full opacity-80" style={{ background: getHsl('--text-primary') }} />
                        <div className="h-4 w-4 rounded-full" style={{ background: getHsl('--bg-surface') }} />
                    </div>
                    <div
                        className="flex-1 rounded-lg p-2 shadow-sm border border-transparent"
                        style={{
                            background: getHsl('--bg-surface'),
                            borderColor: getHsl('--border-subtle')
                        }}
                    >
                        <div className="h-1.5 w-10 rounded-full opacity-40 mb-2" style={{ background: getHsl('--text-secondary') }} />
                        <div className="flex items-end gap-1 h-8 mt-auto">
                            <div className="w-2 h-4 rounded-t-sm opacity-30" style={{ background: getHsl('--brand-primary') }} />
                            <div className="w-2 h-6 rounded-t-sm opacity-60" style={{ background: getHsl('--brand-primary') }} />
                            <div className="w-2 h-3 rounded-t-sm opacity-40" style={{ background: getHsl('--brand-primary') }} />
                            <div className="w-2 h-full rounded-t-sm" style={{ background: getHsl('--brand-primary') }} />
                        </div>
                    </div>
                </div>

                {/* Active Checkmark */}
                {isActive && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-sm z-20"
                    >
                        <Check size={14} strokeWidth={3} />
                    </motion.div>
                )}
            </div>

            {/* Label - Outside the card */}
            <span
                className={clsx(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-brand-primary" : "text-text-secondary group-hover:text-text-primary"
                )}
            >
                {t(`themes.${theme.id}` as any)}
            </span>
        </Button>
    );
};
