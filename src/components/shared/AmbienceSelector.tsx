import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundContext, AmbientType } from '../../context/SoundContext';
import { CloudRain, Trees, Coffee, Volume2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mapping icons to sound types
// We only support the ones defined in SoundContext for now ['rain', 'forest', 'cafe', 'fireplace']
const ICONS: Record<string, React.ElementType> = {
    rain: CloudRain,
    forest: Trees,
    cafe: Coffee,
    fireplace: Flame
};

const AmbienceSelector: React.FC = () => {
    const { t } = useTranslation();
    const { playAmbience, stopAmbience, currentAmbience, ambienceVolume, setAmbienceVolume } = useSoundContext();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSound = (type: AmbientType) => {
        if (currentAmbience === type) {
            stopAmbience();
        } else {
            playAmbience(type);
        }
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${currentAmbience
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    } border border-slate-200 dark:border-slate-700 shadow-sm`}
                title={t('sounds.ambience', 'Soundscapes')}
            >
                <div className={`${currentAmbience ? 'animate-pulse' : ''}`}>
                    <Volume2 size={18} />
                </div>
                <span className="font-bold text-sm hidden md:inline">
                    {currentAmbience ? t(`sounds.${currentAmbience}`, currentAmbience) : t('sounds.ambience', 'Soundscapes')}
                </span>
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 origin-top-left"
                        >
                            {/* Volume Control */}
                            {currentAmbience && (
                                <div className="mb-4 px-2 pt-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                        <span>{t('common.volume', 'Volume')}</span>
                                        <span>{Math.round(ambienceVolume * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={ambienceVolume}
                                        onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {(['rain', 'forest', 'cafe', 'fireplace'] as AmbientType[]).map(type => {
                                    const Icon = ICONS[type] || CloudRain;
                                    const isActive = currentAmbience === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => toggleSound(type)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500'
                                                }`}
                                        >
                                            <Icon size={24} className="mb-2" />
                                            <span className="text-xs font-bold capitalize">{t(`sounds.${type}`)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AmbienceSelector;
