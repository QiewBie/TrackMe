import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    isSameMonth, isToday, parseISO, isWithinInterval, isBefore,
    subDays, subWeeks
} from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from '../../types';
import Modal from '../ui/Modal';

interface DateRangePickerProps {
    selectedRange: DateRange;
    onChange: (range: DateRange) => void;
    align?: 'left' | 'right';
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ selectedRange, onChange, align = 'left' }) => {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'en' ? enUS : uk;
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => parseISO(selectedRange.start));
    const [tempStart, setTempStart] = useState<Date | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const [menuAlignment, setMenuAlignment] = useState(align);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Smart alignment check (Desktop only)
    React.useLayoutEffect(() => {
        if (isOpen && pickerRef.current && !isMobile) {
            const rect = pickerRef.current.getBoundingClientRect();
            const POPOVER_WIDTH = 340;
            const SCREEN_WIDTH = window.innerWidth;
            let pAlign = align;

            if (pAlign === 'right') {
                const leftEdge = rect.right - POPOVER_WIDTH;
                if (leftEdge < 0) pAlign = 'left';
            } else {
                const rightEdge = rect.left + POPOVER_WIDTH;
                if (rightEdge > SCREEN_WIDTH) pAlign = 'right';
            }
            setMenuAlignment(pAlign);
        }
    }, [isOpen, align, isMobile]);

    const startDate = parseISO(selectedRange.start);
    const endDate = parseISO(selectedRange.end);

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 })
    });

    const handlePrevMonth = (e?: React.MouseEvent) => { e?.stopPropagation(); setViewDate(subMonths(viewDate, 1)); };
    const handleNextMonth = (e?: React.MouseEvent) => { e?.stopPropagation(); setViewDate(addMonths(viewDate, 1)); };

    const handleDayClick = (day: Date) => {
        if (!tempStart) {
            setTempStart(day);
        } else {
            const start = isBefore(day, tempStart) ? day : tempStart;
            const end = isBefore(day, tempStart) ? tempStart : day;
            onChange({
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd')
            });
            setTempStart(null);
            setIsOpen(false);
        }
    };

    // Click outside handler (Desktop)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!isMobile && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setTempStart(null);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isMobile]);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setTempStart(null);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const isInRange = (day: Date) => {
        if (tempStart) {
            const start = isBefore(day, tempStart) ? day : tempStart;
            const end = isBefore(day, tempStart) ? tempStart : day;
            return isWithinInterval(day, { start, end });
        }
        return isWithinInterval(day, { start: startDate, end: endDate });
    };

    const isRangeStart = (day: Date) => {
        if (tempStart) return isSameDay(day, tempStart);
        return isSameDay(day, startDate);
    };

    const isRangeEnd = (day: Date) => {
        if (tempStart) return false;
        return isSameDay(day, endDate);
    };

    const setPreset = (type: string) => {
        const today = new Date();
        const yesterday = subDays(today, 1);
        let start = today;
        let end = today;

        switch (type) {
            case 'today': break;
            case 'yesterday': start = yesterday; end = yesterday; break;
            case 'this_week': start = startOfWeek(today, { weekStartsOn: 1 }); end = endOfWeek(today, { weekStartsOn: 1 }); break;
            case 'last_week': start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); break;
            case 'last_7_days': start = subDays(yesterday, 6); end = yesterday; break;
            case 'last_14_days': start = subDays(yesterday, 13); end = yesterday; break;
            case 'last_30_days': start = subDays(yesterday, 29); end = yesterday; break;
            case 'last_month': start = startOfMonth(subMonths(today, 1)); end = endOfMonth(subMonths(today, 1)); break;
            case 'all_time': start = new Date(2020, 0, 1); end = today; break;
        }

        onChange({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        });
        setViewDate(start);
        setTempStart(null);
        setIsOpen(false);
    };

    const formatLabel = () => {
        if (selectedRange.start === selectedRange.end) {
            return format(startDate, 'd MMM yyyy', { locale: currentLocale });
        }
        return `${format(startDate, 'd MMM', { locale: currentLocale })} — ${format(endDate, 'd MMM yyyy', { locale: currentLocale })}`;
    };

    const CalendarContent = () => (
        <div className={clsx("flex flex-col h-full", isMobile ? "bg-bg-surface" : "")}>
            <div className={clsx(
                "flex-1 min-h-0 overflow-y-auto custom-scrollbar",
                isMobile ? "p-4 space-y-6" : ""
            )}>
                {/* Presets Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-border">
                    {['today', 'yesterday', 'this_week', 'last_week', 'last_7_days', 'last_14_days', 'last_30_days', 'last_month', 'all_time'].map(key => (
                        <button
                            key={key}
                            onClick={() => setPreset(key)}
                            className="px-2 py-1.5 text-xs font-medium bg-bg-subtle hover:bg-brand-primary/10 text-text-secondary hover:text-brand-primary rounded-lg transition-colors"
                        >
                            {t(`analytics.calendar.${key}`)}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-bg-subtle rounded-lg text-text-secondary"><ChevronLeft size={20} /></button>
                    <span className="font-bold text-text-primary capitalize">
                        {format(viewDate, 'LLLL yyyy', { locale: currentLocale })}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-bg-subtle rounded-lg text-text-secondary"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 mb-2">
                    {(i18n.language === 'en' ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']).map(d => (
                        <div key={d} className="text-center text-xs font-bold text-text-tertiary py-1">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                        const isStart = isRangeStart(day);
                        const isEnd = isRangeEnd(day);
                        const inRange = isInRange(day);
                        const isCurrentMonth = isSameMonth(day, viewDate);
                        const isTodayDate = isToday(day);

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                className={clsx(
                                    "h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-all relative select-none",
                                    !isCurrentMonth && "text-text-tertiary opacity-50",
                                    (isStart || isEnd)
                                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 font-bold z-10"
                                        : inRange
                                            ? "bg-brand-primary/10 text-brand-primary"
                                            : "hover:bg-bg-subtle text-text-primary",
                                    isTodayDate && !isStart && !isEnd && "ring-2 ring-brand-primary ring-inset"
                                )}
                            >
                                {format(day, 'd')}
                            </button>
                        )
                    })}
                </div>
            </div>

            {tempStart && (
                <div className="mt-auto pt-3 border-t border-border flex justify-center pb-4 sm:pb-0">
                    <button
                        onClick={() => setTempStart(null)}
                        className="text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider"
                    >
                        {t('analytics.calendar.cancel')}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative inline-block text-left" ref={pickerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border rounded-xl text-sm font-medium text-text-primary transition-all hover:border-brand-primary/50 hover:shadow-md active:scale-95 min-w-[200px]",
                    isOpen && "ring-2 ring-brand-primary border-transparent"
                )}
            >
                <CalendarIcon size={18} className="text-brand-primary" />
                <span className="capitalize">{formatLabel()}</span>
            </button>

            {/* Mobile Modal */}
            {isMobile && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={t('analytics.select_date', 'Select Date')}
                    fullScreen
                >
                    <CalendarContent />
                </Modal>
            )}

            {/* Desktop Popover */}
            {!isMobile && isOpen && (
                <div className={clsx(
                    "absolute top-full mt-2 z-30 bg-bg-surface rounded-2xl shadow-2xl border border-border p-4 w-[340px] max-w-[calc(100vw-2rem)] animate-pop-in ring-1 ring-black/5",
                    menuAlignment === 'left' ? "left-0" : "right-0"
                )}>
                    <CalendarContent />
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
