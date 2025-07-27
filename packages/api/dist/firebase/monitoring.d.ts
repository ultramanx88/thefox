/**
 * Firebase Performance Monitoring and Analytics Service
 * Tracks performance metrics, usage analytics, and system health
 */
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
export declare class FirebaseMonitoringService {
    private static instance;
    private performance;
    private analytics;
    private activeTraces;
    private metrics;
    private healthChecks;
    private quotaUsage;
    private constructor();
    static getInstance(): FirebaseMonitoringService;
    private initializeServices;
    /**
     * Start a performance trace
     */
    startTrace(traceName: string, metadata?: Record<string, string>): string;
    /**
     * Stop a performance trace
     */
    stopTrace(traceName: string, customMetrics?: Record<string, number>): void;
    /**
     * Record a custom performance metric
     */
    recordMetric(name: string, value: number, unit: PerformanceMetric['unit'], metadata?: Record<string, any>): void;
    /**
     * Measure operation performance
     */
    measureOperation<T>(operationName: string, operation: () => Promise<T>, metadata?: Record<string, string>): Promise<T>;
    /**
     * Track custom analytics event
     */
    trackEvent(eventName: string, parameters?: Record<string, any>): void;
    /**
     * Set user ID for analytics
     */
    setAnalyticsUserId(userId: string): void;
    /**
     * Set user properties for analytics
     */
    setUserProperties(properties: Record<string, any>): void;
    /**
     * Track Firebase operation
     */
    trackFirebaseOperation(service: 'firestore' | 'storage' | 'functions' | 'auth', operation: string, success: boolean, duration?: number, metadata?: Record<string, any>): void;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Perform comprehensive health check
     */
    private performHealthCheck;
    /**
     * Check Firestore health
     */
    private checkFirestoreHealth;
    /**
     * Check Storage health
     */
    private checkStorageHealth;
    /**
     * Check Functions health
     */
    private checkFunctionsHealth;
    /**
     * Check Auth health
     */
    private checkAuthHealth;
    /**
     * Update quota usage information
     */
    private updateQuotaUsage;
    /**
     * Get system health status
     */
    getSystemHealth(): SystemHealth;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(metricName?: string): Map<string, PerformanceMetric[]>;
    /**
     * Get quota usage
     */
    getQuotaUsage(): QuotaUsage[];
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
    };
    private getDefaultServiceStatus;
    /**
     * Clear old metrics
     */
    clearOldMetrics(olderThanHours?: number): void;
    /**
     * Export metrics data
     */
    exportMetrics(): {
        timestamp: Date;
        metrics: Record<string, PerformanceMetric[]>;
        health: SystemHealth;
        quotas: QuotaUsage[];
    };
}
export declare const firebaseMonitoringService: FirebaseMonitoringService;
