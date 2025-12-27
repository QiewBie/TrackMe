import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string | number;
    color?: string; // For category indicators
}

interface SelectProps {
    options: SelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    className?: string;
    renderValue?: (option: SelectOption | undefined) => React.ReactNode;
    renderOption?: (option: SelectOption) => React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    renderValue,
    renderOption
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, () => {
        if (isOpen) setIsOpen(false);
    });

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val: string | number) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={clsx("relative", className)} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-2 w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all min-h-[44px]"
            >
                <div className="flex-1 text-left truncate">
                    {renderValue ? renderValue(selectedOption) : (selectedOption?.label || placeholder)}
                </div>
                <ChevronDown size={16} className={clsx("text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-pop-in max-h-60 overflow-y-auto custom-scrollbar origin-top-left">
                    {options.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                                value === option.value
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            {renderOption ? renderOption(option) : option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Select;
