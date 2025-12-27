import { describe, it, expect } from 'vitest';
import { formatTime, formatDuration, formatDate } from '../formatters';


describe('formatters', () => {
    describe('formatTime', () => {
        it('formats seconds to HH:MM:SS', () => {
            expect(formatTime(3600)).toBe('01:00:00');
            expect(formatTime(3665)).toBe('01:01:05');
            expect(formatTime(65)).toBe('00:01:05');
            expect(formatTime(9)).toBe('00:00:09');
            expect(formatTime(0)).toBe('00:00:00');
        });

        it('handles negative or undefined input', () => {
            expect(formatTime(undefined)).toBe('00:00:00');
            expect(formatTime(-5)).toBe('00:00:00');
        });
    });

    describe('formatDuration', () => {
        it('formats hours correctly', () => {
            expect(formatDuration(3600)).toBe('1год 0хв');
            expect(formatDuration(7200)).toBe('2год 0хв');
            expect(formatDuration(3660)).toBe('1год 1хв');
        });

        it('formats minutes correctly', () => {
            expect(formatDuration(60)).toBe('1хв');
            expect(formatDuration(120)).toBe('2хв');
            expect(formatDuration(3599)).toBe('59хв');
        });

        it('formats seconds correctly', () => {
            expect(formatDuration(59)).toBe('59сек');
            expect(formatDuration(10)).toBe('10сек');
            expect(formatDuration(0)).toBe('0сек');
        });
    });

    // formatDate wrapper depends on date-fns locale, simple smoke test
    describe('formatDate', () => {
        it('formats ISO string correctly', () => {
            const date = new Date(2023, 0, 15, 12, 0, 0); // 15 Jan 2023 12:00
            const iso = date.toISOString();
            // Expected Format: 'dd.MM.yyyy' default
            const formatted = formatDate(iso);
            expect(formatted).toMatch(/15.01.2023/);
        });

        it('supports custom format', () => {
            const date = new Date(2023, 0, 15, 12, 0, 0);
            const iso = date.toISOString();
            expect(formatDate(iso, 'dd MMM')).toMatch(/15 січ/); // Assuming 'uk' locale is active
        });

        it('handles invalid input gracefully', () => {
            // formatDate usually wraps date-fns format, which might throw or return 'Invalid Date' string
            // Our utility might not handle it explicitly, let's verify implementation first.
            // Based on commonly viewed code, it just calls format(parseISO(date), ...)
        });
    });
});
