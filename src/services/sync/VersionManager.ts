import { timeService } from '../time/TimeService';
import { VersionMeta, getVersion } from '../../types/sync';

// ==================== CONFIGURATION ====================
const CONFIG = {
    // Increased timeouts for slow networks (v4.1)
    PENDING_TIMEOUT_MS: 45_000,      // Auto-recover stuck pending
    ENQUEUE_TIMEOUT_MS: 60_000,      // Max wait in queue
    ENTRY_TTL_MS: 24 * 60 * 60_000,  // Cleanup old entries (24h)
    CLEANUP_INTERVAL_MS: 60 * 60_000, // Hourly cleanup
    PERSIST_DEBOUNCE_MS: 1_000,      // Debounce localStorage writes
    LOCKOUT_MS: 300,                 // Ignore remote updates for 300ms after local action
} as const;

const STORAGE_KEY = 'version_manager_max_versions';

// ==================== TYPES ====================
type OperationType = 'write' | 'delete';

interface QueuedOperation {
    type: OperationType;
    resolve: () => void;
    reject: (error: Error) => void;
    timer: number;
}

interface VersionEntry {
    localVersion: number;
    maxKnownVersion: number;
    pendingWrite: boolean;
    pendingDelete: boolean;
    lastWriteTime: number;
    lastUpdatedAt: string;
}

// ==================== IMPLEMENTATION ====================
class VersionManagerImpl {
    private versions = new Map<string, VersionEntry>();
    private operationQueues = new Map<string, QueuedOperation[]>();
    private deviceId: string;
    private cleanupTimer: number | null = null;
    private persistTimer: number | null = null;
    private persistPending = false;
    private localActionTime = new Map<string, number>(); // Track last local action per key

    constructor() {
        this.deviceId = this.generateDeviceId();
        this.loadPersistedMaxVersions();
        this.startCleanupTimer();
        this.startStorageListener();
    }

    // ==================== DEVICE ID ====================
    private generateDeviceId(): string {
        let storageId = localStorage.getItem('device_id');
        if (!storageId) {
            storageId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            localStorage.setItem('device_id', storageId);
        }
        // Session suffix prevents issues with browser profile clones
        return `${storageId}_${Math.random().toString(36).slice(2, 6)}`;
    }

    public getDeviceId(): string {
        return this.deviceId;
    }

    // ==================== PERSISTENCE ====================
    /**
     * Load persisted max versions with strict validation.
     */
    private loadPersistedMaxVersions(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            const data = JSON.parse(stored);
            if (typeof data !== 'object' || data === null) return;

            for (const [key, value] of Object.entries(data)) {
                if (typeof key !== 'string' || !key) continue;
                if (typeof value !== 'number') continue;
                if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) continue;

                this.versions.set(key, {
                    localVersion: value,
                    maxKnownVersion: value,
                    pendingWrite: false,
                    pendingDelete: false,
                    lastWriteTime: 0,
                    lastUpdatedAt: ''
                });
            }
        } catch (e) {
            console.warn('[VersionManager] Failed to load persisted versions:', e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    /**
     * Schedule debounced persist to reduce localStorage writes.
     */
    private schedulePersist(): void {
        if (this.persistPending) return;
        this.persistPending = true;

        this.persistTimer = window.setTimeout(() => {
            this.persistPending = false;
            this.persistMaxVersions();
        }, CONFIG.PERSIST_DEBOUNCE_MS);
    }

    private persistMaxVersions(): void {
        try {
            const data: Record<string, number> = {};
            for (const [key, entry] of this.versions) {
                if (entry.maxKnownVersion > 0) {
                    data[key] = entry.maxKnownVersion;
                }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[VersionManager] Failed to persist:', e);
        }
    }

    // ==================== STORAGE LISTENER (v4.1) ====================
    /**
     * Listens for localStorage changes from other tabs.
     * Merges maxKnownVersion to ensure all tabs stay in sync.
     */
    private startStorageListener(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('storage', (e) => {
            if (e.key !== STORAGE_KEY || !e.newValue) return;

            try {
                const data = JSON.parse(e.newValue);
                if (typeof data !== 'object' || data === null) return;

                for (const [key, value] of Object.entries(data)) {
                    if (typeof value !== 'number' || !Number.isFinite(value)) continue;

                    const entry = this.versions.get(key);
                    if (entry) {
                        entry.maxKnownVersion = Math.max(entry.maxKnownVersion, value);
                    } else {
                        this.versions.set(key, {
                            localVersion: value,
                            maxKnownVersion: value,
                            pendingWrite: false,
                            pendingDelete: false,
                            lastWriteTime: 0,
                            lastUpdatedAt: ''
                        });
                    }
                }
            } catch {
                // Ignore parse errors from other tabs
            }
        });
    }

    // ==================== CLEANUP ====================
    private startCleanupTimer(): void {
        if (typeof window === 'undefined') return;
        this.cleanupTimer = window.setInterval(() => this.cleanup(), CONFIG.CLEANUP_INTERVAL_MS);
    }

    private cleanup(): void {
        // Use trusted time to prevent clock manipulation
        const trustedNow = timeService.getTrustedTime();
        let hasChanges = false;

        for (const [key, entry] of this.versions) {
            // Remove entries older than TTL
            if (entry.lastWriteTime > 0 && trustedNow - entry.lastWriteTime > CONFIG.ENTRY_TTL_MS) {
                this.versions.delete(key);
                hasChanges = true;
                continue;
            }

            // Auto-recover stuck pending
            if ((entry.pendingWrite || entry.pendingDelete) &&
                entry.lastWriteTime > 0 &&
                trustedNow - entry.lastWriteTime > CONFIG.PENDING_TIMEOUT_MS) {
                entry.pendingWrite = false;
                entry.pendingDelete = false;
                this.processQueue(key);
            }
        }

        if (hasChanges) {
            this.schedulePersist();
        }
    }

    // ==================== OPERATION QUEUE ====================
    /**
     * Enqueue an operation with timeout to prevent deadlock.
     */
    public enqueue(key: string, type: OperationType): Promise<void> {
        const entry = this.versions.get(key);

        // No pending = immediate
        if (!entry?.pendingWrite && !entry?.pendingDelete) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const timer = window.setTimeout(() => {
                this.removeFromQueue(key, op);
                reject(new Error(`Operation queue timeout for ${key}`));
            }, CONFIG.ENQUEUE_TIMEOUT_MS);

            const op: QueuedOperation = {
                type,
                resolve: () => {
                    clearTimeout(timer);
                    resolve();
                },
                reject: (err) => {
                    clearTimeout(timer);
                    reject(err);
                },
                timer
            };

            let queue = this.operationQueues.get(key);
            if (!queue) {
                queue = [];
                this.operationQueues.set(key, queue);
            }
            queue.push(op);
        });
    }

    private removeFromQueue(key: string, op: QueuedOperation): void {
        const queue = this.operationQueues.get(key);
        if (!queue) return;
        const idx = queue.indexOf(op);
        if (idx !== -1) queue.splice(idx, 1);
        if (queue.length === 0) {
            this.operationQueues.delete(key);
        }
    }

    private processQueue(key: string): void {
        const queue = this.operationQueues.get(key);
        if (queue && queue.length > 0) {
            const next = queue.shift()!;
            next.resolve();
        }
        if (queue && queue.length === 0) {
            this.operationQueues.delete(key);
        }
    }

    // ==================== CORE OPERATIONS ====================
    /**
     * Prepare a write operation. Returns version to include in write.
     */
    public prepareWrite(key: string, currentRemoteVersion = 0): number {
        let entry = this.versions.get(key);

        const maxKnown = entry?.maxKnownVersion ?? 0;
        const baseVersion = Math.max(maxKnown, currentRemoteVersion);
        const newVersion = baseVersion + 1;

        if (!entry) {
            entry = {
                localVersion: newVersion,
                maxKnownVersion: newVersion,
                pendingWrite: true,
                pendingDelete: false,
                lastWriteTime: Date.now(),
                lastUpdatedAt: timeService.getTrustedISO()
            };
            this.versions.set(key, entry);
        } else {
            entry.localVersion = newVersion;
            entry.maxKnownVersion = Math.max(entry.maxKnownVersion, newVersion);
            entry.pendingWrite = true;
            entry.pendingDelete = false;
            entry.lastWriteTime = Date.now();
            entry.lastUpdatedAt = timeService.getTrustedISO();
        }

        this.schedulePersist();
        return newVersion;
    }

    /**
     * Prepare a delete operation.
     */
    public prepareDelete(key: string): void {
        let entry = this.versions.get(key);
        if (!entry) {
            entry = {
                localVersion: 0,
                maxKnownVersion: 0,
                pendingWrite: false,
                pendingDelete: true,
                lastWriteTime: Date.now(),
                lastUpdatedAt: ''
            };
            this.versions.set(key, entry);
        } else {
            entry.pendingDelete = true;
            entry.pendingWrite = false;
            entry.lastWriteTime = Date.now();
        }
    }

    /**
     * Abort pending operation (called on error).
     */
    public abortPending(key: string): void {
        const entry = this.versions.get(key);
        if (entry) {
            entry.pendingWrite = false;
            entry.pendingDelete = false;
            this.processQueue(key);
        }
    }

    /**
     * Confirm write succeeded.
     */
    public confirmWrite(key: string): void {
        const entry = this.versions.get(key);
        if (entry) {
            entry.pendingWrite = false;
            this.processQueue(key);
        }
    }

    /**
     * Confirm delete succeeded.
     */
    public confirmDelete(key: string): void {
        const entry = this.versions.get(key);
        if (entry) {
            entry.pendingDelete = false;
            this.processQueue(key);
        }
    }

    // ==================== DECISION LOGIC ====================
    /**
     * Determine if a remote update should be applied.
     */
    public shouldApplyRemote(
        key: string,
        remoteVersion: number | undefined,
        remoteUpdatedAt?: string,
        remoteDeviceId?: string
    ): { apply: boolean; reason: string; isConflict?: boolean } {
        const remote = getVersion({ _version: remoteVersion });
        const remoteTs = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : 0;
        const entry = this.versions.get(key);

        // No local state = accept
        if (!entry) {
            this.updateFromRemote(key, remote, remoteUpdatedAt);
            return { apply: true, reason: 'no_local_state' };
        }

        // Auto-recover stuck pending using trusted time
        const trustedNow = timeService.getTrustedTime();
        if ((entry.pendingWrite || entry.pendingDelete) &&
            entry.lastWriteTime > 0 &&
            trustedNow - entry.lastWriteTime > CONFIG.PENDING_TIMEOUT_MS) {
            entry.pendingWrite = false;
            entry.pendingDelete = false;
        }

        // Pending write
        if (entry.pendingWrite) {
            if (remote === entry.localVersion) {
                this.confirmWrite(key);
                return { apply: true, reason: 'own_write_confirmed' };
            }
            if (remote < entry.localVersion) {
                return { apply: false, reason: 'stale_during_pending' };
            }
            // Remote newer during pending = conflict
            this.updateFromRemote(key, remote, remoteUpdatedAt);
            entry.pendingWrite = false;
            this.processQueue(key);
            return { apply: true, reason: 'newer_remote_during_pending', isConflict: true };
        }

        // No pending - check version
        if (remote > entry.maxKnownVersion) {
            this.updateFromRemote(key, remote, remoteUpdatedAt);
            return { apply: true, reason: 'newer_version' };
        }

        // Same version, different device = check timestamp
        if (remote === entry.localVersion && remoteDeviceId && remoteDeviceId !== this.deviceId) {
            const localTs = entry.lastUpdatedAt ? Date.parse(entry.lastUpdatedAt) : 0;
            if (Number.isFinite(remoteTs) && remoteTs > localTs) {
                this.updateFromRemote(key, remote, remoteUpdatedAt);
                return { apply: true, reason: 'same_version_newer_timestamp', isConflict: true };
            }
        }

        // SELF-HEALING: If remote is "stale" (lower version) but SIGNIFICANTLY newer in time (>5s),
        // assume our local version is bloated/desynced and accept reality.
        const lastWrite = entry.lastWriteTime || 0;
        if (remote < entry.maxKnownVersion && Number.isFinite(remoteTs) && remoteTs > lastWrite + 5000) {
            console.warn(`[VersionManager] Self-healing desync for ${key}. Remote v${remote} is newer than local write despite v${entry.maxKnownVersion}.`);
            this.updateFromRemote(key, remote, remoteUpdatedAt);

            // Force reset local version state to match remote
            const freshEntry = this.versions.get(key);
            if (freshEntry) {
                freshEntry.maxKnownVersion = remote;
                freshEntry.localVersion = remote;
            }
            this.persistMaxVersions();

            return { apply: true, reason: 'self_healing_desync', isConflict: true };
        }

        return { apply: false, reason: 'stale_or_same_version' };
    }

    private updateFromRemote(key: string, version: number, updatedAt?: string): void {
        let entry = this.versions.get(key);
        if (!entry) {
            entry = {
                localVersion: version,
                maxKnownVersion: version,
                pendingWrite: false,
                pendingDelete: false,
                lastWriteTime: Date.now(),
                lastUpdatedAt: updatedAt ?? ''
            };
            this.versions.set(key, entry);
        } else {
            entry.localVersion = version;
            entry.maxKnownVersion = Math.max(entry.maxKnownVersion, version);
            entry.lastUpdatedAt = updatedAt ?? '';
        }
        this.schedulePersist();
    }

    /**
     * Determine if a remote NULL (deletion) should be applied.
     */
    public shouldApplyRemoteNull(key: string): { apply: boolean; reason: string } {
        const entry = this.versions.get(key);

        if (!entry) {
            return { apply: true, reason: 'no_local_state' };
        }

        // Auto-recover stuck pending
        const trustedNow = timeService.getTrustedTime();
        if ((entry.pendingWrite || entry.pendingDelete) &&
            entry.lastWriteTime > 0 &&
            trustedNow - entry.lastWriteTime > CONFIG.PENDING_TIMEOUT_MS) {
            entry.pendingWrite = false;
            entry.pendingDelete = false;
        }

        if (entry.pendingDelete) {
            this.confirmDelete(key);
            return { apply: true, reason: 'own_delete_confirmed' };
        }

        if (entry.pendingWrite) {
            return { apply: false, reason: 'pending_write_blocks_null' };
        }

        return { apply: true, reason: 'accepted_remote_null' };
    }

    // ==================== HELPERS ====================
    /**
     * Create version metadata for a write operation.
     */
    public getVersionMeta(key: string, currentRemote = 0): VersionMeta {
        const version = this.prepareWrite(key, currentRemote);
        return {
            _version: version,
            _updatedAt: timeService.getTrustedISO(),
            _deviceId: this.deviceId
        };
    }

    /**
     * Reset state for a key.
     */
    public reset(key: string): void {
        const queue = this.operationQueues.get(key);
        if (queue) {
            for (const op of queue) {
                clearTimeout(op.timer);
                op.reject(new Error(`Key ${key} reset`));
            }
        }
        this.operationQueues.delete(key);
        this.versions.delete(key);
        this.schedulePersist();
    }

    /**
     * Full reset (on logout).
     */
    public resetAll(): void {
        // Reject all pending operations
        for (const [, queue] of this.operationQueues) {
            for (const op of queue) {
                clearTimeout(op.timer);
                op.reject(new Error('Version manager reset'));
            }
        }
        this.operationQueues.clear();
        this.versions.clear();
        localStorage.removeItem(STORAGE_KEY);

        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        this.persistPending = false;
    }

    /**
     * Cleanup on unmount.
     */
    public destroy(): void {
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
        if (this.persistTimer) clearTimeout(this.persistTimer);
    }

    // ==================== LOCKOUT & VERSIONED SAVE (v4.2) ====================
    /**
     * Check if a key is in lockout period after a local action.
     * Used to prevent UI flash from remote echoes.
     */
    public isInLockout(key: string): boolean {
        const lastAction = this.localActionTime.get(key) || 0;
        return Date.now() - lastAction < CONFIG.LOCKOUT_MS;
    }

    /**
     * Unified versioned save with automatic lockout, version metadata, and error handling.
     * Use this for all cloud writes that need cross-device sync.
     */
    public async saveVersioned<T>(
        key: string,
        data: T | null,
        saveFn: (data: any) => Promise<void>
    ): Promise<void> {
        // 1. Set lockout to prevent remote echo
        this.localActionTime.set(key, Date.now());

        // 2. Handle DELETE (simplified - no version tracking for deletes)
        if (data === null) {
            try {
                await saveFn(null);
            } catch (e) {
                console.error(`[VersionManager] Delete failed for ${key}:`, e);
            }
            return;
        }

        // 3. Handle WRITE with version metadata
        const meta = this.getVersionMeta(key);
        try {
            await saveFn({ ...data, ...meta } as any);
            this.confirmWrite(key);
        } catch (e) {
            this.abortPending(key);
            console.error(`[VersionManager] Write failed for ${key}:`, e);
        }
    }
}

// ==================== EXPORTS ====================
export const createVersionManager = () => new VersionManagerImpl();
export const versionManager = createVersionManager();
