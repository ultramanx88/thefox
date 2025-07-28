"use strict";
/**
 * Comprehensive Firebase Analytics and Business Metrics Service
 * Handles event tracking, custom analytics, and business intelligence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAnalyticsService = exports.FirebaseAnalyticsService = void 0;
const analytics_1 = require("firebase/analytics");
const config_1 = require("./config");
const logger_1 = require("./logger");
// ===========================================
// FIREBASE ANALYTICS SERVICE
// ===========================================
class FirebaseAnalyticsService {
    constructor() {
        this.analytics = null;
        this.eventBuffer = [];
        this.businessMetrics = new Map();
        this.userAnalytics = new Map();
        this.isInitialized = false;
        this.config = {
            enableFirebaseAnalytics: true,
            enableCustomAnalytics: true,
            enableBusinessMetrics: true,
            enableUserTracking: true,
            enableConversionTracking: true,
            dataRetentionDays: 90,
            privacyMode: false,
            allowedEvents: [],
            blockedEvents: ['sensitive_data', 'personal_info'],
        };
        this.sessionId = this.generateSessionId();
        this.initializeAnalytics();
    }
    static getInstance() {
        if (!FirebaseAnalyticsService.instance) {
            FirebaseAnalyticsService.instance = new FirebaseAnalyticsService();
        }
        return FirebaseAnalyticsService.instance;
    }
    // ===========================================
    // INITIALIZATION
    // ===========================================
    async initializeAnalytics() {
        try {
            // Initialize Firebase Analytics (browser only)
            if (typeof window !== 'undefined' && this.config.enableFirebaseAnalytics) {
                this.analytics = (0, analytics_1.getAnalytics)(config_1.app);
                // Set analytics collection based on privacy settings
                (0, analytics_1.setAnalyticsCollectionEnabled)(this.analytics, !this.config.privacyMode);
                console.log('Firebase Analytics initialized');
            }
            // Set up periodic data processing
            this.startPeriodicProcessing();
            this.isInitialized = true;
            logger_1.firebaseLogger.info(logger_1.LogCategory.ANALYTICS, 'initialization', 'Firebase Analytics Service initialized');
        }
        catch (error) {
            console.error('Failed to initialize Firebase Analytics:', error);
            logger_1.firebaseLogger.error(logger_1.LogCategory.ANALYTICS, 'initialization', 'Failed to initialize Firebase Analytics', error);
        }
    }
    // ===========================================
    // EVENT TRACKING
    // ===========================================
    /**
     * Track custom event
     */
    trackEvent(eventName, parameters, userId) {
        if (!this.isEventAllowed(eventName)) {
            console.warn(`Event ${eventName} is blocked by configuration`);
            return;
        }
        try {
            // Sanitize parameters
            const sanitizedParams = this.sanitizeParameters(parameters);
            // Track in Firebase Analytics
            if (this.analytics && this.config.enableFirebaseAnalytics) {
                (0, analytics_1.logEvent)(this.analytics, eventName, sanitizedParams);
            }
            // Store in custom analytics
            if (this.config.enableCustomAnalytics) {
                const analyticsEvent = {
                    name: eventName,
                    parameters: sanitizedParams,
                    timestamp: new Date(),
                    userId,
                    sessionId: this.sessionId,
                };
                this.eventBuffer.push(analyticsEvent);
                this.processEventBuffer();
            }
            logger_1.firebaseLogger.info(logger_1.LogCategory.ANALYTICS, 'track_event', `Event tracked: ${eventName}`, { eventName, parameters: sanitizedParams, userId });
        }
        catch (error) {
            console.error(`Failed to track event ${eventName}:`, error);
            logger_1.firebaseLogger.error(logger_1.LogCategory.ANALYTICS, 'track_event', `Failed to track event: ${eventName}`, error, { eventName, parameters });
        }
    }
    /**
     * Track user action
     */
    trackUserAction(action, category, label, value, userId) {
        this.trackEvent('user_action', {
            action,
            category,
            label,
            value,
            timestamp: Date.now(),
        }, userId);
    }
    /**
     * Track page view
     */
    trackPageView(pageName, pageTitle, userId) {
        if (this.analytics) {
            (0, analytics_1.setCurrentScreen)(this.analytics, pageName, {
                screen_class: pageTitle || pageName,
            });
        }
        this.trackEvent('page_view', {
            page_name: pageName,
            page_title: pageTitle,
            timestamp: Date.now(),
        }, userId);
    }
    /**
     * Track conversion event
     */
    trackConversion(conversionType, value, currency, userId, metadata) {
        if (!this.config.enableConversionTracking)
            return;
        this.trackEvent('conversion', {
            conversion_type: conversionType,
            value,
            currency: currency || 'THB',
            timestamp: Date.now(),
            ...metadata,
        }, userId);
        // Also track as business metric
        this.recordBusinessMetric({
            name: `conversion_${conversionType}`,
            value: value || 1,
            unit: value ? 'currency' : 'count',
            category: 'sales',
            metadata: {
                conversionType,
                currency,
                ...metadata,
            },
        });
    }
    // ===========================================
    // BUSINESS METRICS
    // ===========================================
    /**
     * Record business metric
     */
    recordBusinessMetric(metric) {
        if (!this.config.enableBusinessMetrics)
            return;
        const businessMetric = {
            id: this.generateMetricId(),
            timestamp: new Date(),
            ...metric,
        };
        this.businessMetrics.set(businessMetric.id, businessMetric);
        // Also track as analytics event
        this.trackEvent('business_metric', {
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.unit,
            metric_category: metric.category,
        });
        logger_1.firebaseLogger.info(logger_1.LogCategory.ANALYTICS, 'business_metric', `Business metric recorded: ${metric.name}`, { metric: businessMetric });
    }
    /**
     * Track order metrics
     */
    trackOrderMetrics(orderData) {
        // Track order placed
        this.trackEvent('order_placed', {
            order_id: orderData.orderId,
            market_id: orderData.marketId,
            total_amount: orderData.totalAmount,
            item_count: orderData.itemCount,
            delivery_fee: orderData.deliveryFee,
            payment_method: orderData.paymentMethod,
        }, orderData.userId);
        // Record business metrics
        this.recordBusinessMetric({
            name: 'total_revenue',
            value: orderData.totalAmount,
            unit: 'currency',
            category: 'sales',
            metadata: { orderId: orderData.orderId, marketId: orderData.marketId },
        });
        this.recordBusinessMetric({
            name: 'orders_count',
            value: 1,
            unit: 'count',
            category: 'orders',
            metadata: { orderId: orderData.orderId, marketId: orderData.marketId },
        });
        this.recordBusinessMetric({
            name: 'average_order_value',
            value: orderData.totalAmount,
            unit: 'currency',
            category: 'sales',
            metadata: { orderId: orderData.orderId },
        });
    }
    /**
     * Track user engagement metrics
     */
    trackUserEngagement(userId, engagementData) {
        this.trackEvent('user_engagement', {
            session_duration: engagementData.sessionDuration,
            pages_viewed: engagementData.pagesViewed,
            actions_performed: engagementData.actionsPerformed,
        }, userId);
        // Record engagement metrics
        this.recordBusinessMetric({
            name: 'session_duration',
            value: engagementData.sessionDuration,
            unit: 'time',
            category: 'engagement',
            metadata: { userId },
        });
        this.recordBusinessMetric({
            name: 'page_views_per_session',
            value: engagementData.pagesViewed,
            unit: 'count',
            category: 'engagement',
            metadata: { userId },
        });
    }
    // ===========================================
    // USER ANALYTICS
    // ===========================================
    /**
     * Set user properties
     */
    setUserProperties(userId, properties) {
        if (!this.config.enableUserTracking)
            return;
        try {
            // Set in Firebase Analytics
            if (this.analytics) {
                (0, analytics_1.setUserId)(this.analytics, userId);
                (0, analytics_1.setUserProperties)(this.analytics, this.sanitizeParameters(properties));
            }
            // Update user analytics
            const existingUser = this.userAnalytics.get(userId);
            const userAnalytics = {
                userId,
                userRole: properties.role || 'customer',
                registrationDate: existingUser?.registrationDate || new Date(),
                lastActiveDate: new Date(),
                totalSessions: (existingUser?.totalSessions || 0) + 1,
                ...properties,
            };
            this.userAnalytics.set(userId, userAnalytics);
            logger_1.firebaseLogger.info(logger_1.LogCategory.ANALYTICS, 'user_properties', `User properties set for: ${userId}`, { userId, properties: this.sanitizeParameters(properties) });
        }
        catch (error) {
            console.error(`Failed to set user properties for ${userId}:`, error);
            logger_1.firebaseLogger.error(logger_1.LogCategory.ANALYTICS, 'user_properties', `Failed to set user properties for: ${userId}`, error, { userId, properties });
        }
    }
    /**
     * Track user lifecycle events
     */
    trackUserLifecycle(userId, event, metadata) {
        this.trackEvent('user_lifecycle', {
            lifecycle_event: event,
            timestamp: Date.now(),
            ...metadata,
        }, userId);
        // Update user analytics
        const userAnalytics = this.userAnalytics.get(userId);
        if (userAnalytics) {
            switch (event) {
                case 'first_purchase':
                    userAnalytics.totalOrdersPlaced = (userAnalytics.totalOrdersPlaced || 0) + 1;
                    break;
                case 'subscription':
                    // Handle subscription logic
                    break;
            }
            this.userAnalytics.set(userId, userAnalytics);
        }
    }
    // ===========================================
    // REPORTING AND ANALYTICS
    // ===========================================
    /**
     * Generate sales analytics report
     */
    generateSalesReport(period, startDate, endDate) {
        const relevantMetrics = Array.from(this.businessMetrics.values()).filter(metric => metric.category === 'sales' &&
            metric.timestamp >= startDate &&
            metric.timestamp <= endDate);
        const revenueMetrics = relevantMetrics.filter(m => m.name === 'total_revenue');
        const orderMetrics = relevantMetrics.filter(m => m.name === 'orders_count');
        const totalRevenue = revenueMetrics.reduce((sum, m) => sum + m.value, 0);
        const totalOrders = orderMetrics.reduce((sum, m) => sum + m.value, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // Calculate top products and markets (simplified)
        const productSales = new Map();
        const marketSales = new Map();
        // This would be populated from actual order data
        const topProducts = Array.from(productSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        const topMarkets = Array.from(marketSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        return {
            period,
            startDate,
            endDate,
            totalRevenue,
            totalOrders,
            averageOrderValue,
            topProducts,
            topMarkets,
            customerSegments: [], // Would be calculated from user data
        };
    }
    /**
     * Generate user analytics report
     */
    generateUserReport(startDate, endDate) {
        const users = Array.from(this.userAnalytics.values());
        const activeUsers = users.filter(user => user.lastActiveDate >= startDate && user.lastActiveDate <= endDate);
        const newUsers = users.filter(user => user.registrationDate >= startDate && user.registrationDate <= endDate);
        const usersByRole = users.reduce((acc, user) => {
            acc[user.userRole] = (acc[user.userRole] || 0) + 1;
            return acc;
        }, {});
        const topUsersByRevenue = users
            .filter(user => user.totalRevenue && user.totalRevenue > 0)
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
            .slice(0, 10);
        // Calculate engagement metrics from business metrics
        const engagementMetrics = this.calculateEngagementMetrics(startDate, endDate);
        return {
            totalUsers: users.length,
            activeUsers: activeUsers.length,
            newUsers: newUsers.length,
            usersByRole,
            topUsersByRevenue,
            engagementMetrics,
        };
    }
    /**
     * Generate comprehensive analytics dashboard data
     */
    generateDashboardData() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Calculate overview metrics
        const recentMetrics = Array.from(this.businessMetrics.values()).filter(metric => metric.timestamp >= thirtyDaysAgo);
        const totalRevenue = recentMetrics
            .filter(m => m.name === 'total_revenue')
            .reduce((sum, m) => sum + m.value, 0);
        const totalOrders = recentMetrics
            .filter(m => m.name === 'orders_count')
            .reduce((sum, m) => sum + m.value, 0);
        const totalUsers = this.userAnalytics.size;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // Calculate growth trends (simplified)
        const trends = {
            revenueGrowth: 0, // Would calculate from historical data
            orderGrowth: 0,
            userGrowth: 0,
        };
        // Get top metrics
        const topMetrics = Array.from(this.businessMetrics.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
        // Get recent events
        const recentEvents = this.eventBuffer
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 20);
        return {
            overview: {
                totalRevenue,
                totalOrders,
                totalUsers,
                averageOrderValue,
            },
            trends,
            topMetrics,
            recentEvents,
        };
    }
    // ===========================================
    // DATA EXPORT
    // ===========================================
    /**
     * Export analytics data for compliance
     */
    exportAnalyticsData(startDate, endDate, format = 'json') {
        const events = this.eventBuffer.filter(event => event.timestamp >= startDate && event.timestamp <= endDate);
        const metrics = Array.from(this.businessMetrics.values()).filter(metric => metric.timestamp >= startDate && metric.timestamp <= endDate);
        const users = Array.from(this.userAnalytics.values()).filter(user => user.lastActiveDate >= startDate && user.lastActiveDate <= endDate);
        const exportData = {
            events,
            metrics,
            users,
            metadata: {
                exportDate: new Date(),
                period: { startDate, endDate },
                totalRecords: events.length + metrics.length + users.length,
            },
        };
        logger_1.firebaseLogger.logAuditEvent('system', 'admin', 'data_export', 'analytics', undefined, undefined, {
            format,
            period: { startDate, endDate },
            recordCount: exportData.metadata.totalRecords,
        }, true);
        return exportData;
    }
    /**
     * Export user data for GDPR compliance
     */
    exportUserData(userId) {
        const userAnalytics = this.userAnalytics.get(userId) || null;
        const events = this.eventBuffer.filter(event => event.userId === userId);
        const metrics = Array.from(this.businessMetrics.values()).filter(metric => metric.metadata?.userId === userId);
        logger_1.firebaseLogger.logAuditEvent(userId, 'user', 'data_export', 'user_analytics', userId, undefined, { recordCount: events.length + metrics.length }, true);
        return {
            userAnalytics,
            events,
            metrics,
            exportDate: new Date(),
        };
    }
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    /**
     * Start periodic data processing
     */
    startPeriodicProcessing() {
        // Process event buffer every 5 minutes
        setInterval(() => {
            this.processEventBuffer();
        }, 300000);
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
        console.log('Analytics periodic processing started');
    }
    /**
     * Process event buffer
     */
    processEventBuffer() {
        if (this.eventBuffer.length === 0)
            return;
        try {
            // Here you would persist events to Firestore or other storage
            // For now, we'll just maintain the buffer size
            if (this.eventBuffer.length > 1000) {
                this.eventBuffer = this.eventBuffer.slice(-500); // Keep last 500 events
            }
        }
        catch (error) {
            console.error('Failed to process event buffer:', error);
        }
    }
    /**
     * Clean up old data
     */
    cleanupOldData() {
        const cutoffDate = new Date(Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000));
        // Clean up old events
        this.eventBuffer = this.eventBuffer.filter(event => event.timestamp > cutoffDate);
        // Clean up old metrics
        for (const [id, metric] of this.businessMetrics.entries()) {
            if (metric.timestamp < cutoffDate) {
                this.businessMetrics.delete(id);
            }
        }
        console.log('Old analytics data cleaned up');
    }
    /**
     * Check if event is allowed
     */
    isEventAllowed(eventName) {
        if (this.config.blockedEvents.includes(eventName)) {
            return false;
        }
        if (this.config.allowedEvents.length > 0) {
            return this.config.allowedEvents.includes(eventName);
        }
        return true;
    }
    /**
     * Sanitize parameters to remove sensitive data
     */
    sanitizeParameters(parameters) {
        if (!parameters)
            return {};
        const sanitized = {};
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential', 'email', 'phone'];
        for (const [key, value] of Object.entries(parameters)) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * Calculate engagement metrics
     */
    calculateEngagementMetrics(startDate, endDate) {
        const engagementMetrics = Array.from(this.businessMetrics.values()).filter(metric => metric.category === 'engagement' &&
            metric.timestamp >= startDate &&
            metric.timestamp <= endDate);
        const sessionDurations = engagementMetrics.filter(m => m.name === 'session_duration');
        const pageViews = engagementMetrics.filter(m => m.name === 'page_views_per_session');
        const averageSessionDuration = sessionDurations.length > 0
            ? sessionDurations.reduce((sum, m) => sum + m.value, 0) / sessionDurations.length
            : 0;
        const averagePagesPerSession = pageViews.length > 0
            ? pageViews.reduce((sum, m) => sum + m.value, 0) / pageViews.length
            : 0;
        // Simplified bounce rate calculation
        const bounceRate = averagePagesPerSession < 2 ? 50 : 25; // Placeholder calculation
        return {
            averageSessionDuration,
            averagePagesPerSession,
            bounceRate,
        };
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique metric ID
     */
    generateMetricId() {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // ===========================================
    // PUBLIC API METHODS
    // ===========================================
    /**
     * Update analytics configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        // Update Firebase Analytics collection if needed
        if (this.analytics && 'privacyMode' in config) {
            (0, analytics_1.setAnalyticsCollectionEnabled)(this.analytics, !this.config.privacyMode);
        }
        logger_1.firebaseLogger.info(logger_1.LogCategory.ANALYTICS, 'config_update', 'Analytics configuration updated', config);
    }
    /**
     * Get analytics configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get analytics summary
     */
    getAnalyticsSummary() {
        return {
            totalEvents: this.eventBuffer.length,
            totalMetrics: this.businessMetrics.size,
            totalUsers: this.userAnalytics.size,
            isInitialized: this.isInitialized,
            sessionId: this.sessionId,
        };
    }
    /**
     * Clear all analytics data
     */
    clearAnalyticsData() {
        this.eventBuffer = [];
        this.businessMetrics.clear();
        this.userAnalytics.clear();
        logger_1.firebaseLogger.logAuditEvent('system', 'admin', 'data_clear', 'analytics', undefined, undefined, { action: 'clear_all_data' }, true);
        console.log('All analytics data cleared');
    }
}
exports.FirebaseAnalyticsService = FirebaseAnalyticsService;
// Export singleton instance
exports.firebaseAnalyticsService = FirebaseAnalyticsService.getInstance();
