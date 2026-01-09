/**
 * Auth utilities for consistent user validation
 */

/**
 * Check if userId represents a guest user
 */
export const isGuestUser = (userId: string | null | undefined): boolean => {
    return !userId || userId === 'guest';
};

/**
 * Check if userId is valid for cloud operations
 */
export const isCloudUser = (userId: string | null | undefined): boolean => {
    return !isGuestUser(userId);
};
