import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, mapFirebaseUser } from '../services/auth/firebaseAuth';
import { auth } from '../lib/firebase';
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    deleteProfile: (userId: string) => Promise<void>;
    isGuest: boolean;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Check for guest mode preference
        const guestMode = localStorageAdapter.getItem<boolean>('guest_mode');
        if (guestMode) setIsGuest(true);

        const unsubscribe = authService.subscribeToAuthChanges((firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                const appUser = mapFirebaseUser(firebaseUser);
                setUser(appUser);
                setIsGuest(false); // Clear guest mode if logged in
                localStorageAdapter.removeItem('guest_mode');
            } else {
                // User is signed out
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            await authService.loginWithGoogle();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
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

    const updateProfile = async (data: Partial<User>) => {
        if (!auth.currentUser) return;

        try {
            // Update Firebase Auth Profile (Name, Avatar)
            await authService.updateProfile(auth.currentUser, {
                name: data.name,
                avatar: data.avatar
            });

            // Optimistically update local state
            setUser(prev => prev ? ({ ...prev, ...data }) : null);

            // TODO: In Phase 8, we will also update the User document in Firestore here
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
