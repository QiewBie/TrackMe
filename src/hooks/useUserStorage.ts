import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from './useLocalStorage';

/**
 * A wrapper around useLocalStorage that automatically prefixes the key
 * with the current user's ID to ensure data isolation.
 * 
 * @param key The base key (e.g., 'tasks', 'categories')
 * @param initialValue The initial value
 */
export function useUserStorage<T>(key: string, initialValue: T) {
    const { user } = useAuth();

    // If no user is logged in, fall back to the base key (legacy/global behavior)
    // or arguably we could require a user. For now, we support the 'no user' legacy state if needed,
    // though the app redirects to Welcome.
    const storageKey = user ? `user_${user.id}_${key}` : key;

    return useLocalStorage<T>(storageKey, initialValue);
}
