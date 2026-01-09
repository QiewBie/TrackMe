import { Timestamp } from 'firebase/firestore';

/**
 * Time utility functions for consistent timestamp handling.
 */

/**
 * Normalizes any timestamp format to milliseconds.
 * Handles: number (ms), Firestore Timestamp, Date, ISO string.
 * 
 * @example
 * normalizeTimestamp(1704574200000)          // number -> number
 * normalizeTimestamp(firebaseTimestamp)      // Timestamp -> number
 * normalizeTimestamp("2026-01-06T21:30:00Z") // string -> number
 * normalizeTimestamp(new Date())             // Date -> number
 */
export function normalizeTimestamp(value: number | Timestamp | Date | string | undefined | null): number {
    if (value === undefined || value === null) return 0;

    // Already a number (milliseconds)
    if (typeof value === 'number') {
        return value;
    }

    // ISO string
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    // Date object
    if (value instanceof Date) {
        return value.getTime();
    }

    // Firestore Timestamp (check for toMillis method)
    if (typeof (value as any).toMillis === 'function') {
        return (value as Timestamp).toMillis();
    }

    // Handle plain object timestamps (e.g. from JSON serialization or cache)
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
        return (value as any).seconds * 1000 + ((value as any).nanoseconds || 0) / 1000000;
    }

    return 0;
}

/**
 * Converts any timestamp format to ISO string.
 * 
 * @example
 * toISOString(1704574200000) // "2026-01-06T21:30:00.000Z"
 */
export function toISOString(value: number | Timestamp | Date | string | undefined | null): string {
    const ms = normalizeTimestamp(value);
    return ms > 0 ? new Date(ms).toISOString() : '';
}

/**
 * Returns duration in seconds between two timestamps.
 */
export function getDurationSeconds(
    start: number | Timestamp | Date | string | undefined | null,
    end: number | Timestamp | Date | string | undefined | null
): number {
    const startMs = normalizeTimestamp(start);
    const endMs = normalizeTimestamp(end);

    if (startMs === 0 || endMs === 0) return 0;

    return Math.max(0, Math.floor((endMs - startMs) / 1000));
}
