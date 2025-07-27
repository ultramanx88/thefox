import { FirestoreService } from './firestore';
import type { Category, CategoryTree } from '../types';
export declare class CategoryService extends FirestoreService {
    private static collectionName;
    static createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    static getCategories(activeOnly?: boolean): Promise<Category[]>;
    static getCategory(id: string): Promise<Category | null>;
    static updateCategory(id: string, updates: Partial<Category>): Promise<void>;
    static deleteCategory(id: string): Promise<void>;
    static getMainCategories(): Promise<Category[]>;
    static getSubcategories(parentId: string): Promise<Category[]>;
    static getCategoryTree(): Promise<CategoryTree[]>;
    static searchCategories(searchTerm: string): Promise<Category[]>;
    static getCategoriesWithProductCount(): Promise<Category[]>;
    static updateCategoryOrder(categoryId: string, newOrder: number): Promise<void>;
    static toggleCategoryStatus(categoryId: string): Promise<void>;
    static onCategoriesChange(callback: (categories: Category[]) => void): () => void;
    static initializeDefaultCategories(): Promise<void>;
}
