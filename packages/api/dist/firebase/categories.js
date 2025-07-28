"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const firestore_1 = require("./firestore");
class CategoryService extends firestore_1.FirestoreService {
    // Create category
    static async createCategory(categoryData) {
        return this.create(this.collectionName, categoryData);
    }
    // Get all categories
    static async getCategories(activeOnly = true) {
        const filters = activeOnly ? [{ field: 'isActive', operator: '==', value: true }] : undefined;
        return this.query(this.collectionName, filters, 'order', 'asc');
    }
    // Get category by ID
    static async getCategory(id) {
        return this.read(this.collectionName, id);
    }
    // Update category
    static async updateCategory(id, updates) {
        return this.update(this.collectionName, id, updates);
    }
    // Delete category
    static async deleteCategory(id) {
        return this.delete(this.collectionName, id);
    }
    // Get main categories (level 0)
    static async getMainCategories() {
        return this.query(this.collectionName, [
            { field: 'level', operator: '==', value: 0 },
            { field: 'isActive', operator: '==', value: true }
        ], 'order', 'asc');
    }
    // Get subcategories by parent ID
    static async getSubcategories(parentId) {
        return this.query(this.collectionName, [
            { field: 'parentId', operator: '==', value: parentId },
            { field: 'isActive', operator: '==', value: true }
        ], 'order', 'asc');
    }
    // Get category tree (hierarchical structure)
    static async getCategoryTree() {
        const allCategories = await this.getCategories();
        // Separate main categories and subcategories
        const mainCategories = allCategories.filter(cat => cat.level === 0);
        const subcategories = allCategories.filter(cat => cat.level === 1);
        // Build tree structure
        const categoryTree = mainCategories.map(mainCat => ({
            ...mainCat,
            children: subcategories
                .filter(subCat => subCat.parentId === mainCat.id)
                .sort((a, b) => a.order - b.order)
        }));
        return categoryTree.sort((a, b) => a.order - b.order);
    }
    // Search categories
    static async searchCategories(searchTerm) {
        // Note: Firestore doesn't support full-text search natively
        // This is a simple implementation - consider using Algolia for better search
        const categories = await this.getCategories();
        const searchLower = searchTerm.toLowerCase();
        return categories.filter(category => category.name.toLowerCase().includes(searchLower) ||
            category.nameEn.toLowerCase().includes(searchLower) ||
            (category.description && category.description.toLowerCase().includes(searchLower)));
    }
    // Get categories with product count
    static async getCategoriesWithProductCount() {
        const categories = await this.getCategories();
        // Get product counts for each category
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const products = await this.query('products', [
                { field: 'category', operator: '==', value: category.id },
                { field: 'inStock', operator: '==', value: true }
            ]);
            return {
                ...category,
                productCount: products.length
            };
        }));
        return categoriesWithCount;
    }
    // Update category order
    static async updateCategoryOrder(categoryId, newOrder) {
        return this.update(this.collectionName, categoryId, { order: newOrder });
    }
    // Toggle category active status
    static async toggleCategoryStatus(categoryId) {
        const category = await this.getCategory(categoryId);
        if (category) {
            return this.update(this.collectionName, categoryId, { isActive: !category.isActive });
        }
    }
    // Real-time category updates
    static onCategoriesChange(callback) {
        return this.onSnapshot(this.collectionName, callback, [{ field: 'isActive', operator: '==', value: true }], 'order', 'asc');
    }
    // Initialize default categories
    static async initializeDefaultCategories() {
        const existingCategories = await this.getCategories(false);
        if (existingCategories.length > 0) {
            console.log('Categories already exist, skipping initialization');
            return;
        }
        const defaultCategories = [
            // Main Categories
            {
                name: 'ผักและผลไม้',
                nameEn: 'Fruits & Vegetables',
                description: 'ผักสด ผลไม้สด และผลิตภัณฑ์จากธรรมชาติ',
                icon: '🥬',
                color: '#4CAF50',
                level: 0,
                order: 1,
                isActive: true,
            },
            {
                name: 'เนื้อสัตว์และอาหารทะเล',
                nameEn: 'Meat & Seafood',
                description: 'เนื้อสด ปลา กุ้ง และอาหารทะเลสด',
                icon: '🥩',
                color: '#F44336',
                level: 0,
                order: 2,
                isActive: true,
            },
            {
                name: 'ข้าวและธัญพืช',
                nameEn: 'Rice & Grains',
                description: 'ข้าว แป้ง และธัญพืชต่างๆ',
                icon: '🌾',
                color: '#FF9800',
                level: 0,
                order: 3,
                isActive: true,
            },
            {
                name: 'เครื่องปรุงและเครื่องเทศ',
                nameEn: 'Seasonings & Spices',
                description: 'เครื่องปรุงรส เครื่องเทศ และซอสต่างๆ',
                icon: '🧂',
                color: '#795548',
                level: 0,
                order: 4,
                isActive: true,
            },
            {
                name: 'ขนมและของหวาน',
                nameEn: 'Snacks & Sweets',
                description: 'ขนม ของหวาน และเบเกอรี่',
                icon: '🍰',
                color: '#E91E63',
                level: 0,
                order: 5,
                isActive: true,
            },
            {
                name: 'เครื่องดื่ม',
                nameEn: 'Beverages',
                description: 'น้ำดื่ม น้ำผลไม้ และเครื่องดื่มต่างๆ',
                icon: '🥤',
                color: '#2196F3',
                level: 0,
                order: 6,
                isActive: true,
            },
        ];
        // Create main categories first
        const createdCategories = {};
        for (const categoryData of defaultCategories) {
            const categoryId = await this.createCategory(categoryData);
            createdCategories[categoryData.nameEn] = categoryId;
        }
        // Create subcategories
        const subcategories = [
            // Fruits & Vegetables subcategories
            {
                name: 'ผักใบเขียว',
                nameEn: 'Leafy Greens',
                description: 'ผักกาด ผักบุ้ง คะน้า',
                icon: '🥬',
                color: '#4CAF50',
                parentId: createdCategories['Fruits & Vegetables'],
                level: 1,
                order: 1,
                isActive: true,
            },
            {
                name: 'ผลไม้ตามฤดูกาล',
                nameEn: 'Seasonal Fruits',
                description: 'มะม่วง ทุเรียน มังคุด',
                icon: '🥭',
                color: '#4CAF50',
                parentId: createdCategories['Fruits & Vegetables'],
                level: 1,
                order: 2,
                isActive: true,
            },
            {
                name: 'ผักรากและหัว',
                nameEn: 'Root Vegetables',
                description: 'มันฝรั่ง หัวไชเท้า แครอท',
                icon: '🥕',
                color: '#4CAF50',
                parentId: createdCategories['Fruits & Vegetables'],
                level: 1,
                order: 3,
                isActive: true,
            },
            // Meat & Seafood subcategories
            {
                name: 'เนื้อหมู',
                nameEn: 'Pork',
                description: 'เนื้อหมูสด หมูสับ',
                icon: '🐷',
                color: '#F44336',
                parentId: createdCategories['Meat & Seafood'],
                level: 1,
                order: 1,
                isActive: true,
            },
            {
                name: 'เนื้อไก่',
                nameEn: 'Chicken',
                description: 'เนื้อไก่สด ไก่ทั้งตัว',
                icon: '🐔',
                color: '#F44336',
                parentId: createdCategories['Meat & Seafood'],
                level: 1,
                order: 2,
                isActive: true,
            },
            {
                name: 'ปลาและอาหารทะเล',
                nameEn: 'Fish & Seafood',
                description: 'ปลาสด กุ้ง หอย',
                icon: '🐟',
                color: '#F44336',
                parentId: createdCategories['Meat & Seafood'],
                level: 1,
                order: 3,
                isActive: true,
            },
            // Rice & Grains subcategories
            {
                name: 'ข้าวหอมมะลิ',
                nameEn: 'Jasmine Rice',
                description: 'ข้าวหอมมะลิคุณภาพดี',
                icon: '🍚',
                color: '#FF9800',
                parentId: createdCategories['Rice & Grains'],
                level: 1,
                order: 1,
                isActive: true,
            },
            {
                name: 'แป้งและผงต่างๆ',
                nameEn: 'Flour & Powder',
                description: 'แป้งสาลี แป้งข้าวเจ้า',
                icon: '🌾',
                color: '#FF9800',
                parentId: createdCategories['Rice & Grains'],
                level: 1,
                order: 2,
                isActive: true,
            },
        ];
        // Create subcategories
        for (const subcategoryData of subcategories) {
            await this.createCategory(subcategoryData);
        }
        console.log('Default categories initialized successfully');
    }
}
exports.CategoryService = CategoryService;
CategoryService.collectionName = 'categories';
