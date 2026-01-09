/**
 * Safe localStorage wrapper with quota handling
 */

export const safeStorage = {
    /**
     * Set item with quota handling
     * Returns true if successful, false if quota exceeded
     */
    setItem: (key: string, value: string): boolean => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (e instanceof DOMException &&
                (e.name === 'QuotaExceededError' || e.code === 22)) {
                console.warn('[Storage] Quota exceeded, attempting cleanup');

                // Try to clear non-critical data
                const nonCriticalKeys = [
                    'version_manager_max_versions',
                    'time_tracker_pending_uploads',
                    'focus_settings_cache'
                ];

                for (const oldKey of nonCriticalKeys) {
                    try {
                        localStorage.removeItem(oldKey);
                    } catch { /* ignore */ }
                }

                // Retry write
                try {
                    localStorage.setItem(key, value);
                    return true;
                } catch {
                    console.error('[Storage] Still over quota after cleanup');
                    return false;
                }
            }

            console.error('[Storage] Write failed:', e);
            return false;
        }
    },

    /**
     * Get item safely
     */
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('[Storage] Read failed:', e);
            return null;
        }
    },

    /**
     * Remove item safely
     */
    removeItem: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('[Storage] Remove failed:', e);
            return false;
        }
    },

    /**
     * Get approximate storage usage in bytes
     */
    getUsage: (): number => {
        let total = 0;
        try {
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
                }
            }
        } catch { /* ignore */ }
        return total;
    }
};
