import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore';
import { UserSettings } from '../../types';

export const DEFAULT_PREFERENCES: UserSettings = {
    theme: 'dark',
    themeId: 'default',
    language: 'uk',
    soundEnabled: true,
    autoStartBreaks: false
};

export const PreferencesService = {
    /**
     * Subscribe to real-time updates of user preferences.
     * Implements "Priority Read" logic:
     * 1. Checks for Flat Data (V3 Schema)
     * 2. Checks for Legacy Data (V2 "value" wrapper)
     * 3. Falls back to Defaults
     */
    subscribe: (userId: string, callback: (prefs: UserSettings) => void) => {
        if (!userId) return () => { };

        const ref = doc(db, 'users', userId, 'data', 'preferences');



        const unsubscribe = onSnapshot(ref, (snap) => {
            if (!snap.exists()) {
                // console.log('[PreferencesService] Document missing. Using Defaults.');
                callback(DEFAULT_PREFERENCES);
                return;
            }

            const data = snap.data();

            // PRIORITY 1: Flat V3 Data
            // We check if 'themeId' exists at the top level.
            if (data.themeId !== undefined) {
                callback(data as UserSettings);
                return;
            }

            // PRIORITY 2: Legacy V2 "Value" Wrapper
            if (data.value && typeof data.value === 'object') {
                // console.log('[PreferencesService] Detected V2 Legacy Schema (Wrapped).');
                // Merge with defaults to ensure missing fields don't crash UI
                const merged = { ...DEFAULT_PREFERENCES, ...data.value };
                callback(merged);
                return;
            }

            // PRIORITY 3: Fallback
            console.warn('[PreferencesService] Unknown schema. Fallback to defaults.');
            callback(DEFAULT_PREFERENCES);

        }, (error) => {
            // Ignore termination errors (happens during "Reset Cache" or Logout race conditions)
            if (error.message.includes('client has already been terminated')) {
                console.warn('[PreferencesService] Firestore terminated. Stopping sync.');
                return;
            }
            console.error('[PreferencesService] Snapshot Error:', error);
            // On error, we don't crash, we just stop updating.
            // UI usually keeps last known state or local default.
        });

        return unsubscribe;
    },

    /**
     * Update user preferences.
     * Implements "Safe Migration" logic:
     * 1. Reads current state to catch any legacy data in 'value'.
     * 2. Merges Legacy Data + Existing Flat Data + New Updates.
     * 3. Writes the FULL merged result to the top level.
     * 4. Deletes the 'value' wrapper.
     */
    update: async (userId: string, updates: Partial<UserSettings>) => {
        if (!userId) throw new Error("Cannot update preferences: No User ID");

        const ref = doc(db, 'users', userId, 'data', 'preferences');
        const { runTransaction } = await import('firebase/firestore');

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(ref);

                if (!docSnap.exists()) {
                    // New doc: Just write what we have
                    transaction.set(ref, {
                        ...DEFAULT_PREFERENCES,
                        ...updates,
                        updatedAt: new Date().toISOString()
                    });
                    return;
                }

                const data = docSnap.data();

                // 1. Extract Legacy Data (if any)
                const legacyData = (data.value && typeof data.value === 'object') ? data.value : {};

                // 2. Extract Flat Data (excl. value)
                const { value: _, ...flatData } = data;

                // 3. Prepare Final Payload
                // Begin with Defaults -> Override with Legacy -> Override with Flat -> Override with New Updates
                const finalPayload = {
                    ...DEFAULT_PREFERENCES,
                    ...legacyData,
                    ...flatData,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                // 4. Write & Nuke Legacy Wrapper
                transaction.set(ref, {
                    ...finalPayload,
                    value: deleteField()
                }, { merge: true });

                // console.log('[PreferencesService] Transaction Match: Migrated & Saved.');
            });

        } catch (error) {
            console.error('[PreferencesService] Transaction Failed:', error);
            throw error;
        }
    }
};
