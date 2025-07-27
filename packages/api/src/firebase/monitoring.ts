/**
 * Firebase Performance Monitoring and Analytics Service
 * Tracks performance metrics, usage analytics, and system health
 */

import { 
  getPerformance, 
  Performance, 
  trace, 
  Trace 
} from 'firebase/performance';
import { 
  getAnalytics, 
  Analytics, 
  logEvent, 
  setUserId, 
  setUserProperties 
} from 'firebase/analytics';
import { app } from './config';

// ===========================================
// TYPES AND INTERFACES
// ===========================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    firestore: ServiceStatus;
    storage: ServiceStatus;
    functions: ServiceStatus;
    auth: ServiceStatus;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
  lastChecked: Date;
}

export interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  issues?: string[];
}

export interface QuotaUsage {
  service: string;
  metric: string;
  current: number;
  limit: number;
  percentage: number;
  resetTime?: Date;
}

// ===========================================
// FIREBASE MONITORING SERVICE
// ===========================================

export class FirebaseMonitoringService {
  private static instance: FirebaseMonitoringService;
  private performance: Performance | null = null;
  private analytics: Analytics | null = null;
  private activeTraces: Map<string, Trace> = new Map();
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private healthChecks: Map<string, ServiceStatus> = new Map();
  private quotaUsage: Map<string, QuotaUsage> = new Map();

  private constructor() {
    this.initializeServices();
    this.startHealthMonitoring();
  }

  static getInstance(): FirebaseMonitoringService {
    if (!FirebaseMonitoringService.instance) {
      FirebaseMonitoringService.instance = new FirebaseMonitoringService();
    }
    return FirebaseMonitoringService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private async initializeServices(): Promise<void> {
    try {
      // Initialize Performance Monitoring (browser only)
      if (typeof window !== 'undefined') {
        this.performance = getPerformance(app);
        console.log('Firebase Performance Monitoring initialized');
      }

      // Initialize Analytics (browser only)
      if (typeof window !== 'undefined') {
        this.analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      }

    } catch (error) {
      console.warn('Failed to initialize Firebase monitoring services:', error);
    }
  }

  // ===========================================
  // PERFORMANCE MONITORING
  // ===========================================

  /**
   * Start a performance trace
   */
  startTrace(traceName: string, metadata?: Record<string, string>): string {
    if (!this.performance) {
      console.warn('Performance monitoring not available');
      return traceName;
    }

    try {
      const performanceTrace = trace(this.performance, traceName);
      
      // Add custom attributes
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          performanceTrace.putAttribute(key, value);
        });
      }

      performanceTrace.start();
      this.activeTraces.set(traceName, performanceTrace);

      console.log(`Performance trace started: ${traceName}`);
      return traceName;

    } catch (error) {
      console.error(`Failed to start trace ${traceName}:`, error);
      return traceName;
    }
  }

  /**
   * Stop a performance trace
   */
  stopTrace(traceName: string, customMetrics?: Record<string, number>): void {
    const performanceTrace = this.activeTraces.get(traceName);
    
    if (!performanceTrace) {
      console.warn(`No active trace found: ${traceName}`);
      return;
    }

    try {
      // Add custom metrics
      if (customMetrics) {
        Object.entries(customMetrics).forEach(([key, value]) => {
          performanceTrace.putMetric(key, value);
        });
      }

      performanceTrace.stop();
      this.activeTraces.delete(traceName);

      console.log(`Performance trace stopped: ${traceName}`);

    } catch (error) {
      console.error(`Failed to stop trace ${traceName}:`, error);
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, unit: PerformanceMetric['unit'], metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    // Store metric locally
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 100 metrics per type
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    console.log(`Custom metric recorded: ${name} = ${value}${unit}`);
  }

  /**
   * Measure operation performance
   */
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, string>
  ): Promise<T> {
    const traceId = this.startTrace(operationName, metadata);
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.stopTrace(traceId, { duration });
      this.recordMetric(`${operationName}_duration`, duration, 'ms');

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.stopTrace(traceId, { 
        duration,
        error: 1 
      });
      
      this.recordMetric(`${operationName}_error`, 1, 'count');
      throw error;
    }
  }

  // ===========================================
  // ANALYTICS TRACKING
  // ===========================================

  /**
   * Track custom analytics event
   */
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    if (!this.analytics) {
      console.warn('Analytics not available');
      return;
    }

    try {
      logEvent(this.analytics, eventName, parameters);
      
      console.log(`Analytics event tracked: ${eventName}`, parameters);

    } catch (error) {
      console.error(`Failed to track event ${eventName}:`, error);
    }
  }

  /**
   * Set user ID for analytics
   */
  setAnalyticsUserId(userId: string): void {
    if (!this.analytics) return;

    try {
      setUserId(this.analytics, userId);
      console.log(`Analytics user ID set: ${userId}`);
    } catch (error) {
      console.error('Failed to set analytics user ID:', error);
    }
  }

  /**
   * Set user properties for analytics
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.analytics) return;

    try {
      setUserProperties(this.analytics, properties);
      console.log('Analytics user properties set:', properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Track Firebase operation
   */
  trackFirebaseOperation(
    service: 'firestore' | 'storage' | 'functions' | 'auth',
    operation: string,
    success: boolean,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('firebase_operation', {
      service,
      operation,
      success,
      duration,
      ...metadata,
    });

    // Also record as performance metric
    if (duration) {
      this.recordMetric(`${service}_${operation}_duration`, duration, 'ms');
    }

    this.recordMetric(`${service}_${operation}_${success ? 'success' : 'error'}`, 1, 'count');
  }

  // ===========================================
  // HEALTH MONITORING
  // ===========================================

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 300000);

    // Initial health check
    setTimeout(() => {
      this.performHealthCheck();
    }, 5000);

    console.log('Health monitoring started');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    console.log('Performing health check...');

    try {
      // Check each service
      await Promise.all([
        this.checkFirestoreHealth(),
        this.checkStorageHealth(),
        this.checkFunctionsHealth(),
        this.checkAuthHealth(),
      ]);

      // Update quota usage
      await this.updateQuotaUsage();

      console.log('Health check completed');

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Check Firestore health
   */
  private async checkFirestoreHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { FirestoreService } = await import('./firestore');
      
      // Try to read a system document
      await FirestoreService.read('system', 'health-check');
      
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('firestore', {
        status: 'operational',
        responseTime,
        errorRate: 0,
        lastChecked: new Date(),
      });

      this.recordMetric('firestore_health_check', responseTime, 'ms');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('firestore', {
        status: 'degraded',
        responseTime,
        errorRate: 100,
        lastChecked: new Date(),
        issues: [(error as Error).message],
      });

      this.recordMetric('firestore_health_error', 1, 'count');
    }
  }

  /**
   * Check Storage health
   */
  private async checkStorageHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { storage } = await import('./config');
      
      // Simple health check - just verify storage is accessible
      const storageRef = storage.app;
      
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('storage', {
        status: 'operational',
        responseTime,
        errorRate: 0,
        lastChecked: new Date(),
      });

      this.recordMetric('storage_health_check', responseTime, 'ms');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('storage', {
        status: 'degraded',
        responseTime,
        errorRate: 100,
        lastChecked: new Date(),
        issues: [(error as Error).message],
      });

      this.recordMetric('storage_health_error', 1, 'count');
    }
  }

  /**
   * Check Functions health
   */
  private async checkFunctionsHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { functions } = await import('./config');
      
      // Simple health check - verify functions are accessible
      const functionsApp = functions.app;
      
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('functions', {
        status: 'operational',
        responseTime,
        errorRate: 0,
        lastChecked: new Date(),
      });

      this.recordMetric('functions_health_check', responseTime, 'ms');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('functions', {
        status: 'degraded',
        responseTime,
        errorRate: 100,
        lastChecked: new Date(),
        issues: [(error as Error).message],
      });

      this.recordMetric('functions_health_error', 1, 'count');
    }
  }

  /**
   * Check Auth health
   */
  private async checkAuthHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { auth } = await import('./config');
      
      // Simple health check - verify auth is accessible
      const authApp = auth.app;
      
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('auth', {
        status: 'operational',
        responseTime,
        errorRate: 0,
        lastChecked: new Date(),
      });

      this.recordMetric('auth_health_check', responseTime, 'ms');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set('auth', {
        status: 'degraded',
        responseTime,
        errorRate: 100,
        lastChecked: new Date(),
        issues: [(error as Error).message],
      });

      this.recordMetric('auth_health_error', 1, 'count');
    }
  }

  // ===========================================
  // QUOTA MONITORING
  // ===========================================

  /**
   * Update quota usage information
   */
  private async updateQuotaUsage(): Promise<void> {
    // This would typically integrate with Firebase Admin SDK
    // For now, we'll simulate quota monitoring
    
    const quotas: QuotaUsage[] = [
      {
        service: 'firestore',
        metric: 'reads',
        current: 45000,
        limit: 50000,
        percentage: 90,
      },
      {
        service: 'firestore',
        metric: 'writes',
        current: 18000,
        limit: 20000,
        percentage: 90,
      },
      {
        service: 'storage',
        metric: 'bandwidth',
        current: 800,
        limit: 1000,
        percentage: 80,
      },
      {
        service: 'functions',
        metric: 'invocations',
        current: 180000,
        limit: 200000,
        percentage: 90,
      },
    ];

    for (const quota of quotas) {
      this.quotaUsage.set(`${quota.service}_${quota.metric}`, quota);
      
      // Record quota usage as metric
      this.recordMetric(`quota_${quota.service}_${quota.metric}`, quota.percentage, 'percentage');
      
      // Alert if quota usage is high
      if (quota.percentage >= 90) {
        console.warn(`High quota usage: ${quota.service} ${quota.metric} at ${quota.percentage}%`);
        
        this.trackEvent('quota_warning', {
          service: quota.service,
          metric: quota.metric,
          percentage: quota.percentage,
        });
      }
    }
  }

  // ===========================================
  // REPORTING AND ANALYTICS
  // ===========================================

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const services = {
      firestore: this.healthChecks.get('firestore') || this.getDefaultServiceStatus(),
      storage: this.healthChecks.get('storage') || this.getDefaultServiceStatus(),
      functions: this.healthChecks.get('functions') || this.getDefaultServiceStatus(),
      auth: this.healthChecks.get('auth') || this.getDefaultServiceStatus(),
    };

    // Calculate overall metrics
    const responseTime = Object.values(services).reduce((sum, service) => sum + service.responseTime, 0) / 4;
    const errorRate = Object.values(services).reduce((sum, service) => sum + service.errorRate, 0) / 4;
    
    // Determine overall status
    let status: SystemHealth['status'] = 'healthy';
    const downServices = Object.values(services).filter(s => s.status === 'down').length;
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length;

    if (downServices > 0) {
      status = 'unhealthy';
    } else if (degradedServices > 1) {
      status = 'unhealthy';
    } else if (degradedServices > 0) {
      status = 'degraded';
    }

    return {
      status,
      services,
      metrics: {
        responseTime,
        errorRate,
        throughput: 0, // Would be calculated from actual metrics
        availability: 100 - errorRate,
      },
      lastChecked: new Date(),
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(metricName?: string): Map<string, PerformanceMetric[]> {
    if (metricName) {
      const metrics = this.metrics.get(metricName);
      return metrics ? new Map([[metricName, metrics]]) : new Map();
    }
    
    return new Map(this.metrics);
  }

  /**
   * Get quota usage
   */
  getQuotaUsage(): QuotaUsage[] {
    return Array.from(this.quotaUsage.values());
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: {
      totalMetrics: number;
      averageResponseTime: number;
      errorRate: number;
      healthStatus: string;
    };
    metrics: Record<string, any>;
    quotas: QuotaUsage[];
    health: SystemHealth;
  } {
    const health = this.getSystemHealth();
    const quotas = this.getQuotaUsage();
    
    // Calculate summary statistics
    let totalMetrics = 0;
    let totalResponseTime = 0;
    let errorCount = 0;

    for (const [name, metricList] of this.metrics.entries()) {
      totalMetrics += metricList.length;
      
      if (name.includes('duration')) {
        totalResponseTime += metricList.reduce((sum, m) => sum + m.value, 0);
      }
      
      if (name.includes('error')) {
        errorCount += metricList.reduce((sum, m) => sum + m.value, 0);
      }
    }

    const averageResponseTime = totalResponseTime / Math.max(totalMetrics, 1);
    const errorRate = (errorCount / Math.max(totalMetrics, 1)) * 100;

    return {
      summary: {
        totalMetrics,
        averageResponseTime,
        errorRate,
        healthStatus: health.status,
      },
      metrics: Object.fromEntries(this.metrics),
      quotas,
      health,
    };
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private getDefaultServiceStatus(): ServiceStatus {
    return {
      status: 'operational',
      responseTime: 0,
      errorRate: 0,
      lastChecked: new Date(),
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    for (const [name, metricList] of this.metrics.entries()) {
      const filteredMetrics = metricList.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(name, filteredMetrics);
    }

    console.log(`Cleared metrics older than ${olderThanHours} hours`);
  }

  /**
   * Export metrics data
   */
  exportMetrics(): {
    timestamp: Date;
    metrics: Record<string, PerformanceMetric[]>;
    health: SystemHealth;
    quotas: QuotaUsage[];
  } {
    return {
      timestamp: new Date(),
      metrics: Object.fromEntries(this.metrics),
      health: this.getSystemHealth(),
      quotas: this.getQuotaUsage(),
    };
  }
}

// Export singleton instance
export const firebaseMonitoringService = FirebaseMonitoringService.getInstance();