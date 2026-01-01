import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    isSameMonth, isToday, parseISO
} from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';

interface DateTimePickerProps {
    label?: string;
    value?: string;
    onChange: (isoString: string) => void;
    disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, onChange, disabled }) => {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'uk' ? uk : enUS;

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

    // Generate week days dynamically based on locale
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.UTC(2021, 5, 7 + i)); // Mon Jun 07 2021 is a Monday
        return format(d, 'iiiiii', { locale: dateLocale });
    });

    return (
        <div className="relative">
            {label && <p className="text-xs text-text-secondary mb-2 font-bold uppercase">{label}</p>}
            <button
                ref={triggerRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={clsx(
                    "w-full flex items-center justify-between bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none transition-all text-left",
                    disabled ? "opacity-50 cursor-not-allowed text-text-secondary" : "hover:border-brand-primary text-text-primary",
                    isOpen && "ring-2 ring-brand-primary border-transparent"
                )}
            >
                <span className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-text-secondary" />
                    {value ? format(parseISO(value), 'd MMM yyyy, HH:mm', { locale: dateLocale }) : '—'}
                </span>
                {!disabled && <ChevronRight size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`} />}
            </button>

            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    className="fixed z-[9999] bg-bg-surface rounded-2xl shadow-2xl border border-border p-4 w-[320px] animate-pop-in ring-1 ring-black/5"
                    style={{ top: coords.top, left: coords.left }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <Button variant="ghost" onClick={handlePrevMonth} className="p-1 h-8 w-8 text-text-secondary hover:bg-bg-main" icon={ChevronLeft} />
                        <span className="font-bold text-text-primary capitalize">
                            {format(viewDate, 'LLLL yyyy', { locale: dateLocale })}
                        </span>
                        <Button variant="ghost" onClick={handleNextMonth} className="p-1 h-8 w-8 text-text-secondary hover:bg-bg-main" icon={ChevronRight} />
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {weekDays.map(d => (
                            <div key={d} className="text-center text-xs font-bold text-text-secondary py-1 uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-4 border-b border-border-subtle pb-4">
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
                                        !isCurrentMonth && "text-text-secondary/30",
                                        isSelected
                                            ? "bg-brand-primary text-white shadow-lg shadow-brand/30 font-bold"
                                            : "hover:bg-bg-main text-text-primary",
                                        isTodayDate && !isSelected && "text-brand-primary font-bold bg-brand-primary/10"
                                    )}
                                >
                                    {format(day, 'd')}
                                    {isTodayDate && !isSelected && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full"></span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex gap-2 h-32">
                        <div className="flex-1 flex flex-col">
                            <span className="text-xs font-bold text-text-secondary uppercase mb-1 text-center">{t('common.hours')}</span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-bg-main/50 rounded-lg p-1">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        onClick={() => handleTimeChange('hour', h)}
                                        className={clsx(
                                            "w-full text-center py-1 rounded text-sm mb-1 tabular-nums",
                                            parsedDate?.getHours() === h ? "bg-brand-primary text-white" : "text-text-primary hover:bg-bg-surface"
                                        )}
                                    >
                                        {h.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <span className="text-xs font-bold text-text-secondary uppercase mb-1 text-center">{t('common.minutes')}</span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-bg-main/50 rounded-lg p-1">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleTimeChange('minute', m)}
                                        className={clsx(
                                            "w-full text-center py-1 rounded text-sm mb-1 tabular-nums",
                                            parsedDate?.getMinutes() === m ? "bg-brand-primary text-white" : "text-text-primary hover:bg-bg-surface"
                                        )}
                                    >
                                        {m.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border-subtle flex justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => { onChange(new Date().toISOString()); setIsOpen(false); }}
                            className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 uppercase tracking-wider h-auto py-2"
                        >
                            {t('common.now')}
                        </Button>
                    </div>,
                </div>,
                document.body
            )}
        </div>
    );
};

export default DateTimePicker;
