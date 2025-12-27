import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    isSameMonth, isToday, parseISO
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
    label?: string;
    value?: string;
    onChange: (isoString: string) => void;
    disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const parsedDate = value ? parseISO(value) : null;
    const [viewDate, setViewDate] = useState<Date>(() => parsedDate || new Date());
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Sync viewDate when opening if value exists
    useEffect(() => {
        if (isOpen && parsedDate) {
            setViewDate(parsedDate);
        }
    }, [isOpen, value]); // value string is stable

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove = spaceBelow < 350;

            const POPUP_WIDTH = 320;
            const fitsRight = rect.left + POPUP_WIDTH <= window.innerWidth;

            setCoords({
                top: showAbove ? rect.top - 360 : rect.bottom + 8,
                left: fitsRight ? rect.left : window.innerWidth - POPUP_WIDTH - 20, // Align right with safeguards
                width: rect.width
            });
        }
    }, [isOpen]);

    // Close on scroll ONLY if scrolling outside the popup
    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (isOpen && popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && triggerRef.current && !triggerRef.current.contains(e.target as Node) && popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 })
    });

    const handlePrevMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(subMonths(viewDate, 1)); };
    const handleNextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(addMonths(viewDate, 1)); };

    const handleDayClick = (day: Date) => {
        const newDate = parsedDate ? new Date(parsedDate) : new Date();
        newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
        onChange(newDate.toISOString());
    };

    const handleTimeChange = (type: 'hour' | 'minute', val: number) => {
        const newDate = parsedDate ? new Date(parsedDate) : new Date();
        if (type === 'hour') newDate.setHours(val);
        if (type === 'minute') newDate.setMinutes(val);
        onChange(newDate.toISOString());
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className="relative">
            {label && <p className="text-xs text-slate-400 mb-2 font-bold uppercase">{label}</p>}
            <button
                ref={triggerRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={clsx(
                    "w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none transition-all text-left",
                    disabled ? "opacity-50 cursor-not-allowed text-slate-400" : "hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200",
                    isOpen && "ring-2 ring-blue-500 border-transparent"
                )}
            >
                <span className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-slate-400" />
                    {value ? format(parseISO(value), 'd MMM yyyy, HH:mm', { locale: uk }) : '—'}
                </span>
                {!disabled && <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />}
            </button>

            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-[320px] animate-pop-in ring-1 ring-black/5"
                    style={{ top: coords.top, left: coords.left }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-slate-800 dark:text-white capitalize">
                            {format(viewDate, 'LLLL yyyy', { locale: uk })}
                        </span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight size={20} /></button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        {days.map(day => {
                            const isSelected = parsedDate && isSameDay(day, parsedDate);
                            const isCurrentMonth = isSameMonth(day, viewDate);
                            const isTodayDate = isToday(day);

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => handleDayClick(day)}
                                    className={clsx(
                                        "h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-all relative",
                                        !isCurrentMonth && "text-slate-300 dark:text-slate-700",
                                        isSelected
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
                                        isTodayDate && !isSelected && "text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20"
                                    )}
                                >
                                    {format(day, 'd')}
                                    {isTodayDate && !isSelected && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex gap-2 h-32">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Години</span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        onClick={() => handleTimeChange('hour', h)}
                                        className={clsx(
                                            "w-full text-center py-1 rounded text-sm mb-1 tabular-nums",
                                            parsedDate?.getHours() === h ? "bg-blue-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        {h.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Хвилини</span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleTimeChange('minute', m)}
                                        className={clsx(
                                            "w-full text-center py-1 rounded text-sm mb-1 tabular-nums",
                                            parsedDate?.getMinutes() === m ? "bg-blue-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        {m.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                        <button
                            onClick={() => { onChange(new Date().toISOString()); setIsOpen(false); }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-wider"
                        >
                            Зараз
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DateTimePicker;
