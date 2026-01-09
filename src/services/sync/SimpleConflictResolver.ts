/**
 * SimpleConflictResolver - Lightweight alternative to VersionManager
 * 
 * Uses simple Last-Write-Wins with updatedAt timestamps.
 * Can be gradually adopted to replace the complex VersionManager.
 */

import { timeService } from '../time/TimeService';

const DEVICE_ID_KEY = 'simple_device_id';

class SimpleConflictResolverClass {
    private deviceId: string;

    constructor() {
        this.deviceId = this.getOrCreateDeviceId();
    }

    private getOrCreateDeviceId(): string {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    }

    /**
     * Get device ID for conflict resolution
     */
    getDeviceId(): string {
        return this.deviceId;
    }

    /**
     * Determine if remote update should be applied
     * Simple Last-Write-Wins using updatedAt timestamps
     */
    shouldApplyRemote(
        localUpdatedAt: string | undefined,
        remoteUpdatedAt: string | undefined,
        remoteDeviceId?: string
    ): { apply: boolean; reason: string } {
        // Always apply if no local state
        if (!localUpdatedAt) {
            return { apply: true, reason: 'no_local_state' };
        }

        // Never apply if no remote timestamp
        if (!remoteUpdatedAt) {
            return { apply: false, reason: 'no_remote_timestamp' };
        }

        // Skip if from same device (already applied locally)
        if (remoteDeviceId === this.deviceId) {
            return { apply: false, reason: 'same_device' };
        }

        // Compare timestamps
        const localTime = new Date(localUpdatedAt).getTime();
        const remoteTime = new Date(remoteUpdatedAt).getTime();

        if (remoteTime > localTime) {
            return { apply: true, reason: 'remote_newer' };
        }

        return { apply: false, reason: 'local_newer_or_equal' };
    }

    /**
     * Get metadata to include in writes for conflict resolution
     */
    getVersionMeta(): { updatedAt: string; deviceId: string } {
        return {
            updatedAt: timeService.getTrustedISO(),
            deviceId: this.deviceId
        };
    }

    /**
     * Check if we're in a lockout period after local action
     * Prevents applying remote updates immediately after local write
     */
    private lastLocalAction = new Map<string, number>();
    private readonly LOCKOUT_MS = 500;

    markLocalAction(key: string): void {
        this.lastLocalAction.set(key, Date.now());
    }

    isInLockout(key: string): boolean {
        const lastAction = this.lastLocalAction.get(key);
        if (!lastAction) return false;
        return Date.now() - lastAction < this.LOCKOUT_MS;
    }
}

export const simpleConflictResolver = new SimpleConflictResolverClass();
