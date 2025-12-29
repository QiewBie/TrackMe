import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// Sound Assets
const SFX = {
    start: '/sounds/start.wav',
    complete: '/sounds/complete.wav',
    click: '/sounds/click.wav',
};

const AMBIENCE = {
    rain: '/sounds/rain.mp3',
    forest: '/sounds/forest.mp3',
    cafe: '/sounds/cafe.mp3',
    fireplace: '/sounds/fireplace.mp3',
};

// Re-defining known existing keys from useSound.ts
/* 
    Checked useSound.ts:
    rain, forest, cafe, fireplace.
*/

export type SoundType = keyof typeof SFX;
export type AmbientType = 'rain' | 'forest' | 'cafe' | 'fireplace';

interface SoundContextType {
    playSfx: (sound: SoundType) => void;
    currentAmbience: AmbientType | null;
    playAmbience: (type: AmbientType) => void;
    stopAmbience: () => void;
    ambienceVolume: number;
    setAmbienceVolume: (vol: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // SFX Pool
    const sfxPool = useRef<Map<string, HTMLAudioElement>>(new Map());

    // Preload SFX on mount
    useEffect(() => {
        Object.entries(SFX).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.volume = 0.5;
            sfxPool.current.set(key, audio);
        });
    }, []);

    const playSfx = useCallback((sound: SoundType) => {
        try {
            // Clone node to allow overlapping sounds (e.g. rapid clicks)
            const original = sfxPool.current.get(sound);
            if (original) {
                const clone = original.cloneNode() as HTMLAudioElement;
                clone.volume = 0.5;
                clone.play().catch(err => console.warn('SFX play failed', err));
            } else {
                // Fallback if not loaded yet
                new Audio(SFX[sound]).play().catch(() => { });
            }
        } catch (error) {
            console.error('Failed to play audio', error);
        }
    }, []);

    // Ambience
    const activeAmbienceRef = useRef<HTMLAudioElement | null>(null);
    const [currentAmbience, setCurrentAmbience] = useState<AmbientType | null>(null);
    const [ambienceVolume, setAmbienceVolume] = useState(() => {
        const stored = localStorage.getItem('ambience_volume');
        return stored ? parseFloat(stored) : 0.5;
    });

    // Effect to update volume in real-time and persist
    useEffect(() => {
        if (activeAmbienceRef.current) {
            activeAmbienceRef.current.volume = ambienceVolume;
        }
        localStorage.setItem('ambience_volume', ambienceVolume.toString());
    }, [ambienceVolume]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (activeAmbienceRef.current) {
                activeAmbienceRef.current.pause();
                activeAmbienceRef.current = null;
            }
        };
    }, []);

    const playAmbience = useCallback((type: AmbientType) => {
        // If same track, just ensure playing (toggle logic can be handled in UI)
        if (currentAmbience === type && activeAmbienceRef.current) {
            return;
        }

        // Stop current
        if (activeAmbienceRef.current) {
            activeAmbienceRef.current.pause();
            activeAmbienceRef.current = null;
        }

        if (type) {
            const path = AMBIENCE[type as keyof typeof AMBIENCE];
            if (path) {
                const audio = new Audio(path);
                audio.loop = true;
                audio.volume = ambienceVolume;
                audio.play().catch(e => console.warn("Ambience play failed", e));
                activeAmbienceRef.current = audio;
                setCurrentAmbience(type);
            }
        }
    }, [currentAmbience, ambienceVolume]); // dependency on volume to set initial volume correctly

    const stopAmbience = useCallback(() => {
        if (activeAmbienceRef.current) {
            activeAmbienceRef.current.pause();
            activeAmbienceRef.current = null;
        }
        setCurrentAmbience(null);
    }, []);

    return (
        <SoundContext.Provider value={{
            playSfx,
            currentAmbience,
            playAmbience,
            stopAmbience,
            ambienceVolume,
            setAmbienceVolume
        }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSoundContext = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSoundContext must be used within a SoundProvider');
    }
    return context;
};
