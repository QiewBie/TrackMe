/**
 * Sync Configuration Constants
 * Centralized config for all sync-related timings
 */

export const SYNC_CONFIG = {
    // Debounce delays
    DEBOUNCE_MS: 500,

    // Lockout period after local action
    LOCKOUT_MS: 300,

    // Action cooldown to prevent rapid fire
    ACTION_COOLDOWN_MS: 500,

    // Retry settings
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,

    // Tick interval
    TICK_INTERVAL_MS: 1000,
} as const;
