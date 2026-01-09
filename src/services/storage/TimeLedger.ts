import { TimeLog } from '../../types/models';
import { FirestoreAdapter } from './FirestoreAdapter';
import { TimeServiceConfig } from '../time/TimeServiceConfig';
import { timeService } from '../time/TimeService';

const STORAGE_KEY = 'time_tracker_logs';
const PENDING_KEY = 'time_tracker_pending_uploads';

class TimeLedgerService {
    private cache: TimeLog[] | null = null;
    private listeners: ((logs: TimeLog[]) => void)[] = [];

    // Cloud Sync
    private adapter: FirestoreAdapter | null = null;
    private userId: string | null = null;
    private unsubscribeCloud: (() => void) | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEY) {
                    this.load(true); // Force reload
                }
            });
        }
    }

    // --- Hybird Initialization ---

    public initialize(userId: string) {
        if (this.userId === userId) return; // Idempotent

        // GUEST GUARD: If guest, do not initialize adapter or sync
        if (userId === 'guest') {
            console.log('[TimeLedger] Initializing in Local-Only mode (Guest).');
            this.userId = userId;
            this.adapter = null; // Ensure no adapter means no sync
            return;
        }

        console.log(`[TimeLedger] Initializing for user: ${userId}`);
        this.userId = userId;
        this.adapter = new FirestoreAdapter(userId);

        // 1. Try to recover any lost writes from previous session
        this.processPendingQueue();

        // 2. Perform one-time migration if needed
        this.migrateLegacyLogs();

        // 3. Subscribe to Cloud Updates (Limit 30 days for cost protection)
        // Fix: Handle Async Subscription + Race Condition Check
        const capturedUser = userId;
        this.adapter.subscribeToTimeLogs((cloudLogs) => {
            console.log(`[TimeLedger] Received ${cloudLogs.length} logs from Cloud.`);
            this.mergeLogs(cloudLogs);
        }, 30).then((unsub) => {
            // LIVENESS CHECK: If user switched/logout while promise was pending
            if (this.userId !== capturedUser) {
                console.warn('[TimeLedger] Subscription arrived after reset/switch. Aborting.');
                unsub(); // Kill it immediately
                return;
            }
            this.unsubscribeCloud = unsub;
        }).catch(err => {
            console.error('[TimeLedger] Failed to subscribe to cloud logs', err);
        });
    }

    public reset() {
        console.log('[TimeLedger] Resetting (Logout).');
        if (this.unsubscribeCloud) this.unsubscribeCloud();
        this.userId = null;
        this.adapter = null;
        this.cache = null; // Clear sensitive data
        this.listeners = [];
    }

    // --- Core Logic ---

    private load(force = false): TimeLog[] {
        if (this.cache && !force) return this.cache;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            this.cache = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('[TimeLedger] Failed to load logs', e);
            this.cache = [];
        }
        return this.cache!;
    }

    // --- Quota Management ---

    private getStorageUsage(): number {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? new Blob([data]).size : 0;
        } catch {
            return 0;
        }
    }

    private cleanupOldLogs(): void {
        const logs = this.load(true);
        const now = timeService.getTrustedTime();
        const cutoff = now - TimeServiceConfig.LOG_RETENTION_MS;

        const cleaned = logs.filter(log => {
            const logTime = new Date(log.startTime).getTime();
            return logTime > cutoff;
        });

        if (cleaned.length < logs.length) {
            console.log(`[TimeLedger] Cleaned ${logs.length - cleaned.length} old logs (>90 days)`);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
                this.cache = cleaned;
                this.notifyListeners();
            } catch (e) {
                console.error('[TimeLedger] Failed to persist cleaned logs', e);
            }
        }
    }

    private ensureStorageQuota(): boolean {
        const usage = this.getStorageUsage();
        if (usage > TimeServiceConfig.MAX_STORAGE_BYTES) {
            console.warn(`[TimeLedger] Storage quota exceeded (${Math.round(usage / 1024)}KB), cleaning old logs`);
            this.cleanupOldLogs();
            return this.getStorageUsage() < TimeServiceConfig.MAX_STORAGE_BYTES;
        }
        return true;
    }

    private persist(logs: TimeLog[]) {
        try {
            // Check quota before persisting
            if (!this.ensureStorageQuota()) {
                console.error('[TimeLedger] Cannot persist: storage quota exceeded after cleanup');
                return;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
            this.cache = logs;
            this.notifyListeners();
        } catch (e) {
            console.error('[TimeLedger] Failed to save logs', e);
        }
    }

    private mergeLogs(cloudLogs: TimeLog[]) {
        const current = this.load(true);
        const currentMap = new Map(current.map(l => [l.id, l]));
        let hasChanges = false;

        for (const log of cloudLogs) {
            if (!currentMap.has(log.id)) {
                currentMap.set(log.id, log);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const merged = Array.from(currentMap.values()).sort((a, b) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            this.persist(merged);
            console.log(`[TimeLedger] Merged cloud logs. Total: ${merged.length}`);
        }
    }

    public subscribe(callback: (logs: TimeLog[]) => void): () => void {
        this.listeners.push(callback);
        // Immediately return current state
        if (this.cache) callback(this.cache);

        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners() {
        if (this.cache) {
            this.listeners.forEach(cb => cb(this.cache!));
        }
    }

    // Validate TimeLog structure
    private validateLog(log: TimeLog): boolean {
        return !!(
            log &&
            typeof log.id === 'string' && log.id.length > 0 &&
            typeof log.taskId === 'string' && log.taskId.length > 0 &&
            typeof log.startTime === 'string' && log.startTime.length > 0 &&
            typeof log.duration === 'number' && log.duration >= 0
        );
    }

    // --- Public API ---

    public getAllLogs(): TimeLog[] {
        return this.load();
    }

    public getLogsByTask(taskId: string): TimeLog[] {
        return this.load().filter(l => l.taskId === taskId);
    }

    public getLogsByDateRange(start: Date, end: Date): TimeLog[] {
        const startIso = start.toISOString();
        const endIso = end.toISOString();
        return this.load().filter(l => l.startTime >= startIso && l.startTime <= endIso);
    }

    /**
     * HYBRID SAVE: 
     * 1. Validate Input
     * 2. Write Local (Speed)
     * 3. Write Pending Queue (Safety)
     * 4. Write Cloud (Sync)
     */
    public saveLog(log: TimeLog): void {
        // 0. Validate
        if (!this.validateLog(log)) {
            console.error('[TimeLedger] Invalid log rejected:', log);
            return;
        }

        // 1. Local
        const current = this.load(true);
        // Deduplicate locally just in case
        if (current.find(l => l.id === log.id)) return;

        const updated = [...current, log];
        this.persist(updated);

        // 2 & 3. Cloud with Safety Net
        if (this.adapter) {
            this.addToPending(log);
            this.adapter.saveTimeLog(log)
                .then(() => {
                    this.removeFromPending(log.id);
                })
                .catch(err => {
                    console.warn(`[TimeLedger] Cloud save failed for ${log.id}, kept in pending queue.`, err);
                });
        }
    }

    public saveLogsBulk(newLogs: TimeLog[]): void {
        const current = this.load(true);
        const updated = [...current, ...newLogs];
        this.persist(updated);

        // Bulk cloud upload? For now, iterate (simplest)
        if (this.adapter) {
            newLogs.forEach(log => this.saveLog(log));
        }
    }

    public getAggregatedTime(taskId: string): number {
        const logs = this.getLogsByTask(taskId);
        return logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    }

    public deleteLogsForTask(taskId: string): void {
        const current = this.load(true);
        const updated = current.filter(l => l.taskId !== taskId);
        this.persist(updated);

        // TODO: Implement delete in FirestoreAdapter if needed for full sync
        // For MVP Time Logs are append-only mostly, but deletion sync is a "Nice to have"
    }

    // --- Reliability Internals ---

    private addToPending(log: TimeLog) {
        try {
            const pending = this.getPending();
            if (!pending.find(p => p.id === log.id)) {
                pending.push(log);
                localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
            }
        } catch (e) {
            console.error('[TimeLedger] Failed to update pending queue', e);
        }
    }

    private removeFromPending(logId: string) {
        try {
            const pending = this.getPending();
            const updated = pending.filter(p => p.id !== logId);
            localStorage.setItem(PENDING_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('[TimeLedger] Failed to clear pending item', e);
        }
    }

    private getPending(): TimeLog[] {
        try {
            const raw = localStorage.getItem(PENDING_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    private async processPendingQueue() {
        const pending = this.getPending();
        if (pending.length === 0) return;

        console.log(`[TimeLedger] Processing ${pending.length} pending uploads...`);
        if (!this.adapter) return;

        for (const log of pending) {
            try {
                await this.adapter.saveTimeLog(log);
                this.removeFromPending(log.id);
            } catch (e) {
                console.error(`[TimeLedger] Retry failed for ${log.id}`, e);
            }
        }
    }

    private async migrateLegacyLogs() {
        const MIGRATION_KEY = 'time_tracker_legacy_migrated_v1';
        if (localStorage.getItem(MIGRATION_KEY)) return;

        const allLogs = this.load(true);
        if (allLogs.length === 0) {
            localStorage.setItem(MIGRATION_KEY, 'true');
            return;
        }

        console.log(`[TimeLedger] Migrating ${allLogs.length} legacy logs to Cloud...`);
        if (!this.adapter) return;

        // Upload in chunks or one-by-one? 
        // For safety, one-by-one but we mark migration done only after all attempts
        // Actually, let's just use saveTimeLog which is idempotent.
        let successCount = 0;

        // Use a loop with Promise.all for speed? No, rate limits.
        // Sequential for implementation simplicity and rate safety.
        for (const log of allLogs) {
            try {
                await this.adapter.saveTimeLog(log);
                successCount++;
            } catch (e) {
                console.warn(`[TimeLedger] Migration failed for log ${log.id}`, e);
            }
        }

        console.log(`[TimeLedger] Migration complete. ${successCount}/${allLogs.length} uploaded.`);
        localStorage.setItem(MIGRATION_KEY, 'true');
    }
}

export const TimeLedger = new TimeLedgerService();
