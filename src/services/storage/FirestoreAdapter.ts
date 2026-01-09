import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot, query, where, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { IStorageAdapter } from "./storage";
import { Task, Category, Playlist, UserSettings, TimeLog } from "../../types";
import { Session } from "../../features/focus/types";
import { timeService } from "../time/TimeService";
import { withRetry } from "../../utils/retry";

export class FirestoreAdapter {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
        // Aggressively initialize time sync on instantiation
        timeService.initialize(userId).catch(err => {
            console.warn('[FirestoreAdapter] Time sync initialization failed:', err);
        });
    }

    async getItem<T>(key: string): Promise<T | null> {
        if (!this.userId) return null;

        // Domain-specific check for subcollections
        if (['tasks', 'categories', 'playlists', 'time_logs'].includes(key)) {
            try {
                const colRef = collection(db, "users", this.userId, key);
                const snapshot = await getDocs(colRef);
                const items = snapshot.docs.map(doc => doc.data());
                return items as T;
            } catch (error) {
                console.error(`Error reading subcollection "${key}" from Firestore:`, error);
                return [] as T; // Return empty array on error for collections
            }
        }

        try {
            const docRef = doc(db, "users", this.userId, "data", key);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().value as T;
            }
            return null;
        } catch (error) {
            console.error(`Error reading key "${key}" from Firestore:`, error);
            return null;
        }
    }

    async setItem<T>(key: string, value: T): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "data", key);
            // We wrap value in an object to handle primitives and arrays easily
            // Sanitizing data to remove 'undefined' which Firestore rejects
            const sanitizedValue = this.sanitizeData(value);
            if (key.includes('notes')) console.log(`[Firestore] SAVE key="${key}":`, sanitizedValue);

            // Use Trusted Time for metadata
            await setDoc(docRef, { value: sanitizedValue, updatedAt: timeService.getTrustedISO() });
        } catch (error) {
            console.error(`Error writing key "${key}" to Firestore:`, error);
        }
    }

    async removeItem(key: string): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "data", key);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error removing key "${key}" from Firestore:`, error);
        }
    }

    // Helper to recursively convert undefined to null (Firestore doesn't support undefined)
    private sanitizeData(data: any): any {
        if (data === undefined) return null;
        if (data === null) return null;
        if (data instanceof Date) return data.toISOString();
        // Preserve Firestore Timestamps
        if (data instanceof Timestamp) return data;
        // Pass through Firestore FieldValues (sentinels)
        if (typeof data === 'object' && (data._methodName || (data.constructor && data.constructor.name && data.constructor.name.endsWith('FieldValue')))) {
            return data;
        }
        if (Array.isArray(data)) return data.map(item => this.sanitizeData(item));
        if (typeof data !== 'object') return data;

        const sanitized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = this.sanitizeData(data[key]);
            }
        }
        return sanitized;
    }

    // --- Domain Specific Operations ---

    async saveTask(task: Task): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "tasks", task.id);
            const sanitized = this.sanitizeData(task);
            await withRetry(() => setDoc(docRef, sanitized));
        } catch (error) {
            console.error(`Error saving task "${task.id}" to Firestore:`, error);
        }
    }

    async deleteTask(id: string): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "tasks", id);
            await withRetry(() => deleteDoc(docRef));
        } catch (error) {
            console.error(`Error deleting task "${id}" from Firestore:`, error);
        }
    }

    async subscribeToTasks(callback: (tasks: Task[]) => void): Promise<() => void> {
        if (!this.userId) return () => { };

        try {
            const colRef = collection(db, "users", this.userId, "tasks");
            // Order by createdAt or lastStartTime? For now just raw list, client handles sorting
            const q = query(colRef);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tasks = snapshot.docs.map(doc => doc.data() as Task);
                callback(tasks);
            }, (error) => {
                console.error("Error in tasks subscription:", error);
            });
            return unsubscribe;
        } catch (error) {
            console.error("Error setting up tasks subscription:", error);
            return () => { };
        }
    }

    async saveCategory(category: Category): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "categories", category.id);
            const sanitized = this.sanitizeData(category);
            await setDoc(docRef, sanitized);
        } catch (error) {
            console.error(`Error saving category "${category.id}" to Firestore:`, error);
        }
    }

    async deleteCategory(id: string): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "categories", id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting category "${id}" from Firestore:`, error);
        }
    }

    async savePlaylist(playlist: Playlist): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "playlists", playlist.id);
            const sanitized = this.sanitizeData(playlist);
            await setDoc(docRef, sanitized);
        } catch (error) {
            console.error(`Error saving playlist "${playlist.id}" to Firestore:`, error);
        }
    }

    async deletePlaylist(id: string): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "playlists", id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting playlist "${id}" from Firestore:`, error);
        }
    }

    async subscribeToPlaylists(callback: (playlists: Playlist[]) => void): Promise<() => void> {
        if (!this.userId) return () => { };

        try {
            const colRef = collection(db, "users", this.userId, "playlists");
            const unsubscribe = onSnapshot(colRef, (snapshot) => {
                const playlists = snapshot.docs.map(doc => doc.data() as Playlist);
                callback(playlists);
            }, (error) => {
                console.error("Error in playlists subscription:", error);
            });
            return unsubscribe;
        } catch (error) {
            console.error("Error setting up playlists subscription:", error);
            return () => { };
        }
    }

    // --- Phase 16: Time & Session Sync ---

    async saveTimeLog(log: TimeLog): Promise<void> {
        if (!this.userId) return;
        try {
            // Using a subcollection 'time_logs'
            const docRef = doc(db, "users", this.userId, "time_logs", log.id);
            const sanitized = this.sanitizeData(log);
            await setDoc(docRef, sanitized);
        } catch (error) {
            console.error(`Error saving time log "${log.id}" to Firestore:`, error);
        }
    }

    async subscribeToTimeLogs(callback: (logs: TimeLog[]) => void, limitDays: number = 30): Promise<() => void> {
        if (!this.userId) return () => { };

        try {
            const colRef = collection(db, "users", this.userId, "time_logs");

            // Limit to recent logs to save bandwidth/costs
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - limitDays);

            const q = query(
                colRef,
                where("startTime", ">=", cutoffDate.toISOString()),
                orderBy("startTime", "desc")
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const logs = snapshot.docs.map(doc => doc.data() as TimeLog);
                callback(logs);
            }, (error) => {
                console.error("Error in time_logs subscription:", error);
            });

            return unsubscribe;
        } catch (error) {
            console.error("Error setting up time_logs subscription:", error);
            return () => { };
        }
    }

    // NOTE: saveActiveSession and subscribeToActiveSession have been removed.
    // Session management is now handled exclusively by SessionService.
    // See: src/services/session/SessionService.ts

    async subscribeToUserPreferences(callback: (prefs: UserSettings | null) => void): Promise<() => void> {
        if (!this.userId) return () => { };

        try {
            const docRef = doc(db, "users", this.userId, "data", "preferences");
            // Real-time listener
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    callback(data.value as UserSettings);
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error("Error in preference subscription:", error);
            });
            return unsubscribe;
        } catch (error) {
            console.error("Error setting up preference subscription:", error);
            return () => { };
        }
    }

    async updateUserPreferences(prefs: Partial<UserSettings>): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "data", "preferences");
            const sanitized = this.sanitizeData(prefs);

            // Flatten to dot notation to ensure deep merge doesn't overwrite the 'value' object
            const updateData: any = { updatedAt: timeService.getTrustedISO() };

            // We iterate over the keys of the partial update
            for (const key of Object.keys(sanitized)) {
                updateData[`value.${key}`] = sanitized[key];
            }

            console.log(`[Firestore][${this.userId}] Updating preferences (DotNotation):`, updateData);
            // setDoc with merge: true AND deep-dot notation keys
            await setDoc(docRef, updateData, { merge: true });
            console.log(`[Firestore][${this.userId}] Update committed.`);
        } catch (error) {
            console.error("Error updating user preferences:", error);
            throw error;
        }
    }

    // --- Clock Synchronization ---

    /**
     * @deprecated Use timeService.getTrustedTime() instead
     */
    getServerTime(): number {
        return timeService.getTrustedTime();
    }

    async subscribeToSimpleTimer(callback: (data: { value: any, readTime: number } | null) => void): Promise<() => void> {
        if (!this.userId) return () => { };

        try {
            const docRef = doc(db, "users", this.userId, "data", "simple_timer_state");
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                // Safe read time extraction
                let readTime = Date.now();
                if (!docSnap.metadata.fromCache && (docSnap as any).readTime?.toMillis) {
                    readTime = (docSnap as any).readTime.toMillis();
                }

                // NOTE: Removed piggyback offset update - probe sync is sufficient
                // Piggyback was causing instability (readTime from cache/metadata unreliable)

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    callback({ value: data.value, readTime });
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error("Error in simple_timer subscription:", error);
            });
            return unsubscribe;
        } catch (error) {
            console.error("Error setting up simple_timer subscription:", error);
            return () => { };
        }
    }
}
