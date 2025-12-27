
import React, { createContext, useContext, ReactNode } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../types';

interface CategoryContextType {
    categories: Category[];
    setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const categoryState = useCategories();

    return (
        <CategoryContext.Provider value={categoryState}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategoryContext = () => {
    const context = useContext(CategoryContext);
    if (!context) throw new Error('useCategoryContext must be used within a CategoryProvider');
    return context;
};
