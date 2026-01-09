/**
 * Retry utility for network operations
 * Implements exponential backoff
 */

import { SYNC_CONFIG } from '../config/sync';

export interface RetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = SYNC_CONFIG.MAX_RETRY_ATTEMPTS,
        delayMs = SYNC_CONFIG.RETRY_DELAY_MS,
        onRetry
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on final attempt
            if (attempt === maxAttempts) {
                break;
            }

            // Check if error is retryable
            if (!isRetryableError(lastError)) {
                throw lastError;
            }

            // Notify about retry
            if (onRetry) {
                onRetry(attempt, lastError);
            }

            // Exponential backoff
            const backoffDelay = delayMs * Math.pow(2, attempt - 1);
            await sleep(backoffDelay);
        }
    }

    throw lastError;
}

/**
 * Check if error is retryable (network/temporary errors)
 */
function isRetryableError(error: Error): boolean {
    const retryableMessages = [
        'network',
        'timeout',
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'failed to fetch',
        'offline'
    ];

    const message = error.message.toLowerCase();
    return retryableMessages.some(msg => message.includes(msg));
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
