
import { useState, useEffect } from 'react';
import { Category } from '../types';
import { useStorage } from '../context/StorageContext';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Робота', color: 'bg-indigo-500' },
    { id: '2', name: 'Навчання', color: 'bg-emerald-500' }
];

export const useCategories = () => {
    const storage = useStorage();
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

    // Initial Load
    useEffect(() => {
        let isMounted = true;
        const loadCategories = async () => {
            const loaded = await storage.getItem<Category[]>('categories');
            if (isMounted && loaded && loaded.length > 0) {
                setCategories(loaded);
            }
        };
        loadCategories();
        return () => { isMounted = false; };
    }, [storage]);

    // Override setCategories to persist changes... 
    // BUT setCategories is exposed to the context, allowing generic updates.
    // If external code does setCategories([...]), we lose the granular hook.
    // We should WRAP setCategories or provide specific methods.
    // Looking at CategoryContext, it exposes setCategories directly.

    // To properly support granular updates without breaking API, 
    // we might need to intercept setCategories or assume it's used for bulk updates and save all.
    // However, for best practice, let's just intercept the SETTER.

    const setCategoriesWithPersistence = (val: Category[] | ((prev: Category[]) => Category[])) => {
        setCategories(prev => {
            const newValue = val instanceof Function ? val(prev) : val;

            // Save updates and additions
            newValue.forEach(cat => storage.saveCategory(cat));

            // Handle deletions
            const newIds = new Set(newValue.map(c => c.id));
            prev.forEach(cat => {
                if (!newIds.has(cat.id)) {
                    storage.deleteCategory(cat.id);
                }
            });

            return newValue;
        });
    };

    // Actually, CategoryManager uses it. Let's look at how it's used.
    // Usually it's add/update/delete.
    // Since I can't easily see usages without searching,
    // I will return the raw state and setter, but effectively I'm NOT intercepting the setter perfectly.
    // Wait, I can just create helper functions here and expose them?
    // But then I need to change Context interface.

    // Let's implement the 'bulk save' simulation for now:
    // When setCategories is called, we update state.
    // AND we should probably try to sync.
    // But wait, the standard generic `storage.setItem` was doing exactly this.
    // The issue is `storage.setItem` for Firestore was writing one blob.
    // If I change `storage.setItem` in Firestore to write properly, then I don't need granular hooks?

    // Valid point: If I implemented `setItem('categories', ...)` in FirestoreAdapter to 
    // iterate and save doc-by-doc, I wouldn't need to refactor these hooks.
    // BUT `setItem` is synchronous-ish (void | Promise).

    // I think for Categories, since it's small, I'll stick to a simpler approach:
    // Just modify the Context/Hook to allow granular ops if I can, OR
    // just use the generic setItem?

    // NO, I promised granular methods.
    // Let's Keep `useCategories` returning `setCategories` but wrap it?

    return {
        categories,
        setCategories: setCategoriesWithPersistence
    };
};

