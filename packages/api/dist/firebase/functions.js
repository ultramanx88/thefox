"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseFunctionsService = void 0;
const functions_1 = require("firebase/functions");
const config_1 = require("./config");
class FirebaseFunctionsService {
    // Generic function caller
    static async callFunction(functionName, data) {
        try {
            const callable = (0, functions_1.httpsCallable)(config_1.functions, functionName);
            const result = await callable(data);
            return result.data;
        }
        catch (error) {
            console.error(`Error calling function ${functionName}:`, error);
            throw error;
        }
    }
    // Order management functions
    static async createOrder(orderData) {
        return this.callFunction('createOrder', orderData);
    }
    static async updateOrderStatus(orderId, status) {
        return this.callFunction('updateOrderStatus', { orderId, status });
    }
    static async cancelOrder(orderId, reason) {
        return this.callFunction('cancelOrder', { orderId, reason });
    }
    // Payment functions
    static async processPayment(paymentData) {
        return this.callFunction('processPayment', paymentData);
    }
    static async refundPayment(orderId, amount, reason) {
        return this.callFunction('refundPayment', { orderId, amount, reason });
    }
    // Delivery functions
    static async assignDelivery(orderId, driverId) {
        return this.callFunction('assignDelivery', { orderId, driverId });
    }
    static async updateDeliveryStatus(orderId, status, location) {
        return this.callFunction('updateDeliveryStatus', { orderId, status, location });
    }
    static async calculateDeliveryFee(data) {
        return this.callFunction('calculateDeliveryFee', data);
    }
    // Notification functions
    static async sendNotification(data) {
        return this.callFunction('sendNotification', data);
    }
    static async sendBulkNotification(data) {
        return this.callFunction('sendBulkNotification', data);
    }
    // Analytics functions
    static async trackEvent(data) {
        return this.callFunction('trackEvent', data);
    }
    static async getAnalytics(data) {
        return this.callFunction('getAnalytics', data);
    }
    // User management functions
    static async createUserProfile(userData) {
        return this.callFunction('createUserProfile', userData);
    }
    static async updateUserProfile(userId, updates) {
        return this.callFunction('updateUserProfile', { userId, updates });
    }
    static async deleteUserAccount(userId) {
        return this.callFunction('deleteUserAccount', { userId });
    }
    // Authentication functions
    static async createUserWithRole(userData) {
        return this.callFunction('createUserWithRole', userData);
    }
    static async setCustomClaims(userId, claims) {
        return this.callFunction('setCustomClaims', { userId, claims });
    }
    static async verifyUserRole(userId, requiredRole) {
        return this.callFunction('verifyUserRole', { userId, requiredRole });
    }
    static async updateUserStatus(userId, status, reason) {
        return this.callFunction('updateUserStatus', { userId, status, reason });
    }
    static async sendEmailVerification(userId) {
        return this.callFunction('sendEmailVerification', { userId });
    }
    static async verifyEmailToken(token) {
        return this.callFunction('verifyEmailToken', { token });
    }
    // Market/Vendor functions
    static async createMarket(marketData) {
        return this.callFunction('createMarket', marketData);
    }
    static async updateMarketStatus(marketId, isOpen) {
        return this.callFunction('updateMarketStatus', { marketId, isOpen });
    }
    // Product management functions
    static async createProduct(productData) {
        return this.callFunction('createProduct', productData);
    }
    static async updateProductStock(productId, inStock, quantity) {
        return this.callFunction('updateProductStock', { productId, inStock, quantity });
    }
    // Search functions
    static async searchMarkets(query, location, radius) {
        return this.callFunction('searchMarkets', { query, location, radius });
    }
    static async searchProducts(query, marketId, category) {
        return this.callFunction('searchProducts', { query, marketId, category });
    }
    // AI-powered functions
    static async suggestProducts(data) {
        return this.callFunction('suggestProducts', data);
    }
    static async categorizeProduct(data) {
        return this.callFunction('categorizeProduct', data);
    }
    static async calculateOptimalPricing(data) {
        return this.callFunction('calculateOptimalPricing', data);
    }
    // Utility functions
    static async generateQRCode(data) {
        return this.callFunction('generateQRCode', data);
    }
    static async validateAddress(address) {
        return this.callFunction('validateAddress', { address });
    }
    static async geocodeAddress(address) {
        return this.callFunction('geocodeAddress', { address });
    }
    // Admin functions
    static async getSystemStats() {
        return this.callFunction('getSystemStats');
    }
    static async moderateContent(data) {
        return this.callFunction('moderateContent', data);
    }
    static async generateReport(data) {
        return this.callFunction('generateReport', data);
    }
}
exports.FirebaseFunctionsService = FirebaseFunctionsService;
