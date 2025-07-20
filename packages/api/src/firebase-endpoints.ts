import { FirestoreService } from './firebase/firestore';
import { FirebaseStorageService } from './firebase/storage';
import { FirebaseFunctionsService } from './firebase/functions';
import { FirebaseAuthService } from './firebase/auth';
import { CategoryService } from './firebase/categories';
import type {
  Market,
  Product,
  Order,
  User,
  Category,
  CategoryTree,
  LoginRequest,
  RegisterRequest,
} from './types';

// Firebase-based API endpoints (alternative to REST API)
export const firebaseApi = {
  // Authentication
  auth: {
    login: async (data: LoginRequest) => {
      const userCredential = await FirebaseAuthService.signIn(data.email, data.password);
      return {
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    },

    register: async (data: RegisterRequest) => {
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

    onAuthStateChanged: (callback: (user: any) => void) => 
      FirebaseAuthService.onAuthStateChanged(callback),
  },

  // Markets
  markets: {
    getMarkets: async (params?: {
      category?: string;
      isOpen?: boolean;
    }) => {
      return FirestoreService.getMarkets(params);
    },

    getMarket: async (id: string) => {
      return FirestoreService.read<Market>('markets', id);
    },

    createMarket: async (marketData: {
      name: string;
      description: string;
      address: string;
      location: { lat: number; lng: number };
      ownerId: string;
      categories: string[];
    }) => {
      return FirebaseFunctionsService.createMarket(marketData);
    },

    updateMarket: async (id: string, data: Partial<Market>) => {
      return FirestoreService.update('markets', id, data);
    },

    searchMarkets: async (query: string, location?: { lat: number; lng: number }) => {
      return FirebaseFunctionsService.searchMarkets(query, location);
    },

    // Real-time market updates
    onMarketsChange: (callback: (markets: Market[]) => void, filters?: any) => {
      return FirestoreService.onSnapshot<Market>('markets', callback, filters);
    },
  },

  // Products
  products: {
    getProducts: async (marketId: string, category?: string) => {
      return FirestoreService.getProducts(marketId, category);
    },

    getProduct: async (id: string) => {
      return FirestoreService.read<Product>('products', id);
    },

    createProduct: async (productData: Omit<Product, 'id'>) => {
      return FirebaseFunctionsService.createProduct(productData);
    },

    updateProduct: async (id: string, data: Partial<Product>) => {
      return FirestoreService.update('products', id, data);
    },

    searchProducts: async (query: string, marketId?: string) => {
      return FirebaseFunctionsService.searchProducts(query, marketId);
    },

    // Upload product image
    uploadProductImage: async (marketId: string, productId: string, file: File) => {
      return FirebaseStorageService.uploadProductImage(marketId, productId, file);
    },
  },

  // Orders
  orders: {
    getOrders: async (userId: string) => {
      return FirestoreService.getUserOrders(userId);
    },

    getOrder: async (id: string) => {
      return FirestoreService.read<Order>('orders', id);
    },

    createOrder: async (orderData: {
      marketId: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      deliveryAddress: any;
      paymentMethod: string;
    }) => {
      return FirebaseFunctionsService.createOrder(orderData);
    },

    updateOrderStatus: async (id: string, status: Order['status']) => {
      return FirebaseFunctionsService.updateOrderStatus(id, status);
    },

    cancelOrder: async (id: string, reason?: string) => {
      return FirebaseFunctionsService.cancelOrder(id, reason);
    },

    // Real-time order updates
    onOrderChange: (orderId: string, callback: (order: Order | null) => void) => {
      return FirestoreService.onSnapshot<Order>(
        'orders',
        (orders) => callback(orders[0] || null),
        [{ field: 'id', operator: '==', value: orderId }]
      );
    },

    // Calculate delivery fee
    calculateDeliveryFee: async (data: {
      marketId: string;
      deliveryAddress: { lat: number; lng: number };
      orderValue: number;
      urgencyLevel?: 'normal' | 'express' | 'urgent';
    }) => {
      return FirebaseFunctionsService.calculateDeliveryFee(data);
    },
  },

  // User Profile
  user: {
    getProfile: async (userId: string) => {
      return FirestoreService.getUserProfile(userId);
    },

    updateProfile: async (userId: string, data: Partial<User>) => {
      return FirestoreService.update('users', userId, data);
    },

    uploadAvatar: async (userId: string, file: File) => {
      return FirebaseStorageService.uploadUserAvatar(userId, file);
    },

    // Address management
    addAddress: async (userId: string, address: User['addresses'][0]) => {
      const user = await FirestoreService.getUserProfile(userId);
      if (user) {
        const updatedAddresses = [...user.addresses, { ...address, id: Date.now().toString() }];
        await FirestoreService.update('users', userId, { addresses: updatedAddresses });
        return updatedAddresses;
      }
      throw new Error('User not found');
    },

    updateAddress: async (userId: string, addressId: string, addressData: Partial<User['addresses'][0]>) => {
      const user = await FirestoreService.getUserProfile(userId);
      if (user) {
        const updatedAddresses = user.addresses.map(addr => 
          addr.id === addressId ? { ...addr, ...addressData } : addr
        );
        await FirestoreService.update('users', userId, { addresses: updatedAddresses });
        return updatedAddresses;
      }
      throw new Error('User not found');
    },

    deleteAddress: async (userId: string, addressId: string) => {
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
    uploadFile: (file: File, path: string, onProgress?: (progress: any) => void) => {
      return FirebaseStorageService.uploadFile(file, path, onProgress);
    },

    uploadMultipleFiles: (files: File[], basePath: string) => {
      return FirebaseStorageService.uploadMultipleFiles(files, basePath);
    },

    deleteFile: (path: string) => {
      return FirebaseStorageService.deleteFile(path);
    },

    getDownloadURL: (path: string) => {
      return FirebaseStorageService.getDownloadURL(path);
    },
  },

  // Functions
  functions: {
    // Payment
    processPayment: (paymentData: any) => {
      return FirebaseFunctionsService.processPayment(paymentData);
    },

    // Notifications
    sendNotification: (data: any) => {
      return FirebaseFunctionsService.sendNotification(data);
    },

    // Analytics
    trackEvent: (data: any) => {
      return FirebaseFunctionsService.trackEvent(data);
    },

    getAnalytics: (data: any) => {
      return FirebaseFunctionsService.getAnalytics(data);
    },

    // AI Features
    suggestProducts: (data: any) => {
      return FirebaseFunctionsService.suggestProducts(data);
    },

    categorizeProduct: (data: any) => {
      return FirebaseFunctionsService.categorizeProduct(data);
    },

    // Utility
    generateQRCode: (data: any) => {
      return FirebaseFunctionsService.generateQRCode(data);
    },

    validateAddress: (address: string) => {
      return FirebaseFunctionsService.validateAddress(address);
    },
  },

  // Categories
  categories: {
    getCategories: async (activeOnly: boolean = true) => {
      return CategoryService.getCategories(activeOnly);
    },

    getCategory: async (id: string) => {
      return CategoryService.getCategory(id);
    },

    createCategory: async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      return CategoryService.createCategory(categoryData);
    },

    updateCategory: async (id: string, updates: Partial<Category>) => {
      return CategoryService.updateCategory(id, updates);
    },

    deleteCategory: async (id: string) => {
      return CategoryService.deleteCategory(id);
    },

    getMainCategories: async () => {
      return CategoryService.getMainCategories();
    },

    getSubcategories: async (parentId: string) => {
      return CategoryService.getSubcategories(parentId);
    },

    getCategoryTree: async () => {
      return CategoryService.getCategoryTree();
    },

    searchCategories: async (searchTerm: string) => {
      return CategoryService.searchCategories(searchTerm);
    },

    getCategoriesWithProductCount: async () => {
      return CategoryService.getCategoriesWithProductCount();
    },

    updateCategoryOrder: async (categoryId: string, newOrder: number) => {
      return CategoryService.updateCategoryOrder(categoryId, newOrder);
    },

    toggleCategoryStatus: async (categoryId: string) => {
      return CategoryService.toggleCategoryStatus(categoryId);
    },

    initializeDefaultCategories: async () => {
      return CategoryService.initializeDefaultCategories();
    },

    // Real-time category updates
    onCategoriesChange: (callback: (categories: Category[]) => void) => {
      return CategoryService.onCategoriesChange(callback);
    },
  },
};