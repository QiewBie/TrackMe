import { useState, useCallback } from 'react';

export const useConfirmation = <T>(onConfirmAction: (item: T) => void) => {
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);

    const requestDelete = useCallback((item: T) => {
        setItemToDelete(item);
    }, []);

    const cancelDelete = useCallback(() => {
        setItemToDelete(null);
    }, []);

    const confirmDelete = useCallback(() => {
        if (itemToDelete) {
            onConfirmAction(itemToDelete);
            setItemToDelete(null);
        }
    }, [itemToDelete, onConfirmAction]);

    return {
        itemToDelete,
        requestDelete,
        cancelDelete,
        confirmDelete,
        isOpen: !!itemToDelete
    };
};
