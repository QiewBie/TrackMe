/**
 * Version metadata for sync conflict resolution.
 * Added to all cloud-synced state objects.
 */
export interface VersionMeta {
    /** Monotonic version counter. Higher = newer. */
    _version: number;
    /** ISO timestamp of last update. */
    _updatedAt: string;
    /** Device ID that made the update. */
    _deviceId: string;
}

/**
 * State with optional version metadata.
 * Existing data without version fields is treated as version 0.
 */
export type Versioned<T> = T & Partial<VersionMeta>;

/**
 * Safely extract version from any object.
 * Validates for finite positive numbers to prevent attacks.
 * 
 * @param obj - Object that may contain _version field
 * @returns Version number, or 0 if invalid/missing
 */
export function getVersion(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) return 0;
    const v = (obj as Record<string, unknown>)._version;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > Number.MAX_SAFE_INTEGER) {
        return 0;
    }
    return Math.floor(v);
}

/**
 * Safely extract updatedAt timestamp from object.
 * 
 * @param obj - Object that may contain _updatedAt field
 * @returns Unix timestamp in ms, or 0 if invalid/missing
 */
export function getUpdatedAt(obj: unknown): number {
    if (typeof obj !== 'object' || obj === null) return 0;
    const ts = (obj as Record<string, unknown>)._updatedAt;
    if (typeof ts !== 'string') return 0;
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? 0 : parsed;
}
