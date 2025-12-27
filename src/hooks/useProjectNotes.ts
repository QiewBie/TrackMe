import { useCallback } from 'react';
import { useUserStorage } from './useUserStorage';
import { ProjectNote } from '../types';

export const useProjectNotes = () => {
    const [notes, setNotes] = useUserStorage<ProjectNote[]>('project_notes', []);

    const getNote = useCallback((categoryId: string) => {
        return notes.find(n => n.categoryId === categoryId);
    }, [notes]);

    const saveNote = useCallback((categoryId: string, content: string) => {
        setNotes(prev => {
            const existing = prev.find(n => n.categoryId === categoryId);
            const now = new Date().toISOString();

            if (existing) {
                return prev.map(n => n.categoryId === categoryId
                    ? { ...n, content, updatedAt: now }
                    : n
                );
            }

            return [...prev, {
                id: crypto.randomUUID(),
                categoryId,
                content,
                updatedAt: now
            }];
        });
    }, [setNotes]);

    return {
        notes,
        getNote,
        saveNote
    };
};
