export declare class FirebaseFunctionsService {
    static callFunction<T = any, R = any>(functionName: string, data?: T): Promise<R>;
    static createOrder(orderData: {
        marketId: string;
        items: Array<{
            productId: string;
            quantity: number;
            price: number;
        }>;
        deliveryAddress: any;
        paymentMethod: string;
    }): Promise<any>;
    static updateOrderStatus(orderId: string, status: string): Promise<any>;
    static cancelOrder(orderId: string, reason?: string): Promise<any>;
    static processPayment(paymentData: {
        orderId: string;
        amount: number;
        paymentMethod: string;
        paymentDetails: any;
    }): Promise<any>;
    static refundPayment(orderId: string, amount?: number, reason?: string): Promise<any>;
    static assignDelivery(orderId: string, driverId?: string): Promise<any>;
    static updateDeliveryStatus(orderId: string, status: string, location?: {
        lat: number;
        lng: number;
    }): Promise<any>;
    static calculateDeliveryFee(data: {
        marketId: string;
        deliveryAddress: {
            lat: number;
            lng: number;
        };
        orderValue: number;
        urgencyLevel?: 'normal' | 'express' | 'urgent';
    }): Promise<any>;
    static sendNotification(data: {
        userId: string;
        title: string;
        body: string;
        data?: any;
        type?: 'order' | 'delivery' | 'promotion' | 'system';
    }): Promise<any>;
    static sendBulkNotification(data: {
        userIds: string[];
        title: string;
        body: string;
        data?: any;
        type?: 'order' | 'delivery' | 'promotion' | 'system';
    }): Promise<any>;
    static trackEvent(data: {
        userId?: string;
        event: string;
        properties?: any;
        timestamp?: number;
    }): Promise<any>;
    static getAnalytics(data: {
        type: 'orders' | 'users' | 'revenue' | 'products';
        startDate: string;
        endDate: string;
        filters?: any;
    }): Promise<any>;
    static createUserProfile(userData: {
        uid: string;
        email: string;
        name: string;
        phone?: string;
        role?: 'customer' | 'vendor' | 'driver' | 'admin';
    }): Promise<any>;
    static updateUserProfile(userId: string, updates: any): Promise<any>;
    static deleteUserAccount(userId: string): Promise<any>;
    static createMarket(marketData: {
        name: string;
        description: string;
        address: string;
        location: {
            lat: number;
            lng: number;
        };
        ownerId: string;
        categories: string[];
    }): Promise<any>;
    static updateMarketStatus(marketId: string, isOpen: boolean): Promise<any>;
    static createProduct(productData: {
        marketId: string;
        name: string;
        description: string;
        price: number;
        category: string;
        imageUrl?: string;
        inStock: boolean;
    }): Promise<any>;
    static updateProductStock(productId: string, inStock: boolean, quantity?: number): Promise<any>;
    static searchMarkets(query: string, location?: {
        lat: number;
        lng: number;
    }, radius?: number): Promise<any>;
    static searchProducts(query: string, marketId?: string, category?: string): Promise<any>;
    static suggestProducts(data: {
        userId: string;
        location?: {
            lat: number;
            lng: number;
        };
        preferences?: string[];
        orderHistory?: string[];
    }): Promise<any>;
    static categorizeProduct(data: {
        name: string;
        description: string;
        imageUrl?: string;
    }): Promise<any>;
    static calculateOptimalPricing(data: {
        productId: string;
        marketConditions: any;
        competitorPrices: number[];
    }): Promise<any>;
    static generateQRCode(data: {
        type: 'product' | 'market' | 'order';
        id: string;
    }): Promise<any>;
    static validateAddress(address: string): Promise<any>;
    static geocodeAddress(address: string): Promise<any>;
    static getSystemStats(): Promise<any>;
    static moderateContent(data: {
        type: 'product' | 'market' | 'review';
        id: string;
        content: string;
    }): Promise<any>;
    static generateReport(data: {
        type: 'sales' | 'users' | 'orders' | 'revenue';
        period: 'daily' | 'weekly' | 'monthly';
        startDate: string;
        endDate: string;
    }): Promise<any>;
}
