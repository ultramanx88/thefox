import type { Market, Product, Order, User, Category, CategoryTree, LoginRequest, RegisterRequest } from './types';
export declare const firebaseApi: {
    auth: {
        login: (data: LoginRequest) => Promise<{
            user: import("@firebase/auth").User;
            token: string;
        }>;
        register: (data: RegisterRequest) => Promise<import("@firebase/auth").User>;
        logout: () => Promise<void>;
        getCurrentUser: () => import("@firebase/auth").User;
        onAuthStateChanged: (callback: (user: any) => void) => import("@firebase/util").Unsubscribe;
    };
    markets: {
        getMarkets: (params?: {
            category?: string;
            isOpen?: boolean;
        }) => Promise<Market[]>;
        getMarket: (id: string) => Promise<Market>;
        createMarket: (marketData: {
            name: string;
            description: string;
            address: string;
            location: {
                lat: number;
                lng: number;
            };
            ownerId: string;
            categories: string[];
        }) => Promise<any>;
        updateMarket: (id: string, data: Partial<Market>) => Promise<void>;
        searchMarkets: (query: string, location?: {
            lat: number;
            lng: number;
        }) => Promise<any>;
        onMarketsChange: (callback: (markets: Market[]) => void, filters?: any) => import("@firebase/firestore").Unsubscribe;
    };
    products: {
        getProducts: (marketId: string, category?: string) => Promise<Product[]>;
        getProduct: (id: string) => Promise<Product>;
        createProduct: (productData: Omit<Product, "id">) => Promise<any>;
        updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
        searchProducts: (query: string, marketId?: string) => Promise<any>;
        uploadProductImage: (marketId: string, productId: string, file: File) => Promise<any>;
    };
    orders: {
        getOrders: (userId: string) => Promise<Order[]>;
        getOrder: (id: string) => Promise<Order>;
        createOrder: (orderData: {
            marketId: string;
            items: Array<{
                productId: string;
                quantity: number;
                price: number;
            }>;
            deliveryAddress: any;
            paymentMethod: string;
        }) => Promise<any>;
        updateOrderStatus: (id: string, status: Order["status"]) => Promise<any>;
        cancelOrder: (id: string, reason?: string) => Promise<any>;
        onOrderChange: (orderId: string, callback: (order: Order | null) => void) => import("@firebase/firestore").Unsubscribe;
        calculateDeliveryFee: (data: {
            marketId: string;
            deliveryAddress: {
                lat: number;
                lng: number;
            };
            orderValue: number;
            urgencyLevel?: "normal" | "express" | "urgent";
        }) => Promise<any>;
    };
    user: {
        getProfile: (userId: string) => Promise<User>;
        updateProfile: (userId: string, data: Partial<User>) => Promise<void>;
        uploadAvatar: (userId: string, file: File) => Promise<any>;
        addAddress: (userId: string, address: User["addresses"][0]) => Promise<import("./types").Address[]>;
        updateAddress: (userId: string, addressId: string, addressData: Partial<User["addresses"][0]>) => Promise<import("./types").Address[]>;
        deleteAddress: (userId: string, addressId: string) => Promise<import("./types").Address[]>;
    };
    storage: {
        uploadFile: (file: File, path: string, onProgress?: (progress: any) => void) => any;
        uploadMultipleFiles: (files: File[], basePath: string) => any;
        deleteFile: (path: string) => any;
        getDownloadURL: (path: string) => any;
    };
    functions: {
        processPayment: (paymentData: any) => Promise<any>;
        sendNotification: (data: any) => Promise<any>;
        trackEvent: (data: any) => Promise<any>;
        getAnalytics: (data: any) => Promise<any>;
        suggestProducts: (data: any) => Promise<any>;
        categorizeProduct: (data: any) => Promise<any>;
        generateQRCode: (data: any) => Promise<any>;
        validateAddress: (address: string) => Promise<any>;
    };
    categories: {
        getCategories: (activeOnly?: boolean) => Promise<Category[]>;
        getCategory: (id: string) => Promise<Category>;
        createCategory: (categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">) => Promise<string>;
        updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
        deleteCategory: (id: string) => Promise<void>;
        getMainCategories: () => Promise<Category[]>;
        getSubcategories: (parentId: string) => Promise<Category[]>;
        getCategoryTree: () => Promise<CategoryTree[]>;
        searchCategories: (searchTerm: string) => Promise<Category[]>;
        getCategoriesWithProductCount: () => Promise<Category[]>;
        updateCategoryOrder: (categoryId: string, newOrder: number) => Promise<void>;
        toggleCategoryStatus: (categoryId: string) => Promise<void>;
        initializeDefaultCategories: () => Promise<void>;
        onCategoriesChange: (callback: (categories: Category[]) => void) => () => void;
    };
};
