import {
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    User as FirebaseUser,
    onAuthStateChanged,
    updateProfile,
    deleteUser
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { User } from "../../types/models";

// Map Firebase User to App User
export const mapFirebaseUser = (fbUser: FirebaseUser): User => ({
    id: fbUser.uid,
    name: fbUser.displayName || 'Anonymous',
    username: fbUser.email?.split('@')[0] || 'user',
    role: 'user',
    avatar: fbUser.photoURL || undefined,
    createdAt: new Date().toISOString(),
    preferences: {
        theme: 'dark', // Default preference
        language: 'uk'
    }
});

export const authService = {
    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
            throw error;
        }
    },

    subscribeToAuthChanges: (callback: (user: FirebaseUser | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },

    updateProfile: async (user: FirebaseUser, data: { name?: string; avatar?: string }) => {
        try {
            await updateProfile(user, {
                displayName: data.name,
                photoURL: data.avatar
            });
        } catch (error) {
            console.error("Profile update failed", error);
            throw error;
        }
    },

    deleteUser: async (user: FirebaseUser) => {
        try {
            await deleteUser(user);
        } catch (error) {
            console.error("User deletion failed", error);
            throw error;
        }
    }
};
