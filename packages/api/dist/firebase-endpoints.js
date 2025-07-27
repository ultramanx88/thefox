import { FirestoreService } from './firebase/firestore';
import { FirebaseStorageService } from './firebase/storage';
import { FirebaseFunctionsService } from './firebase/functions';
import { FirebaseAuthService } from './firebase/auth';
import { CategoryService } from './firebase/categories';
// Firebase-based API endpoints (alternative to REST API)
export const firebaseApi = {
    // Authentication
    auth: {
        login: async (data) => {
            const userCredential = await FirebaseAuthService.signIn(data.email, data.password);
            return {
                user: userCredential.user,
                token: await userCredential.user.getIdToken(),
            };
        },
        register: async (data) => {
            const userCredential = await FirebaseAuthService.signUp(data.email, data.password, data.name);
            // Create user profile in Firestore
            await FirestoreService.createUserProfile(userCredential.user.uid, {
                email: data.email,
                name: data.name,
                phone: data.phone,
                addresses: [],
                createdAt: new Date().toISOString(),
            });
            return userCredential.user;
        },
        logout: () => FirebaseAuthService.signOut(),
        getCurrentUser: () => FirebaseAuthService.getCurrentUser(),
        onAuthStateChanged: (callback) => FirebaseAuthService.onAuthStateChanged(callback),
    },
    // Markets
    markets: {
        getMarkets: async (params) => {
            return FirestoreService.getMarkets(params);
        },
        getMarket: async (id) => {
            return FirestoreService.read('markets', id);
        },
        createMarket: async (marketData) => {
            return FirebaseFunctionsService.createMarket(marketData);
        },
        updateMarket: async (id, data) => {
            return FirestoreService.update('markets', id, data);
        },
        searchMarkets: async (query, location) => {
            return FirebaseFunctionsService.searchMarkets(query, location);
        },
        // Real-time market updates
        onMarketsChange: (callback, filters) => {
            return FirestoreService.onSnapshot('markets', callback, filters);
        },
    },
    // Products
    products: {
        getProducts: async (marketId, category) => {
            return FirestoreService.getProducts(marketId, category);
        },
        getProduct: async (id) => {
            return FirestoreService.read('products', id);
        },
        createProduct: async (productData) => {
            return FirebaseFunctionsService.createProduct(productData);
        },
        updateProduct: async (id, data) => {
            return FirestoreService.update('products', id, data);
        },
        searchProducts: async (query, marketId) => {
            return FirebaseFunctionsService.searchProducts(query, marketId);
        },
        // Upload product image
        uploadProductImage: async (marketId, productId, file) => {
            return FirebaseStorageService.uploadProductImage(marketId, productId, file);
        },
    },
    // Orders
    orders: {
        getOrders: async (userId) => {
            return FirestoreService.getUserOrders(userId);
        },
        getOrder: async (id) => {
            return FirestoreService.read('orders', id);
        },
        createOrder: async (orderData) => {
            return FirebaseFunctionsService.createOrder(orderData);
        },
        updateOrderStatus: async (id, status) => {
            return FirebaseFunctionsService.updateOrderStatus(id, status);
        },
        cancelOrder: async (id, reason) => {
            return FirebaseFunctionsService.cancelOrder(id, reason);
        },
        // Real-time order updates
        onOrderChange: (orderId, callback) => {
            return FirestoreService.onSnapshot('orders', (orders) => callback(orders[0] || null), [{ field: 'id', operator: '==', value: orderId }]);
        },
        // Calculate delivery fee
        calculateDeliveryFee: async (data) => {
            return FirebaseFunctionsService.calculateDeliveryFee(data);
        },
    },
    // User Profile
    user: {
        getProfile: async (userId) => {
            return FirestoreService.getUserProfile(userId);
        },
        updateProfile: async (userId, data) => {
            return FirestoreService.update('users', userId, data);
        },
        uploadAvatar: async (userId, file) => {
            return FirebaseStorageService.uploadUserAvatar(userId, file);
        },
        // Address management
        addAddress: async (userId, address) => {
            const user = await FirestoreService.getUserProfile(userId);
            if (user) {
                const updatedAddresses = [...user.addresses, { ...address, id: Date.now().toString() }];
                await FirestoreService.update('users', userId, { addresses: updatedAddresses });
                return updatedAddresses;
            }
            throw new Error('User not found');
        },
        updateAddress: async (userId, addressId, addressData) => {
            const user = await FirestoreService.getUserProfile(userId);
            if (user) {
                const updatedAddresses = user.addresses.map(addr => addr.id === addressId ? { ...addr, ...addressData } : addr);
                await FirestoreService.update('users', userId, { addresses: updatedAddresses });
                return updatedAddresses;
            }
            throw new Error('User not found');
        },
        deleteAddress: async (userId, addressId) => {
            const user = await FirestoreService.getUserProfile(userId);
            if (user) {
                const updatedAddresses = user.addresses.filter(addr => addr.id !== addressId);
                await FirestoreService.update('users', userId, { addresses: updatedAddresses });
                return updatedAddresses;
            }
            throw new Error('User not found');
        },
    },
    // Storage
    storage: {
        uploadFile: (file, path, onProgress) => {
            return FirebaseStorageService.uploadFile(file, path, onProgress);
        },
        uploadMultipleFiles: (files, basePath) => {
            return FirebaseStorageService.uploadMultipleFiles(files, basePath);
        },
        deleteFile: (path) => {
            return FirebaseStorageService.deleteFile(path);
        },
        getDownloadURL: (path) => {
            return FirebaseStorageService.getDownloadURL(path);
        },
    },
    // Functions
    functions: {
        // Payment
        processPayment: (paymentData) => {
            return FirebaseFunctionsService.processPayment(paymentData);
        },
        // Notifications
        sendNotification: (data) => {
            return FirebaseFunctionsService.sendNotification(data);
        },
        // Analytics
        trackEvent: (data) => {
            return FirebaseFunctionsService.trackEvent(data);
        },
        getAnalytics: (data) => {
            return FirebaseFunctionsService.getAnalytics(data);
        },
        // AI Features
        suggestProducts: (data) => {
            return FirebaseFunctionsService.suggestProducts(data);
        },
        categorizeProduct: (data) => {
            return FirebaseFunctionsService.categorizeProduct(data);
        },
        // Utility
        generateQRCode: (data) => {
            return FirebaseFunctionsService.generateQRCode(data);
        },
        validateAddress: (address) => {
            return FirebaseFunctionsService.validateAddress(address);
        },
    },
    // Categories
    categories: {
        getCategories: async (activeOnly = true) => {
            return CategoryService.getCategories(activeOnly);
        },
        getCategory: async (id) => {
            return CategoryService.getCategory(id);
        },
        createCategory: async (categoryData) => {
            return CategoryService.createCategory(categoryData);
        },
        updateCategory: async (id, updates) => {
            return CategoryService.updateCategory(id, updates);
        },
        deleteCategory: async (id) => {
            return CategoryService.deleteCategory(id);
        },
        getMainCategories: async () => {
            return CategoryService.getMainCategories();
        },
        getSubcategories: async (parentId) => {
            return CategoryService.getSubcategories(parentId);
        },
        getCategoryTree: async () => {
            return CategoryService.getCategoryTree();
        },
        searchCategories: async (searchTerm) => {
            return CategoryService.searchCategories(searchTerm);
        },
        getCategoriesWithProductCount: async () => {
            return CategoryService.getCategoriesWithProductCount();
        },
        updateCategoryOrder: async (categoryId, newOrder) => {
            return CategoryService.updateCategoryOrder(categoryId, newOrder);
        },
        toggleCategoryStatus: async (categoryId) => {
            return CategoryService.toggleCategoryStatus(categoryId);
        },
        initializeDefaultCategories: async () => {
            return CategoryService.initializeDefaultCategories();
        },
        // Real-time category updates
        onCategoriesChange: (callback) => {
            return CategoryService.onCategoriesChange(callback);
        },
    },
};
