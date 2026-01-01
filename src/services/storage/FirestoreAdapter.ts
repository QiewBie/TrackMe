import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { IStorageAdapter } from "./storage";
import { Task, Category, Playlist, UserSettings } from "../../types";

export class FirestoreAdapter {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async getItem<T>(key: string): Promise<T | null> {
        if (!this.userId) return null;

        // Domain-specific check for subcollections
        if (['tasks', 'categories', 'playlists'].includes(key)) {
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
            await setDoc(docRef, { value: sanitizedValue, updatedAt: new Date().toISOString() });
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
        if (typeof data !== 'object') return data;
        if (data instanceof Date) return data.toISOString();
        if (Array.isArray(data)) return data.map(item => this.sanitizeData(item));

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
            await setDoc(docRef, sanitized);
        } catch (error) {
            console.error(`Error saving task "${task.id}" to Firestore:`, error);
        }
    }

    async deleteTask(id: string): Promise<void> {
        if (!this.userId) return;
        try {
            const docRef = doc(db, "users", this.userId, "tasks", id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting task "${id}" from Firestore:`, error);
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
            const updateData: any = { updatedAt: new Date().toISOString() };

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
}
