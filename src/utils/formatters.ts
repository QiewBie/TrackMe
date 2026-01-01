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
 * Labels must be provided for localization, otherwise defaults to 'h', 'm', 's'.
 */
export const formatDuration = (rawSeconds?: number, labels?: { h: string, m: string, s: string }): string => {
    if (!rawSeconds) return labels ? `0${labels.s}` : '0s';

    const seconds = Math.round(rawSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const h = labels?.h || 'h';
    const m = labels?.m || 'm';
    const s = labels?.s || 's';

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
export const formatDate = (date: Date | string | number, formatStr: string = 'dd.MM.yyyy', localeStr: string = 'en'): string => {
    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        const isUk = localeStr === 'uk' || localeStr === 'ua';
        const locale = isUk ? uk : enUS;
        return format(d, formatStr, { locale });
    } catch (e) {
        return 'Invalid Date';
    }
};
