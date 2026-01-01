import { TimeLog } from '../../types/models';

const STORAGE_KEY = 'time_tracker_logs';

class TimeLedgerService {
    private cache: TimeLog[] | null = null;
    private listeners: ((logs: TimeLog[]) => void)[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEY) {
                    // console.log('[TimeLedger] Storage Sync detected, reloading cache.');
                    this.load(true); // Force reload
                }
            });
        }
    }

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

    private persist(logs: TimeLog[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
            this.cache = logs;
            this.notifyListeners();
        } catch (e) {
            console.error('[TimeLedger] Failed to save logs', e);
        }
    }

    public subscribe(callback: (logs: TimeLog[]) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners() {
        if (this.cache) {
            this.listeners.forEach(cb => cb(this.cache!));
        }
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
        // Simple string comparison works for ISO8601 if timezones are UTC
        // But better to parse if needed. For now, strict string range.
        return this.load().filter(l => l.startTime >= startIso && l.startTime <= endIso);
    }

    /**
     * ATOMIC WRITE: Reads fresh state, appends, writes back.
     * Prevents race conditions with other tabs (mostly).
     */
    public saveLog(log: TimeLog): void {
        const current = this.load(true); // Force read from disk
        const updated = [...current, log];
        this.persist(updated);
    }

    public saveLogsBulk(newLogs: TimeLog[]): void {
        const current = this.load(true);
        const updated = [...current, ...newLogs];
        this.persist(updated);
    }

    /**
     * Efficiently calculates total duration for a task.
     * Used to hydrate Task.cachedTotalTime
     */
    public getAggregatedTime(taskId: string): number {
        const logs = this.getLogsByTask(taskId);
        return logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    }

    /**
     * Deletes all logs for a task (Cleanup)
     */
    public deleteLogsForTask(taskId: string): void {
        const current = this.load(true);
        const updated = current.filter(l => l.taskId !== taskId);
        this.persist(updated);
    }
}

export const TimeLedger = new TimeLedgerService();
