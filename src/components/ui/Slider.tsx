import React from 'react';
import { clsx } from 'clsx';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
}

const Slider: React.FC<SliderProps> = ({ value, onChange, min = 0, max = 1, step = 0.01, className, ...props }) => {
    // Calculate percentage for background gradient
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={clsx("relative w-full", className)}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className={clsx(
                    "block w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none bg-border-subtle",
                    "slider-thumb-webkit slider-thumb-moz slider-track-moz"
                )}
                style={{
                    background: `linear-gradient(to right, hsl(var(--brand-primary)) 0%, hsl(var(--brand-primary)) ${percentage}%, hsl(var(--border-subtle)) ${percentage}%, hsl(var(--border-subtle)) 100%)`
                }}
                {...props}
            />
        </div>
    );
};

export default Slider;
