import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from './config';

export class FirebaseFunctionsService {
  // Generic function caller
  static async callFunction<T = any, R = any>(functionName: string, data?: T): Promise<R> {
    try {
      const callable = httpsCallable<T, R>(functions, functionName);
      const result: HttpsCallableResult<R> = await callable(data);
      return result.data;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }

  // Order management functions
  static async createOrder(orderData: {
    marketId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    deliveryAddress: any;
    paymentMethod: string;
  }) {
    return this.callFunction('createOrder', orderData);
  }

  static async updateOrderStatus(orderId: string, status: string) {
    return this.callFunction('updateOrderStatus', { orderId, status });
  }

  static async cancelOrder(orderId: string, reason?: string) {
    return this.callFunction('cancelOrder', { orderId, reason });
  }

  // Payment functions
  static async processPayment(paymentData: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    paymentDetails: any;
  }) {
    return this.callFunction('processPayment', paymentData);
  }

  static async refundPayment(orderId: string, amount?: number, reason?: string) {
    return this.callFunction('refundPayment', { orderId, amount, reason });
  }

  // Delivery functions
  static async assignDelivery(orderId: string, driverId?: string) {
    return this.callFunction('assignDelivery', { orderId, driverId });
  }

  static async updateDeliveryStatus(orderId: string, status: string, location?: { lat: number; lng: number }) {
    return this.callFunction('updateDeliveryStatus', { orderId, status, location });
  }

  static async calculateDeliveryFee(data: {
    marketId: string;
    deliveryAddress: { lat: number; lng: number };
    orderValue: number;
    urgencyLevel?: 'normal' | 'express' | 'urgent';
  }) {
    return this.callFunction('calculateDeliveryFee', data);
  }

  // Notification functions
  static async sendNotification(data: {
    userId: string;
    title: string;
    body: string;
    data?: any;
    type?: 'order' | 'delivery' | 'promotion' | 'system';
  }) {
    return this.callFunction('sendNotification', data);
  }

  static async sendBulkNotification(data: {
    userIds: string[];
    title: string;
    body: string;
    data?: any;
    type?: 'order' | 'delivery' | 'promotion' | 'system';
  }) {
    return this.callFunction('sendBulkNotification', data);
  }

  // Analytics functions
  static async trackEvent(data: {
    userId?: string;
    event: string;
    properties?: any;
    timestamp?: number;
  }) {
    return this.callFunction('trackEvent', data);
  }

  static async getAnalytics(data: {
    type: 'orders' | 'users' | 'revenue' | 'products';
    startDate: string;
    endDate: string;
    filters?: any;
  }) {
    return this.callFunction('getAnalytics', data);
  }

  // User management functions
  static async createUserProfile(userData: {
    uid: string;
    email: string;
    name: string;
    phone?: string;
    role?: 'customer' | 'vendor' | 'driver' | 'admin';
  }) {
    return this.callFunction('createUserProfile', userData);
  }

  static async updateUserProfile(userId: string, updates: any) {
    return this.callFunction('updateUserProfile', { userId, updates });
  }

  static async deleteUserAccount(userId: string) {
    return this.callFunction('deleteUserAccount', { userId });
  }

  // Market/Vendor functions
  static async createMarket(marketData: {
    name: string;
    description: string;
    address: string;
    location: { lat: number; lng: number };
    ownerId: string;
    categories: string[];
  }) {
    return this.callFunction('createMarket', marketData);
  }

  static async updateMarketStatus(marketId: string, isOpen: boolean) {
    return this.callFunction('updateMarketStatus', { marketId, isOpen });
  }

  // Product management functions
  static async createProduct(productData: {
    marketId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    inStock: boolean;
  }) {
    return this.callFunction('createProduct', productData);
  }

  static async updateProductStock(productId: string, inStock: boolean, quantity?: number) {
    return this.callFunction('updateProductStock', { productId, inStock, quantity });
  }

  // Search functions
  static async searchMarkets(query: string, location?: { lat: number; lng: number }, radius?: number) {
    return this.callFunction('searchMarkets', { query, location, radius });
  }

  static async searchProducts(query: string, marketId?: string, category?: string) {
    return this.callFunction('searchProducts', { query, marketId, category });
  }

  // AI-powered functions
  static async suggestProducts(data: {
    userId: string;
    location?: { lat: number; lng: number };
    preferences?: string[];
    orderHistory?: string[];
  }) {
    return this.callFunction('suggestProducts', data);
  }

  static async categorizeProduct(data: {
    name: string;
    description: string;
    imageUrl?: string;
  }) {
    return this.callFunction('categorizeProduct', data);
  }

  static async calculateOptimalPricing(data: {
    productId: string;
    marketConditions: any;
    competitorPrices: number[];
  }) {
    return this.callFunction('calculateOptimalPricing', data);
  }

  // Utility functions
  static async generateQRCode(data: { type: 'product' | 'market' | 'order'; id: string }) {
    return this.callFunction('generateQRCode', data);
  }

  static async validateAddress(address: string) {
    return this.callFunction('validateAddress', { address });
  }

  static async geocodeAddress(address: string) {
    return this.callFunction('geocodeAddress', { address });
  }

  // Admin functions
  static async getSystemStats() {
    return this.callFunction('getSystemStats');
  }

  static async moderateContent(data: {
    type: 'product' | 'market' | 'review';
    id: string;
    content: string;
  }) {
    return this.callFunction('moderateContent', data);
  }

  static async generateReport(data: {
    type: 'sales' | 'users' | 'orders' | 'revenue';
    period: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
  }) {
    return this.callFunction('generateReport', data);
  }
}