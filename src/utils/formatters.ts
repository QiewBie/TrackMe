import { format, parseISO } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';

/**
 * Formats seconds into HH:MM:SS string.
 * Used for timers and total time display.
 */
export const formatTime = (seconds?: number): string => {
    if (!seconds || seconds < 0) return '00:00:00';
    return new Date(seconds * 1000).toISOString().substr(11, 8);
};

/**
 * Formats seconds into human readable duration.
 * Used for analytics.
 * Examples: 59сек, 5хв, 1год 20хв or 59sec, 5min, 1h 20m
 */
export const formatDuration = (rawSeconds?: number, labels?: { h: string, m: string, s: string }): string => {
    if (!rawSeconds) return labels ? `0${labels.s}` : '0сек';

    // Ensure we work with integers
    const seconds = Math.round(rawSeconds);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const h = labels?.h || 'год';
    const m = labels?.m || 'хв';
    const s = labels?.s || 'сек';

    if (hours > 0) {
        return `${hours}${h} ${minutes}${m}`;
    }

    if (minutes > 0) {
        return `${minutes}${m}`;
    }

    return `${secs}${s}`;
};

/**
 * Formats a date string or Date object using date-fns format.
 * Defaults to Ukrainian locale and dd.MM.yyyy format.
 */
export const formatDate = (date: Date | string | number, formatStr: string = 'dd.MM.yyyy', localeStr: string = 'uk'): string => {
    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        const locale = localeStr === 'en' ? enUS : uk;
        return format(d, formatStr, { locale });
    } catch (e) {
        return 'Invalid Date';
    }
};
