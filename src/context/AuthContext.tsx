import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { authService, mapFirebaseUser } from '../services/auth/firebaseAuth';
import { auth } from '../lib/firebase';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';


// Helper type for deep partial updates
type DeepPartialUser = Partial<Omit<User, 'preferences'>> & {
    preferences?: Partial<UserSettings>
};

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: DeepPartialUser) => Promise<void>;
    deleteProfile: (userId: string) => Promise<void>;
    isGuest: boolean;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
    // 1. Optimistic Initialization
    const [user, setUser] = useState<User | null>(() => {
        const cached = localStorageAdapter.getItem<User>('user_cache');
        return cached || null;
    });

    // We are loading ONLY if we don't have a cached user AND we haven't checked Guest mode yet
    const [isLoading, setIsLoading] = useState(() => {
        const cached = localStorageAdapter.getItem<User>('user_cache');
        return !cached;
    });

    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Sync cache whenever user changes
        if (user) {
            localStorageAdapter.setItem('user_cache', user);
        } else {
            localStorageAdapter.removeItem('user_cache');
        }
    }, [user]);

    useEffect(() => {
        // Check for guest mode preference
        const guestMode = localStorageAdapter.getItem<boolean>('guest_mode');
        if (guestMode) {
            setIsGuest(true);
            if (!user) setIsLoading(false); // Stop loading if guest
        }

        const unsubscribeAuth = authService.subscribeToAuthChanges(async (firebaseUser) => {
            if (firebaseUser) {
                // 1. Get Identity (Immutable from Auth)
                const identity = mapFirebaseUser(firebaseUser);
                setIsGuest(false);
                localStorageAdapter.removeItem('guest_mode');

                // V3 DECOUPLING: AuthContext NO LONGER manages Preferences.
                // We provide a static "READ ONLY" snapshot here just in case legacy code accesses it.
                // The Real Truth™ lives in ThemeContext / PreferencesService.
                setUser({
                    ...identity,
                    preferences: { theme: 'dark', language: 'uk' } // Dummy defaults to satisfy Type
                });
                setIsLoading(false);

            } else {
                // User is signed out
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
        };
    }, []);

    // ... loginWithGoogle / logout definitions ...

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            await authService.loginWithGoogle();
        } catch (error: any) {
            if (error?.code !== 'auth/popup-closed-by-user') {
                console.error("Login failed:", error);
            }
        } finally {
            // Loading state is handled by auth subscriber
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setIsGuest(false);
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (data: DeepPartialUser) => {
        if (!auth.currentUser) return;

        try {
            // 1. Update Firebase Auth Profile (Name, Avatar)
            if (data.name || data.avatar) {
                await authService.updateProfile(auth.currentUser, {
                    name: data.name,
                    avatar: data.avatar
                });
            }

            // V3 DECOUPLING: AuthContext ignores preference updates.
            // Consumers (ThemeContext) must call PreferencesService directly.
            if (data.preferences) {
                console.warn("[AuthContext:Deprecated] updateProfile called with preferences. Ignored. Use useTheme().");
            }

            // Optimistic Update (Identity Only)
            setUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    ...data,
                    preferences: prev.preferences // Keep existing (dummy) prefs
                };
            });

        } catch (error) {
            console.error("Failed to update profile", error);
            throw error;
        }
    };

    const deleteProfile = async (userId: string) => {
        if (!auth.currentUser) return;
        // Verify we are deleting the current user for security
        if (auth.currentUser.uid !== userId) {
            console.error("Cannot delete another user");
            return;
        }

        try {
            await authService.deleteUser(auth.currentUser);
            await logout();
        } catch (error) {
            console.error("Failed to delete user", error);
            throw error;
        }
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorageAdapter.setItem('guest_mode', true);
    };

    // Derived: effective user (if guest, creates a dummy one or null)
    const effectiveUser = user || (isGuest ? {
        id: 'guest',
        name: 'Guest',
        username: 'guest.user',
        role: 'guest',
        createdAt: new Date().toISOString(),
        preferences: { theme: 'dark', language: 'uk' }
    } as User : null);

    return (
        <AuthContext.Provider value={{
            user: effectiveUser,
            isLoading,
            loginWithGoogle,
            logout,
            updateProfile,
            deleteProfile,
            isGuest,
            continueAsGuest
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
