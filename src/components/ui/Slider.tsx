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
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none bg-border-subtle"
                style={{
                    background: `linear-gradient(to right, var(--brand-primary) 0%, var(--brand-primary) ${percentage}%, var(--border-subtle) ${percentage}%, var(--border-subtle) 100%)`
                }}
                {...props}
            />
            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: var(--bg-surface);
                    border: 2px solid var(--brand-primary);
                    margin-top: -7px; /* Adjust based on track height if needed, track is h-1.5 (6px) so center is 3px. Thumb 16/2=8. 3-8 = -5? default margin calc is tricky */
                    /* Tailwind h-1.5 is 6px. Webkit thumb needs explicit centering often. */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.1s;
                }
                input[type=range]::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    background: var(--brand-primary);
                }
                input[type=range]::-moz-range-thumb {
                    height: 16px;
                    width: 16px;
                    border: 2px solid var(--brand-primary);
                    border-radius: 50%;
                    background: var(--bg-surface);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.1s;
                }
                input[type=range]::-moz-range-track {
                    width: 100%;
                    height: 6px;
                    cursor: pointer;
                    background: transparent;
                    border-radius: 999px;
                }
            `}</style>
        </div>
    );
};

export default Slider;
