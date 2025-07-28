"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseApi = void 0;
const firestore_1 = require("./firebase/firestore");
const storage_1 = require("./firebase/storage");
const functions_1 = require("./firebase/functions");
const auth_1 = require("./firebase/auth");
const categories_1 = require("./firebase/categories");
// Firebase-based API endpoints (alternative to REST API)
exports.firebaseApi = {
    // Authentication
    auth: {
        login: async (data) => {
            const userCredential = await auth_1.FirebaseAuthService.signIn(data.email, data.password);
            return {
                user: userCredential.user,
                token: await userCredential.user.getIdToken(),
            };
        },
        register: async (data) => {
            const userCredential = await auth_1.FirebaseAuthService.signUp(data.email, data.password, data.name);
            // Create user profile in Firestore
            await firestore_1.FirestoreService.createUserProfile(userCredential.user.uid, {
                email: data.email,
                name: data.name,
                phone: data.phone,
                addresses: [],
                createdAt: new Date().toISOString(),
            });
            return userCredential.user;
        },
        logout: () => auth_1.FirebaseAuthService.signOut(),
        getCurrentUser: () => auth_1.FirebaseAuthService.getCurrentUser(),
        onAuthStateChanged: (callback) => auth_1.FirebaseAuthService.onAuthStateChanged(callback),
    },
    // Markets
    markets: {
        getMarkets: async (params) => {
            return firestore_1.FirestoreService.getMarkets(params);
        },
        getMarket: async (id) => {
            return firestore_1.FirestoreService.read('markets', id);
        },
        createMarket: async (marketData) => {
            return functions_1.FirebaseFunctionsService.createMarket(marketData);
        },
        updateMarket: async (id, data) => {
            return firestore_1.FirestoreService.update('markets', id, data);
        },
        searchMarkets: async (query, location) => {
            return functions_1.FirebaseFunctionsService.searchMarkets(query, location);
        },
        // Real-time market updates
        onMarketsChange: (callback, filters) => {
            return firestore_1.FirestoreService.onSnapshot('markets', callback, filters);
        },
    },
    // Products
    products: {
        getProducts: async (marketId, category) => {
            return firestore_1.FirestoreService.getProducts(marketId, category);
        },
        getProduct: async (id) => {
            return firestore_1.FirestoreService.read('products', id);
        },
        createProduct: async (productData) => {
            return functions_1.FirebaseFunctionsService.createProduct(productData);
        },
        updateProduct: async (id, data) => {
            return firestore_1.FirestoreService.update('products', id, data);
        },
        searchProducts: async (query, marketId) => {
            return functions_1.FirebaseFunctionsService.searchProducts(query, marketId);
        },
        // Upload product image
        uploadProductImage: async (marketId, productId, file) => {
            return storage_1.FirebaseStorageService.uploadProductImage(marketId, productId, file);
        },
    },
    // Orders
    orders: {
        getOrders: async (userId) => {
            return firestore_1.FirestoreService.getUserOrders(userId);
        },
        getOrder: async (id) => {
            return firestore_1.FirestoreService.read('orders', id);
        },
        createOrder: async (orderData) => {
            return functions_1.FirebaseFunctionsService.createOrder(orderData);
        },
        updateOrderStatus: async (id, status) => {
            return functions_1.FirebaseFunctionsService.updateOrderStatus(id, status);
        },
        cancelOrder: async (id, reason) => {
            return functions_1.FirebaseFunctionsService.cancelOrder(id, reason);
        },
        // Real-time order updates
        onOrderChange: (orderId, callback) => {
            return firestore_1.FirestoreService.onSnapshot('orders', (orders) => callback(orders[0] || null), [{ field: 'id', operator: '==', value: orderId }]);
        },
        // Calculate delivery fee
        calculateDeliveryFee: async (data) => {
            return functions_1.FirebaseFunctionsService.calculateDeliveryFee(data);
        },
    },
    // User Profile
    user: {
        getProfile: async (userId) => {
            return firestore_1.FirestoreService.getUserProfile(userId);
        },
        updateProfile: async (userId, data) => {
            return firestore_1.FirestoreService.update('users', userId, data);
        },
        uploadAvatar: async (userId, file) => {
            return storage_1.FirebaseStorageService.uploadUserAvatar(userId, file);
        },
        // Address management
        addAddress: async (userId, address) => {
            const user = await firestore_1.FirestoreService.getUserProfile(userId);
            if (user) {
                const updatedAddresses = [...user.addresses, { ...address, id: Date.now().toString() }];
                await firestore_1.FirestoreService.update('users', userId, { addresses: updatedAddresses });
                return updatedAddresses;
            }
            throw new Error('User not found');
        },
        updateAddress: async (userId, addressId, addressData) => {
            const user = await firestore_1.FirestoreService.getUserProfile(userId);
            if (user) {
                const updatedAddresses = user.addresses.map(addr => addr.id === addressId ? { ...addr, ...addressData } : addr);
                await firestore_1.FirestoreService.update('users', userId, { addresses: updatedAddresses });
                return updatedAddresses;
            }
            throw new Error('User not found');
        },
        deleteAddress: async (userId, addressId) => {
            const user = await firestore_1.FirestoreService.getUserProfile(userId);
            if (user) {
                const updatedAddresses = user.addresses.filter(addr => addr.id !== addressId);
                await firestore_1.FirestoreService.update('users', userId, { addresses: updatedAddresses });
                return updatedAddresses;
            }
            throw new Error('User not found');
        },
    },
    // Storage
    storage: {
        uploadFile: (file, path, onProgress) => {
            return storage_1.FirebaseStorageService.uploadFile(file, path, onProgress);
        },
        uploadMultipleFiles: (files, basePath) => {
            return storage_1.FirebaseStorageService.uploadMultipleFiles(files, basePath);
        },
        deleteFile: (path) => {
            return storage_1.FirebaseStorageService.deleteFile(path);
        },
        getDownloadURL: (path) => {
            return storage_1.FirebaseStorageService.getDownloadURL(path);
        },
    },
    // Functions
    functions: {
        // Payment
        processPayment: (paymentData) => {
            return functions_1.FirebaseFunctionsService.processPayment(paymentData);
        },
        // Notifications
        sendNotification: (data) => {
            return functions_1.FirebaseFunctionsService.sendNotification(data);
        },
        // Analytics
        trackEvent: (data) => {
            return functions_1.FirebaseFunctionsService.trackEvent(data);
        },
        getAnalytics: (data) => {
            return functions_1.FirebaseFunctionsService.getAnalytics(data);
        },
        // AI Features
        suggestProducts: (data) => {
            return functions_1.FirebaseFunctionsService.suggestProducts(data);
        },
        categorizeProduct: (data) => {
            return functions_1.FirebaseFunctionsService.categorizeProduct(data);
        },
        // Utility
        generateQRCode: (data) => {
            return functions_1.FirebaseFunctionsService.generateQRCode(data);
        },
        validateAddress: (address) => {
            return functions_1.FirebaseFunctionsService.validateAddress(address);
        },
    },
    // Categories
    categories: {
        getCategories: async (activeOnly = true) => {
            return categories_1.CategoryService.getCategories(activeOnly);
        },
        getCategory: async (id) => {
            return categories_1.CategoryService.getCategory(id);
        },
        createCategory: async (categoryData) => {
            return categories_1.CategoryService.createCategory(categoryData);
        },
        updateCategory: async (id, updates) => {
            return categories_1.CategoryService.updateCategory(id, updates);
        },
        deleteCategory: async (id) => {
            return categories_1.CategoryService.deleteCategory(id);
        },
        getMainCategories: async () => {
            return categories_1.CategoryService.getMainCategories();
        },
        getSubcategories: async (parentId) => {
            return categories_1.CategoryService.getSubcategories(parentId);
        },
        getCategoryTree: async () => {
            return categories_1.CategoryService.getCategoryTree();
        },
        searchCategories: async (searchTerm) => {
            return categories_1.CategoryService.searchCategories(searchTerm);
        },
        getCategoriesWithProductCount: async () => {
            return categories_1.CategoryService.getCategoriesWithProductCount();
        },
        updateCategoryOrder: async (categoryId, newOrder) => {
            return categories_1.CategoryService.updateCategoryOrder(categoryId, newOrder);
        },
        toggleCategoryStatus: async (categoryId) => {
            return categories_1.CategoryService.toggleCategoryStatus(categoryId);
        },
        initializeDefaultCategories: async () => {
            return categories_1.CategoryService.initializeDefaultCategories();
        },
        // Real-time category updates
        onCategoriesChange: (callback) => {
            return categories_1.CategoryService.onCategoriesChange(callback);
        },
    },
};
