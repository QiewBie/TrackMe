import React, { createContext, useContext, useMemo } from 'react';
import { IStorageAdapter } from '../services/storage/storage';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { FirestoreAdapter } from '../services/storage/FirestoreAdapter';
import { useAuth } from './AuthContext';

interface StorageContextType {
    adapter: IStorageAdapter;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isGuest } = useAuth();

    const adapter = useMemo(() => {
        if (isGuest || !user) {
            return new LocalStorageAdapter(user?.id);
        }
        return new FirestoreAdapter(user.id);
    }, [user, isGuest]);

    return (
        <StorageContext.Provider value={{ adapter }}>
            {children}
        </StorageContext.Provider>
    );
};

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context.adapter;
};
