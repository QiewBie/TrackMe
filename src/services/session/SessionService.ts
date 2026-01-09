/**
 * SessionService - Simplified Session Management
 * 
 * Single source of truth for active session state.
 * All state lives in Firestore, UI subscribes via onSnapshot.
 */

import {
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    getDoc,
    addDoc,
    collection
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { timeService } from '../time/TimeService';
import { networkState } from '../network/NetworkStateService';
import { FEATURE_FLAGS } from '../../config/featureFlags';

// === TYPES ===

export interface CloudSession {
    // Core
    taskId: string;
    status: 'running' | 'paused';
    startTime: Timestamp | null;      // When current segment started (null if paused)
    accumulatedTime: number;          // Seconds accumulated before pauses

    // Pomodoro
    mode: 'focus' | 'break';
    targetDuration: number;           // Seconds (e.g., 25*60 = 1500)

    // Playlist
    playlistId: string | null;
    queue: string[];                  // Ordered task IDs

    // Sync Metadata
    updatedAt: Timestamp;
    deviceId: string;
}

export interface SessionConfig {
    mode: 'focus' | 'break';
    duration: number;  // Minutes
}

// === CONSTANTS ===

const DEVICE_ID_KEY = 'session_device_id';

function getDeviceId(): string {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

// === SERVICE ===

class SessionServiceClass {
    private userId: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private networkUnsubscribe: (() => void) | null = null;
    private listeners: Set<(session: CloudSession | null) => void> = new Set();
    private currentSession: CloudSession | null = null;

    // Rate limiting to prevent rapid-fire actions
    private lastActionTime = 0;
    private readonly ACTION_COOLDOWN_MS = 500;

    // === INITIALIZATION ===

    initialize(userId: string) {
        if (this.userId === userId) return;

        // Cleanup previous subscription
        this.cleanup();

        this.userId = userId;

        if (userId === 'guest') {
            console.log('[SessionService] Guest mode - no cloud sync');
            return;
        }

        // Network-aware subscription management
        if (FEATURE_FLAGS.USE_NETWORK_COORDINATOR) {
            this.networkUnsubscribe = networkState.subscribe((state) => {
                if (state.isActive && !this.unsubscribe) {
                    this.setupSubscription();
                } else if (!state.isActive && this.unsubscribe) {
                    console.log('[SessionService] Pausing subscription (inactive)');
                    this.unsubscribe();
                    this.unsubscribe = null;
                }
            });
        } else {
            // Legacy: always subscribe
            this.setupSubscription();
        }
    }

    private setupSubscription(): void {
        if (!this.userId || this.userId === 'guest' || this.unsubscribe) return;

        const sessionRef = doc(db, 'users', this.userId, 'data', 'session');

        this.unsubscribe = onSnapshot(sessionRef, (snap) => {
            const data = snap.exists() ? (snap.data() as CloudSession) : null;
            this.currentSession = data;
            this.listeners.forEach(cb => cb(data));
        }, (error) => {
            console.error('[SessionService] Subscription error:', error);
            // Don't retry - networkState will handle reconnect
        });

        console.log('[SessionService] Subscription active');
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.networkUnsubscribe) {
            this.networkUnsubscribe();
            this.networkUnsubscribe = null;
        }
        this.userId = null;
        this.currentSession = null;
        this.listeners.clear();
    }

    // === SUBSCRIPTION ===

    subscribe(callback: (session: CloudSession | null) => void): () => void {
        this.listeners.add(callback);

        // Immediately call with current state
        callback(this.currentSession);

        return () => {
            this.listeners.delete(callback);
        };
    }

    getSession(): CloudSession | null {
        return this.currentSession;
    }

    // === ACTIONS ===

    private getSessionRef() {
        if (!this.userId || this.userId === 'guest') {
            throw new Error('Cannot perform session action: not authenticated');
        }
        return doc(db, 'users', this.userId, 'data', 'session');
    }

    // Rate limiting helper
    private isThrottled(): boolean {
        const now = Date.now();
        if (now - this.lastActionTime < this.ACTION_COOLDOWN_MS) {
            console.log('[SessionService] Action throttled');
            return true;
        }
        this.lastActionTime = now;
        return false;
    }

    async start(taskId: string, config: SessionConfig, playlistId?: string | null, queue?: string[]): Promise<void> {
        const sessionRef = this.getSessionRef();

        // Use trusted time for startTime to avoid serverTimestamp() race conditions
        const trustedNow = Timestamp.fromMillis(timeService.getTrustedTime());

        const session: Omit<CloudSession, 'startTime' | 'updatedAt'> & { startTime: Timestamp; updatedAt: any } = {
            taskId,
            status: 'running',
            startTime: trustedNow,
            accumulatedTime: 0,
            mode: config.mode,
            targetDuration: config.duration * 60,
            playlistId: playlistId ?? null,
            queue: queue ?? [],
            updatedAt: serverTimestamp(),
            deviceId: getDeviceId()
        };

        await setDoc(sessionRef, session);
        console.log('[SessionService] Started session:', taskId);
    }

    async pause(): Promise<void> {
        if (this.isThrottled()) return;

        const sessionRef = this.getSessionRef();
        const session = this.currentSession;

        if (!session || session.status !== 'running') {
            console.log('[SessionService] Cannot pause: no running session');
            return;
        }

        // Calculate elapsed time in this segment (defensive: never negative)
        const now = timeService.getTrustedTime();
        const startMs = session.startTime?.toMillis() ?? now;
        const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));

        await updateDoc(sessionRef, {
            status: 'paused',
            startTime: null,
            accumulatedTime: session.accumulatedTime + elapsed,
            updatedAt: serverTimestamp()
        });

        console.log('[SessionService] Paused, accumulated:', session.accumulatedTime + elapsed);
    }

    async resume(): Promise<void> {
        if (this.isThrottled()) return;

        const sessionRef = this.getSessionRef();
        const session = this.currentSession;

        if (!session || session.status !== 'paused') {
            console.log('[SessionService] Cannot resume: no paused session');
            return;
        }

        // Use trusted time for consistent cross-device sync
        const trustedNow = Timestamp.fromMillis(timeService.getTrustedTime());

        await updateDoc(sessionRef, {
            status: 'running',
            startTime: trustedNow,
            updatedAt: serverTimestamp()
        });

        console.log('[SessionService] Resumed');
    }

    async stop(): Promise<void> {
        if (!this.userId || this.userId === 'guest') return;

        const sessionRef = this.getSessionRef();
        const session = this.currentSession;

        if (!session) {
            console.log('[SessionService] Cannot stop: no session');
            return;
        }

        // Calculate total duration
        let totalDuration = session.accumulatedTime;
        if (session.status === 'running' && session.startTime) {
            const now = timeService.getTrustedTime();
            const elapsed = Math.floor((now - session.startTime.toMillis()) / 1000);
            totalDuration += elapsed;
        }

        // Only log if we have meaningful duration (> 5 seconds)
        if (totalDuration > 5) {
            const logRef = collection(db, 'users', this.userId, 'time_logs');
            await addDoc(logRef, {
                id: crypto.randomUUID(),
                taskId: session.taskId,
                duration: totalDuration,
                startTime: timeService.getTrustedISO(),
                type: 'auto',
                note: session.mode === 'break' ? 'Break Session' : 'Focus Session'
            });
            console.log('[SessionService] Logged time:', totalDuration, 'seconds');
        }

        // Clear session
        await deleteDoc(sessionRef);
        console.log('[SessionService] Stopped and cleared session');
    }

    async switchTask(newTaskId: string): Promise<void> {
        const session = this.currentSession;

        if (!session) {
            // No active session, start a new one
            await this.start(newTaskId, { mode: 'focus', duration: 25 });
            return;
        }

        if (session.taskId === newTaskId) {
            console.log('[SessionService] Already on this task');
            return;
        }

        const sessionRef = this.getSessionRef();

        // Calculate remaining time (for Pomodoro continuity)
        let elapsed = session.accumulatedTime;
        if (session.status === 'running' && session.startTime) {
            const now = timeService.getTrustedTime();
            elapsed += Math.floor((now - session.startTime.toMillis()) / 1000);
        }
        const remaining = Math.max(0, session.targetDuration - elapsed);

        // Update with new task, keep timer state
        await updateDoc(sessionRef, {
            taskId: newTaskId,
            accumulatedTime: session.targetDuration - remaining, // Preserve progress
            startTime: session.status === 'running' ? Timestamp.fromMillis(timeService.getTrustedTime()) : null,
            updatedAt: serverTimestamp(),
            deviceId: getDeviceId()
        });

        console.log('[SessionService] Switched to task:', newTaskId);
    }

    async setPlaylist(playlistId: string | null, queue: string[]): Promise<void> {
        const session = this.currentSession;

        if (!session) {
            console.warn('[SessionService] Cannot set playlist: no session exists. Call start() first.');
            return;
        }

        const sessionRef = this.getSessionRef();

        await updateDoc(sessionRef, {
            playlistId,
            queue,
            updatedAt: serverTimestamp()
        });

        console.log('[SessionService] Updated playlist:', playlistId);
    }

    async updateQueue(queue: string[]): Promise<void> {
        const session = this.currentSession;
        if (!session) return;

        const sessionRef = this.getSessionRef();
        await updateDoc(sessionRef, {
            queue,
            updatedAt: serverTimestamp()
        });
    }

    // === COMPUTED ===

    /**
     * Get elapsed time in seconds (computed from session state)
     */
    getElapsed(): number {
        const session = this.currentSession;
        if (!session) return 0;

        let elapsed = session.accumulatedTime;

        if (session.status === 'running' && session.startTime) {
            const now = timeService.getTrustedTime();
            elapsed += Math.floor((now - session.startTime.toMillis()) / 1000);
        }

        return elapsed;
    }

    /**
     * Get remaining time for Pomodoro countdown
     */
    getRemaining(): number {
        const session = this.currentSession;
        if (!session) return 0;

        const elapsed = this.getElapsed();
        return Math.max(0, session.targetDuration - elapsed);
    }
}

export const sessionService = new SessionServiceClass();
