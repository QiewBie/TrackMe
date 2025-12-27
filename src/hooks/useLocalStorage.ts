import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../context/StorageContext';

/**
 * Hook to manage state synchronized with storage (via adapter).
 * @param key The key to store data under.
 * @param initialValue The initial value if no data exists.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const adapter = useStorage();

    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Initial load and sync on key/adapter change
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const item = await adapter.getItem<T>(key);
                if (key.includes('notes')) console.log(`[Storage] LOAD key="${key}":`, item);
                if (isMounted) {
                    if (item !== null) {
                        setStoredValue(item);
                    } else {
                        setStoredValue(initialValue);
                    }
                }
            } catch (error) {
                console.error("Error loading from storage:", error);
                if (isMounted) setStoredValue(initialValue);
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [key, adapter]); // Re-run if key or adapter changes (e.g. login/logout)

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to storage.
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        // Allow value to be a function so we have same API as useState
        setStoredValue((oldValue) => {
            const valueToStore = value instanceof Function ? value(oldValue) : value;

            // Save to storage
            // We don't await here to keep the setter synchronous in UI terms
            try {
                // Fire and forget, but catch errors
                Promise.resolve(adapter.setItem(key, valueToStore)).catch(err =>
                    console.error("Error saving to storage:", err)
                );
            } catch (error) {
                console.error("Error initiating save:", error);
            }

            return valueToStore;
        });
    }, [key, adapter]);

    return [storedValue, setValue] as const;
}
