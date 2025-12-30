import { useState } from 'react';
import { createPortal } from 'react-dom';
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

const AmbienceSelector = () => {
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

            {/* Dropdown Panel - Portalled to escape stacking contexts */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="fixed z-[9999] bg-bg-surface border border-border rounded-2xl shadow-2xl p-4 w-72 origin-top-right safe-area-top"
                                style={{
                                    top: '4.5rem', // Match top bar height + margin
                                    right: '1rem'  // Match page margin
                                }}
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
                                                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
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
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div >
    );
};

export default AmbienceSelector;
