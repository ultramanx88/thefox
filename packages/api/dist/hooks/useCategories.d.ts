import type { Category, CategoryTree } from '../types';
export interface CategoriesState {
    categories: Category[];
    loading: boolean;
    error: string | null;
}
export declare function useCategories(activeOnly?: boolean, realtime?: boolean): {
    refetch: () => Promise<void>;
    categories: Category[];
    loading: boolean;
    error: string | null;
};
export declare function useCategoryTree(): {
    refetch: () => Promise<void>;
    categoryTree: CategoryTree[];
    loading: boolean;
    error: string | null;
};
export declare function useMainCategories(): {
    refetch: () => Promise<void>;
    categories: Category[];
    loading: boolean;
    error: string | null;
};
export declare function useSubcategories(parentId: string | null): {
    refetch: () => Promise<void>;
    categories: Category[];
    loading: boolean;
    error: string | null;
};
export declare function useCategoriesWithProductCount(): {
    refetch: () => Promise<void>;
    categories: Category[];
    loading: boolean;
    error: string | null;
};
export declare function useCategorySearch(): {
    searchCategories: (searchTerm: string) => Promise<void>;
    clearSearch: () => void;
    categories: Category[];
    loading: boolean;
    error: string | null;
    searchTerm: string;
};
