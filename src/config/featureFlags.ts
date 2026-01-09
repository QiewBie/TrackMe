/**
 * Feature Flags — Toggle experimental features safely
 * 
 * Set to false to rollback to previous behavior
 */
export const FEATURE_FLAGS = {
    /**
     * Use unified session system (SessionService only)
     * When true: FocusSessionContext delegates to SessionService
     * When false: Legacy dual-system with FocusSessionContext + useSessionSync
     */
    USE_UNIFIED_SESSION: true,

    /**
     * Use centralized network state management
     * Controls pause/resume of subscriptions based on visibility/online status
     */
    USE_NETWORK_COORDINATOR: true,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
