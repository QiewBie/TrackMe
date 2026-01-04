import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimeLedger } from '../services/storage/TimeLedger';

export const useCloudSync = () => {
    const { user } = useAuth();
    const initializedUserId = useRef<string | null>(null);

    useEffect(() => {
        if (user) {
            // User Logged In
            if (initializedUserId.current !== user.id) {
                // Initialize TimeLedger (Sync + Migration + Queue)
                TimeLedger.initialize(user.id);
                initializedUserId.current = user.id;
            }
        } else {
            // User Logged Out (or Guest)
            if (initializedUserId.current) {
                TimeLedger.reset();
                initializedUserId.current = null;
            }
        }
    }, [user]);

    // Note: guest mode handled by TimeLedger just idling (no ID init)
    // or we could explicitly init guest mode if needed, but TimeLedger is Local-First by default.
};
