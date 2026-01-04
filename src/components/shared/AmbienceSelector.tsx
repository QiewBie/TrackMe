
import { useState, useRef, useEffect } from 'react';
// import { createPortal } from 'react-dom'; // Removed Portal
import { useTranslation } from 'react-i18next';
import { useSoundContext, AmbientType } from '../../context/SoundContext';
import { CloudRain, Trees, Coffee, Volume2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Slider from '../ui/Slider';

// Mapping icons to sound types
// We only support the ones defined in SoundContext for now ['rain', 'forest', 'cafe', 'fireplace']
const ICONS: Record<string, React.ElementType> = {
    rain: CloudRain,
    forest: Trees,
    cafe: Coffee,
    fireplace: Flame
};

import { useTheme } from '../../context/ThemeContext'; // Add Import

const AmbienceSelector = () => {
    const { t } = useTranslation();
    const { playAmbience, stopAmbience, currentAmbience, ambienceVolume, setAmbienceVolume } = useSoundContext();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { currentTheme } = useTheme(); // Use Hook
    const isMonochrome = currentTheme.id === 'monochrome'; // Check Theme

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleSound = (type: AmbientType) => {
        if (currentAmbience === type) {
            stopAmbience();
        } else {
            playAmbience(type);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button - Standardized using Button component to match neighbors */}
            <Button
                variant="ghost"
                size="md"
                onClick={() => setIsOpen(!isOpen)}
                className={`transition-all duration-300 w-10 h-10 rounded-full flex items-center justify-center p-0 ${currentAmbience
                    ? 'bg-brand/10 text-brand ring-1 ring-brand/20 shadow-none border-transparent'
                    : 'bg-bg-surface/50 backdrop-blur-md border border-border-subtle hover:bg-bg-surface text-text-primary shadow-sm'
                    }`}
                title={t('sounds.ambience', 'Soundscapes')}
            >
                <div className={currentAmbience ? 'animate-pulse' : ''}>
                    <Volume2 size={20} />
                </div>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full mt-2 z-50 bg-bg-surface border border-border rounded-2xl shadow-xl ring-1 ring-border-subtle p-4 w-72 max-w-[calc(100vw-2rem)] right-0 origin-top-right md:left-0 md:right-auto md:origin-top-left"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                {t('sounds.ambience', 'Soundscapes')}
                            </span>
                            <span className="text-xs font-bold text-brand">
                                {Math.round(ambienceVolume * 100)}%
                            </span>
                        </div>

                        {/* Volume Control */}
                        {currentAmbience && (
                            <div className="mb-6 px-1">
                                <Slider
                                    value={ambienceVolume}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmbienceVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        )}

                        {/* Sound Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {(['rain', 'forest', 'cafe', 'fireplace'] as AmbientType[]).map(type => {
                                const Icon = ICONS[type] || CloudRain;
                                const isActive = currentAmbience === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => toggleSound(type)}
                                        className={`
                                                    flex flex-col items-center justify-center p-3 h-20 rounded-xl border transition-all duration-200
                                                    ${isActive
                                                ? (isMonochrome
                                                    ? 'bg-bg-main border-2 border-brand-primary text-brand-primary shadow-[0_0_12px_hsla(var(--brand-primary),0.4)]'
                                                    : 'bg-brand-primary text-white border-brand-primary shadow-sm')
                                                : 'bg-bg-surface border-border text-text-secondary hover:border-brand-primary/50 hover:text-text-primary'
                                            }
                                                `}
                                    >
                                        <Icon
                                            size={24}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={`mb-1.5 ${isActive ? 'scale-110' : ''} transition-transform`}
                                        />
                                        <span className="text-xs font-bold capitalize">{t(`sounds.${type}` as any)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default AmbienceSelector;
