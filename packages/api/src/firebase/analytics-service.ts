/**
 * Comprehensive Firebase Analytics and Business Metrics Service
 * Handles event tracking, custom analytics, and business intelligence
 */

import { 
  getAnalytics, 
  Analytics, 
  logEvent, 
  setUserId, 
  setUserProperties,
  setCurrentScreen,
  setAnalyticsCollectionEnabled
} from 'firebase/analytics';
import { app } from './config';
import { firebaseLogger, LogCategory } from './logger';

// ===========================================
// ANALYTICS TYPES AND INTERFACES
// ===========================================

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

// ===========================================
// FIREBASE ANALYTICS SERVICE
// ===========================================

export class FirebaseAnalyticsService {
  private static instance: FirebaseAnalyticsService;
  private analytics: Analytics | null = null;
  private config: AnalyticsConfig;
  private eventBuffer: AnalyticsEvent[] = [];
  private businessMetrics: Map<string, BusinessMetric> = new Map();
  private userAnalytics: Map<string, UserAnalytics> = new Map();
  private sessionId: string;
  private isInitialized: boolean = false;

  private constructor() {
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

  static getInstance(): FirebaseAnalyticsService {
    if (!FirebaseAnalyticsService.instance) {
      FirebaseAnalyticsService.instance = new FirebaseAnalyticsService();
    }
    return FirebaseAnalyticsService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private async initializeAnalytics(): Promise<void> {
    try {
      // Initialize Firebase Analytics (browser only)
      if (typeof window !== 'undefined' && this.config.enableFirebaseAnalytics) {
        this.analytics = getAnalytics(app);
        
        // Set analytics collection based on privacy settings
        setAnalyticsCollectionEnabled(this.analytics, !this.config.privacyMode);
        
        console.log('Firebase Analytics initialized');
      }

      // Set up periodic data processing
      this.startPeriodicProcessing();

      this.isInitialized = true;
      
      firebaseLogger.info(
        LogCategory.ANALYTICS,
        'initialization',
        'Firebase Analytics Service initialized'
      );

    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
      
      firebaseLogger.error(
        LogCategory.ANALYTICS,
        'initialization',
        'Failed to initialize Firebase Analytics',
        error as Error
      );
    }
  }

  // ===========================================
  // EVENT TRACKING
  // ===========================================

  /**
   * Track custom event
   */
  trackEvent(eventName: string, parameters?: Record<string, any>, userId?: string): void {
    if (!this.isEventAllowed(eventName)) {
      console.warn(`Event ${eventName} is blocked by configuration`);
      return;
    }

    try {
      // Sanitize parameters
      const sanitizedParams = this.sanitizeParameters(parameters);

      // Track in Firebase Analytics
      if (this.analytics && this.config.enableFirebaseAnalytics) {
        logEvent(this.analytics, eventName, sanitizedParams);
      }

      // Store in custom analytics
      if (this.config.enableCustomAnalytics) {
        const analyticsEvent: AnalyticsEvent = {
          name: eventName,
          parameters: sanitizedParams,
          timestamp: new Date(),
          userId,
          sessionId: this.sessionId,
        };

        this.eventBuffer.push(analyticsEvent);
        this.processEventBuffer();
      }

      firebaseLogger.info(
        LogCategory.ANALYTICS,
        'track_event',
        `Event tracked: ${eventName}`,
        { eventName, parameters: sanitizedParams, userId }
      );

    } catch (error) {
      console.error(`Failed to track event ${eventName}:`, error);
      
      firebaseLogger.error(
        LogCategory.ANALYTICS,
        'track_event',
        `Failed to track event: ${eventName}`,
        error as Error,
        { eventName, parameters }
      );
    }
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string,
    category: string,
    label?: string,
    value?: number,
    userId?: string
  ): void {
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
  trackPageView(pageName: string, pageTitle?: string, userId?: string): void {
    if (this.analytics) {
      setCurrentScreen(this.analytics, pageName, {
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
  trackConversion(
    conversionType: 'purchase' | 'signup' | 'subscription' | 'lead',
    value?: number,
    currency?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enableConversionTracking) return;

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
  recordBusinessMetric(metric: Omit<BusinessMetric, 'id' | 'timestamp'>): void {
    if (!this.config.enableBusinessMetrics) return;

    const businessMetric: BusinessMetric = {
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

    firebaseLogger.info(
      LogCategory.ANALYTICS,
      'business_metric',
      `Business metric recorded: ${metric.name}`,
      { metric: businessMetric }
    );
  }

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
  }): void {
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
  trackUserEngagement(userId: string, engagementData: {
    sessionDuration: number;
    pagesViewed: number;
    actionsPerformed: number;
    timeOnPage: Record<string, number>;
  }): void {
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
  setUserProperties(userId: string, properties: Record<string, any>): void {
    if (!this.config.enableUserTracking) return;

    try {
      // Set in Firebase Analytics
      if (this.analytics) {
        setUserId(this.analytics, userId);
        setUserProperties(this.analytics, this.sanitizeParameters(properties));
      }

      // Update user analytics
      const existingUser = this.userAnalytics.get(userId);
      const userAnalytics: UserAnalytics = {
        userId,
        userRole: properties.role || 'customer',
        registrationDate: existingUser?.registrationDate || new Date(),
        lastActiveDate: new Date(),
        totalSessions: (existingUser?.totalSessions || 0) + 1,
        ...properties,
      };

      this.userAnalytics.set(userId, userAnalytics);

      firebaseLogger.info(
        LogCategory.ANALYTICS,
        'user_properties',
        `User properties set for: ${userId}`,
        { userId, properties: this.sanitizeParameters(properties) }
      );

    } catch (error) {
      console.error(`Failed to set user properties for ${userId}:`, error);
      
      firebaseLogger.error(
        LogCategory.ANALYTICS,
        'user_properties',
        `Failed to set user properties for: ${userId}`,
        error as Error,
        { userId, properties }
      );
    }
  }

  /**
   * Track user lifecycle events
   */
  trackUserLifecycle(
    userId: string,
    event: 'registration' | 'first_purchase' | 'subscription' | 'churn',
    metadata?: Record<string, any>
  ): void {
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
  generateSalesReport(
    period: SalesAnalytics['period'],
    startDate: Date,
    endDate: Date
  ): SalesAnalytics {
    const relevantMetrics = Array.from(this.businessMetrics.values()).filter(
      metric => 
        metric.category === 'sales' && 
        metric.timestamp >= startDate && 
        metric.timestamp <= endDate
    );

    const revenueMetrics = relevantMetrics.filter(m => m.name === 'total_revenue');
    const orderMetrics = relevantMetrics.filter(m => m.name === 'orders_count');

    const totalRevenue = revenueMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalOrders = orderMetrics.reduce((sum, m) => sum + m.value, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate top products and markets (simplified)
    const productSales = new Map<string, { name: string; sales: number; revenue: number }>();
    const marketSales = new Map<string, { name: string; orders: number; revenue: number }>();

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
  } {
    const users = Array.from(this.userAnalytics.values());
    const activeUsers = users.filter(
      user => user.lastActiveDate >= startDate && user.lastActiveDate <= endDate
    );
    const newUsers = users.filter(
      user => user.registrationDate >= startDate && user.registrationDate <= endDate
    );

    const usersByRole = users.reduce((acc, user) => {
      acc[user.userRole] = (acc[user.userRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate overview metrics
    const recentMetrics = Array.from(this.businessMetrics.values()).filter(
      metric => metric.timestamp >= thirtyDaysAgo
    );

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
  exportAnalyticsData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): {
    events: AnalyticsEvent[];
    metrics: BusinessMetric[];
    users: UserAnalytics[];
    metadata: {
      exportDate: Date;
      period: { startDate: Date; endDate: Date };
      totalRecords: number;
    };
  } {
    const events = this.eventBuffer.filter(
      event => event.timestamp >= startDate && event.timestamp <= endDate
    );

    const metrics = Array.from(this.businessMetrics.values()).filter(
      metric => metric.timestamp >= startDate && metric.timestamp <= endDate
    );

    const users = Array.from(this.userAnalytics.values()).filter(
      user => user.lastActiveDate >= startDate && user.lastActiveDate <= endDate
    );

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

    firebaseLogger.logAuditEvent(
      'system',
      'admin',
      'data_export',
      'analytics',
      undefined,
      undefined,
      {
        format,
        period: { startDate, endDate },
        recordCount: exportData.metadata.totalRecords,
      },
      true
    );

    return exportData;
  }

  /**
   * Export user data for GDPR compliance
   */
  exportUserData(userId: string): {
    userAnalytics: UserAnalytics | null;
    events: AnalyticsEvent[];
    metrics: BusinessMetric[];
    exportDate: Date;
  } {
    const userAnalytics = this.userAnalytics.get(userId) || null;
    const events = this.eventBuffer.filter(event => event.userId === userId);
    const metrics = Array.from(this.businessMetrics.values()).filter(
      metric => metric.metadata?.userId === userId
    );

    firebaseLogger.logAuditEvent(
      userId,
      'user',
      'data_export',
      'user_analytics',
      userId,
      undefined,
      { recordCount: events.length + metrics.length },
      true
    );

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
  private startPeriodicProcessing(): void {
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
  private processEventBuffer(): void {
    if (this.eventBuffer.length === 0) return;

    try {
      // Here you would persist events to Firestore or other storage
      // For now, we'll just maintain the buffer size
      if (this.eventBuffer.length > 1000) {
        this.eventBuffer = this.eventBuffer.slice(-500); // Keep last 500 events
      }

    } catch (error) {
      console.error('Failed to process event buffer:', error);
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
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
  private isEventAllowed(eventName: string): boolean {
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
  private sanitizeParameters(parameters?: Record<string, any>): Record<string, any> {
    if (!parameters) return {};

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential', 'email', 'phone'];

    for (const [key, value] of Object.entries(parameters)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Calculate engagement metrics
   */
  private calculateEngagementMetrics(startDate: Date, endDate: Date): {
    averageSessionDuration: number;
    averagePagesPerSession: number;
    bounceRate: number;
  } {
    const engagementMetrics = Array.from(this.businessMetrics.values()).filter(
      metric => 
        metric.category === 'engagement' && 
        metric.timestamp >= startDate && 
        metric.timestamp <= endDate
    );

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
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===========================================
  // PUBLIC API METHODS
  // ===========================================

  /**
   * Update analytics configuration
   */
  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update Firebase Analytics collection if needed
    if (this.analytics && 'privacyMode' in config) {
      setAnalyticsCollectionEnabled(this.analytics, !this.config.privacyMode);
    }

    firebaseLogger.info(
      LogCategory.ANALYTICS,
      'config_update',
      'Analytics configuration updated',
      config
    );
  }

  /**
   * Get analytics configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    totalEvents: number;
    totalMetrics: number;
    totalUsers: number;
    isInitialized: boolean;
    sessionId: string;
  } {
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
  clearAnalyticsData(): void {
    this.eventBuffer = [];
    this.businessMetrics.clear();
    this.userAnalytics.clear();

    firebaseLogger.logAuditEvent(
      'system',
      'admin',
      'data_clear',
      'analytics',
      undefined,
      undefined,
      { action: 'clear_all_data' },
      true
    );

    console.log('All analytics data cleared');
  }
}

// Export singleton instance
export const firebaseAnalyticsService = FirebaseAnalyticsService.getInstance();