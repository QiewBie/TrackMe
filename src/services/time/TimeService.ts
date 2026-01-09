import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TimeServiceConfig } from './TimeServiceConfig';
import { networkState } from '../network/NetworkStateService';
import { FEATURE_FLAGS } from '../../config/featureFlags';

/**
 * TimeService — Single Source of Truth for "Current Time".
 * 
 * Responsibilities:
 * 1. Synchronize local clock with Server Time (Firestore).
 * 2. Provide trusted timestamps for all database writes.
 * 3. Handle fallback to Local Time when offline.
 * 4. Conditional heartbeat to prevent drift during long idle periods.
 * 
 * Usage:
 *   import { timeService } from '../services/time/TimeService';
 *   const now = timeService.getTrustedTime();
 *   const iso = timeService.getTrustedISO();
 */
class TimeService {
    private clockOffset = 0;
    private isSynced = false;
    private userId: string | null = null;
    private syncPromise: Promise<void> | null = null;
    private readyResolvers: Array<() => void> = [];

    // Conditional heartbeat tracking
    private lastPiggybackTime = 0;
    private heartbeatTimeout: number | null = null;
    private networkUnsubscribe: (() => void) | null = null;

    // Offset change listeners (for timer recalculation)
    private offsetListeners: Array<() => void> = [];

    /**
     * Initializes time synchronization with retry logic.
     * Call this after user authentication (with userId) or for guest mode.
     */
    public async initialize(userId: string): Promise<void> {
        this.userId = userId;

        // Guest mode: no server sync needed
        if (userId === 'guest') {
            this.isSynced = true;
            this.notifyReady();
            return;
        }

        // Return existing sync if already in progress
        if (this.syncPromise) return this.syncPromise;

        this.syncPromise = this.performProbeSyncWithRetry();

        try {
            await this.syncPromise;
            this.scheduleConditionalHeartbeat();
        } catch (err) {
            console.warn('[TimeService] Sync failed, using local time:', err);
            this.isSynced = true; // Graceful degradation
            this.notifyReady();
        }

        // Network-aware heartbeat control
        if (FEATURE_FLAGS.USE_NETWORK_COORDINATOR) {
            this.networkUnsubscribe = networkState.subscribe((state) => {
                if (state.isActive) {
                    this.resumeHeartbeat();
                } else {
                    this.pauseHeartbeat();
                }
            });
        }
    }

    /**
     * Returns a Promise that resolves when TimeService is ready.
     * Use this before hydrating time-dependent state.
     * 
     * Example:
     *   await timeService.waitForReady();
     *   const correctedTime = timeService.getTrustedTime();
     */
    public waitForReady(): Promise<void> {
        if (this.isSynced) return Promise.resolve();
        return new Promise(resolve => {
            this.readyResolvers.push(resolve);
        });
    }

    private notifyReady(): void {
        this.readyResolvers.forEach(resolve => resolve());
        this.readyResolvers = [];
    }

    /**
     * Returns the current Trusted Time in milliseconds.
     * This is the primary method for getting "now" across the application.
     */
    public getTrustedTime(): number {
        return Date.now() + this.clockOffset;
    }

    /**
     * Returns ISO string from Trusted Time (UTC).
     * Use for database writes where timezone info is not needed.
     */
    public getTrustedISO(): string {
        return new Date(this.getTrustedTime()).toISOString();
    }

    /**
     * Returns full ISO 8601 string with timezone offset.
     * Example: "2026-01-06T21:30:35+02:00"
     * Use for TimeLog startTime where timezone context matters for analytics.
     */
    public getTrustedISOWithTimezone(): string {
        const date = new Date(this.getTrustedTime());
        const offset = -date.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const mins = String(Math.abs(offset) % 60).padStart(2, '0');

        // Replace trailing Z with timezone offset
        return date.toISOString().slice(0, -1) + sign + hours + ':' + mins;
    }

    /**
     * Validates and updates offset from external signal (Piggyback).
     * Called by FirestoreAdapter when receiving snapshot.readTime.
     * Returns true if offset was actually updated.
     */
    public updateOffset(serverTime: number): boolean {
        const potentialOffset = serverTime - Date.now();

        // Validation: Reject unreasonable offsets
        if (!this.validateOffset(potentialOffset)) {
            console.warn(`[TimeService] Rejected invalid offset: ${potentialOffset}ms`);
            return false;
        }

        // Jitter protection: Only update if drift exceeds threshold
        if (Math.abs(this.clockOffset - potentialOffset) > TimeServiceConfig.JITTER_THRESHOLD_MS) {
            console.log(`[TimeService] Offset updated: ${this.clockOffset}ms → ${potentialOffset}ms`);
            this.clockOffset = potentialOffset;
            this.isSynced = true;
            this.notifyReady();
            this.notifyOffsetChange();
        }

        return true;
    }

    /**
     * Validates that offset is within acceptable bounds.
     * Rejects NaN, Infinity, and offsets > MAX_OFFSET_MS.
     */
    private validateOffset(offset: number): boolean {
        if (!Number.isFinite(offset)) return false;
        if (Math.abs(offset) > TimeServiceConfig.MAX_OFFSET_MS) return false;
        return true;
    }

    /**
     * Returns true if TimeService has completed initial sync.
     */
    public isReady(): boolean {
        return this.isSynced;
    }

    /**
     * Subscribe to offset changes (for timer recalculation).
     * Returns unsubscribe function.
     */
    public onOffsetChange(callback: () => void): () => void {
        this.offsetListeners.push(callback);
        return () => {
            this.offsetListeners = this.offsetListeners.filter(fn => fn !== callback);
        };
    }

    /**
     * Notify all offset change listeners.
     */
    private notifyOffsetChange(): void {
        this.offsetListeners.forEach(fn => fn());
    }

    /**
     * Returns current clock offset in milliseconds.
     * Useful for debugging.
     */
    public getOffset(): number {
        return this.clockOffset;
    }

    /**
     * Probe sync with exponential backoff retry.
     */
    private async performProbeSyncWithRetry(): Promise<void> {
        const { PROBE_RETRY_COUNT, PROBE_RETRY_BASE_DELAY_MS } = TimeServiceConfig;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < PROBE_RETRY_COUNT; attempt++) {
            try {
                await this.performProbeSync();
                return; // Success
            } catch (err) {
                lastError = err as Error;

                if (attempt < PROBE_RETRY_COUNT - 1) {
                    const delay = PROBE_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
                    console.warn(`[TimeService] Probe attempt ${attempt + 1}/${PROBE_RETRY_COUNT} failed, retry in ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Performs a single probe sync by writing/reading serverTimestamp.
     */
    private async performProbeSync(): Promise<void> {
        if (!this.userId || this.userId === 'guest') {
            this.isSynced = true;
            return;
        }

        const probeRef = doc(db, 'users', this.userId, 'system', 'time_probe');
        const start = Date.now();

        // 1. Write server timestamp
        await setDoc(probeRef, {
            event: 'sync_probe',
            serverTime: serverTimestamp()
        });

        // 2. Read it back
        const snapshot = await getDoc(probeRef);
        const end = Date.now();

        if (snapshot.exists()) {
            const data = snapshot.data();
            const serverTime = (data.serverTime as any).toMillis();

            // 3. Calculate offset accounting for RTT
            const latency = (end - start) / 2;
            const preciseServerTime = serverTime + latency;
            const offset = preciseServerTime - end;

            if (this.validateOffset(offset)) {
                console.log(`[TimeService] Synced. Latency: ${Math.round(latency)}ms, Offset: ${Math.round(offset)}ms`);
                this.clockOffset = offset;
                this.isSynced = true;
                this.lastPiggybackTime = Date.now();
                this.notifyReady();
            } else {
                throw new Error(`Calculated offset out of bounds: ${offset}ms`);
            }
        } else {
            throw new Error('Probe document not found after write');
        }
    }

    /**
     * Schedules conditional heartbeat sync.
     * Only triggers if no piggyback updates for HEARTBEAT_STALE_THRESHOLD_MS.
     * This prevents drift during long idle periods without excessive Firestore writes.
     */
    private scheduleConditionalHeartbeat(): void {
        // Clear existing timeout
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }

        // Don't schedule for guest
        if (!this.userId || this.userId === 'guest') return;

        const { HEARTBEAT_STALE_THRESHOLD_MS } = TimeServiceConfig;

        this.heartbeatTimeout = window.setTimeout(() => {
            const timeSincePiggyback = Date.now() - this.lastPiggybackTime;

            if (timeSincePiggyback >= HEARTBEAT_STALE_THRESHOLD_MS) {
                console.log('[TimeService] No piggyback for 1h, performing heartbeat sync');
                this.performProbeSync()
                    .then(() => this.scheduleConditionalHeartbeat())
                    .catch(err => {
                        console.warn('[TimeService] Heartbeat sync failed:', err);
                        // Still reschedule to try again later
                        this.scheduleConditionalHeartbeat();
                    });
            } else {
                // Reschedule for remaining time
                this.scheduleConditionalHeartbeat();
            }
        }, HEARTBEAT_STALE_THRESHOLD_MS);
    }

    /**
     * Resets TimeService state. Call on logout.
     */
    public reset(): void {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
        if (this.networkUnsubscribe) {
            this.networkUnsubscribe();
            this.networkUnsubscribe = null;
        }
        this.clockOffset = 0;
        this.isSynced = false;
        this.userId = null;
        this.syncPromise = null;
        this.lastPiggybackTime = 0;
        this.readyResolvers = [];
    }

    /**
     * Pause heartbeat sync (when tab hidden or offline)
     */
    private pauseHeartbeat(): void {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
            console.log('[TimeService] Heartbeat paused (inactive)');
        }
    }

    /**
     * Resume heartbeat sync (when tab visible and online)
     */
    private resumeHeartbeat(): void {
        if (!this.heartbeatTimeout && this.userId && this.userId !== 'guest') {
            console.log('[TimeService] Heartbeat resumed (active)');
            this.scheduleConditionalHeartbeat();
        }
    }
}

// Singleton export
export const timeService = new TimeService();
