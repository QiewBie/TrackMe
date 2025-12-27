import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, showText = true }) => {
    return (
        <div className="flex items-center">
            <div className={clsx("w-8 h-8 mr-3 text-blue-600 flex items-center justify-center", className)}>
                {/* Focus Lens Logo - Professional */}
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                    {/* Outer Ring Segment 1 */}
                    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Outer Ring Segment 2 (Broken part) */}
                    <path d="M3 12C3 14.4853 4.00736 16.7353 5.63604 18.364" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-50" />
                    <path d="M5.63604 5.63604C4.00736 7.26472 3 9.51472 3 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-50" />

                    {/* Center Play Button */}
                    <path d="M16 12L9 8V16L16 12Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
            </div>
            {showText && (
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white notranslate" translate="no">
                    Track<span className="text-blue-500">Me</span>
                </span>
            )}
        </div>
    );
};

export default Logo;
