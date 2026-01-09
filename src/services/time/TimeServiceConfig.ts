/**
 * TimeServiceConfig — Centralized configuration for all time-related constants.
 * 
 * This file is the single source of truth for timing parameters across the application.
 * Changing values here affects TimeService, FocusSessionContext, TimeLedger, and sync logic.
 */
export const TimeServiceConfig = {
    // ══════════════════════════════════════════════════════════════════════════
    // SYNC CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════

    /** Maximum allowed clock offset in ms (1 hour). Beyond this, offset is rejected as invalid. */
    MAX_OFFSET_MS: 60 * 60 * 1000,

    /** Minimum drift in ms to trigger offset update. Prevents jitter from minor fluctuations. */
    JITTER_THRESHOLD_MS: 500,

    /** Number of probe sync retry attempts on failure. */
    PROBE_RETRY_COUNT: 2,

    /** Base delay in ms for exponential backoff between retries. */
    PROBE_RETRY_BASE_DELAY_MS: 1000,

    /** Heartbeat sync triggers only if no piggyback for this duration (1 hour). */
    HEARTBEAT_STALE_THRESHOLD_MS: 60 * 60 * 1000,

    // ══════════════════════════════════════════════════════════════════════════
    // SESSION CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════

    /** Grace period in ms for ignoring remote null updates after local action. */
    GRACE_PERIOD_MS: 5000,

    /** Sessions older than this are considered zombies and auto-purged (24 hours). */
    ZOMBIE_THRESHOLD_MS: 24 * 60 * 60 * 1000,

    /** Suspended sessions older than this are auto-purged (7 days). */
    SUSPENDED_SESSION_TTL_MS: 7 * 24 * 60 * 60 * 1000,

    // ══════════════════════════════════════════════════════════════════════════
    // STORAGE CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════

    /** TimeLogs older than this are eligible for cleanup (90 days). */
    LOG_RETENTION_MS: 90 * 24 * 60 * 60 * 1000,

    /** Maximum localStorage usage in bytes before cleanup (4MB). */
    MAX_STORAGE_BYTES: 4 * 1024 * 1024,

    /** Cloud subscription limit for time logs in days. */
    CLOUD_LOG_LIMIT_DAYS: 30,

    // ══════════════════════════════════════════════════════════════════════════
    // TIMER DISPLAY CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════

    /** Update interval for simple timer display in ms. */
    SIMPLE_TIMER_UPDATE_INTERVAL_MS: 1000,
} as const;

export type TimeServiceConfigType = typeof TimeServiceConfig;
