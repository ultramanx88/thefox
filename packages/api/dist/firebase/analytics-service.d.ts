/**
 * Comprehensive Firebase Analytics and Business Metrics Service
 * Handles event tracking, custom analytics, and business intelligence
 */
export interface AnalyticsEvent {
    name: string;
    parameters?: Record<string, any>;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
    userProperties?: Record<string, any>;
}
export interface BusinessMetric {
    id: string;
    name: string;
    value: number;
    unit: 'count' | 'currency' | 'percentage' | 'time' | 'bytes';
    category: 'sales' | 'users' | 'orders' | 'products' | 'delivery' | 'engagement';
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface UserAnalytics {
    userId: string;
    userRole: 'customer' | 'vendor' | 'driver' | 'admin';
    registrationDate: Date;
    lastActiveDate: Date;
    totalSessions: number;
    totalOrdersPlaced?: number;
    totalOrdersDelivered?: number;
    totalRevenue?: number;
    averageOrderValue?: number;
    favoriteCategories?: string[];
    deviceInfo?: {
        platform: string;
        browser?: string;
        os?: string;
        screenResolution?: string;
    };
}
export interface SalesAnalytics {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{
        productId: string;
        name: string;
        sales: number;
        revenue: number;
    }>;
    topMarkets: Array<{
        marketId: string;
        name: string;
        orders: number;
        revenue: number;
    }>;
    customerSegments: Array<{
        segment: string;
        count: number;
        revenue: number;
    }>;
}
export interface AnalyticsConfig {
    enableFirebaseAnalytics: boolean;
    enableCustomAnalytics: boolean;
    enableBusinessMetrics: boolean;
    enableUserTracking: boolean;
    enableConversionTracking: boolean;
    dataRetentionDays: number;
    privacyMode: boolean;
    allowedEvents: string[];
    blockedEvents: string[];
}
export declare class FirebaseAnalyticsService {
    private static instance;
    private analytics;
    private config;
    private eventBuffer;
    private businessMetrics;
    private userAnalytics;
    private sessionId;
    private isInitialized;
    private constructor();
    static getInstance(): FirebaseAnalyticsService;
    private initializeAnalytics;
    /**
     * Track custom event
     */
    trackEvent(eventName: string, parameters?: Record<string, any>, userId?: string): void;
    /**
     * Track user action
     */
    trackUserAction(action: string, category: string, label?: string, value?: number, userId?: string): void;
    /**
     * Track page view
     */
    trackPageView(pageName: string, pageTitle?: string, userId?: string): void;
    /**
     * Track conversion event
     */
    trackConversion(conversionType: 'purchase' | 'signup' | 'subscription' | 'lead', value?: number, currency?: string, userId?: string, metadata?: Record<string, any>): void;
    /**
     * Record business metric
     */
    recordBusinessMetric(metric: Omit<BusinessMetric, 'id' | 'timestamp'>): void;
    /**
     * Track order metrics
     */
    trackOrderMetrics(orderData: {
        orderId: string;
        userId: string;
        marketId: string;
        totalAmount: number;
        itemCount: number;
        deliveryFee: number;
        paymentMethod: string;
        orderStatus: string;
    }): void;
    /**
     * Track user engagement metrics
     */
    trackUserEngagement(userId: string, engagementData: {
        sessionDuration: number;
        pagesViewed: number;
        actionsPerformed: number;
        timeOnPage: Record<string, number>;
    }): void;
    /**
     * Set user properties
     */
    setUserProperties(userId: string, properties: Record<string, any>): void;
    /**
     * Track user lifecycle events
     */
    trackUserLifecycle(userId: string, event: 'registration' | 'first_purchase' | 'subscription' | 'churn', metadata?: Record<string, any>): void;
    /**
     * Generate sales analytics report
     */
    generateSalesReport(period: SalesAnalytics['period'], startDate: Date, endDate: Date): SalesAnalytics;
    /**
     * Generate user analytics report
     */
    generateUserReport(startDate: Date, endDate: Date): {
        totalUsers: number;
        activeUsers: number;
        newUsers: number;
        usersByRole: Record<string, number>;
        topUsersByRevenue: UserAnalytics[];
        engagementMetrics: {
            averageSessionDuration: number;
            averagePagesPerSession: number;
            bounceRate: number;
        };
    };
    /**
     * Generate comprehensive analytics dashboard data
     */
    generateDashboardData(): {
        overview: {
            totalRevenue: number;
            totalOrders: number;
            totalUsers: number;
            averageOrderValue: number;
        };
        trends: {
            revenueGrowth: number;
            orderGrowth: number;
            userGrowth: number;
        };
        topMetrics: BusinessMetric[];
        recentEvents: AnalyticsEvent[];
    };
    /**
     * Export analytics data for compliance
     */
    exportAnalyticsData(startDate: Date, endDate: Date, format?: 'json' | 'csv'): {
        events: AnalyticsEvent[];
        metrics: BusinessMetric[];
        users: UserAnalytics[];
        metadata: {
            exportDate: Date;
            period: {
                startDate: Date;
                endDate: Date;
            };
            totalRecords: number;
        };
    };
    /**
     * Export user data for GDPR compliance
     */
    exportUserData(userId: string): {
        userAnalytics: UserAnalytics | null;
        events: AnalyticsEvent[];
        metrics: BusinessMetric[];
        exportDate: Date;
    };
    /**
     * Start periodic data processing
     */
    private startPeriodicProcessing;
    /**
     * Process event buffer
     */
    private processEventBuffer;
    /**
     * Clean up old data
     */
    private cleanupOldData;
    /**
     * Check if event is allowed
     */
    private isEventAllowed;
    /**
     * Sanitize parameters to remove sensitive data
     */
    private sanitizeParameters;
    /**
     * Calculate engagement metrics
     */
    private calculateEngagementMetrics;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Generate unique metric ID
     */
    private generateMetricId;
    /**
     * Update analytics configuration
     */
    updateConfig(config: Partial<AnalyticsConfig>): void;
    /**
     * Get analytics configuration
     */
    getConfig(): AnalyticsConfig;
    /**
     * Get analytics summary
     */
    getAnalyticsSummary(): {
        totalEvents: number;
        totalMetrics: number;
        totalUsers: number;
        isInitialized: boolean;
        sessionId: string;
    };
    /**
     * Clear all analytics data
     */
    clearAnalyticsData(): void;
}
export declare const firebaseAnalyticsService: FirebaseAnalyticsService;
