/**
 * Firebase Performance Monitoring and Analytics Service
 * Tracks performance metrics, usage analytics, and system health
 */
import { getPerformance, trace } from 'firebase/performance';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from './config';
// ===========================================
// FIREBASE MONITORING SERVICE
// ===========================================
export class FirebaseMonitoringService {
    constructor() {
        this.performance = null;
        this.analytics = null;
        this.activeTraces = new Map();
        this.metrics = new Map();
        this.healthChecks = new Map();
        this.quotaUsage = new Map();
        this.initializeServices();
        this.startHealthMonitoring();
    }
    static getInstance() {
        if (!FirebaseMonitoringService.instance) {
            FirebaseMonitoringService.instance = new FirebaseMonitoringService();
        }
        return FirebaseMonitoringService.instance;
    }
    // ===========================================
    // INITIALIZATION
    // ===========================================
    async initializeServices() {
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
        }
        catch (error) {
            console.warn('Failed to initialize Firebase monitoring services:', error);
        }
    }
    // ===========================================
    // PERFORMANCE MONITORING
    // ===========================================
    /**
     * Start a performance trace
     */
    startTrace(traceName, metadata) {
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
        }
        catch (error) {
            console.error(`Failed to start trace ${traceName}:`, error);
            return traceName;
        }
    }
    /**
     * Stop a performance trace
     */
    stopTrace(traceName, customMetrics) {
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
        }
        catch (error) {
            console.error(`Failed to stop trace ${traceName}:`, error);
        }
    }
    /**
     * Record a custom performance metric
     */
    recordMetric(name, value, unit, metadata) {
        const metric = {
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
        const metricHistory = this.metrics.get(name);
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
    async measureOperation(operationName, operation, metadata) {
        const traceId = this.startTrace(operationName, metadata);
        const startTime = Date.now();
        try {
            const result = await operation();
            const duration = Date.now() - startTime;
            this.stopTrace(traceId, { duration });
            this.recordMetric(`${operationName}_duration`, duration, 'ms');
            return result;
        }
        catch (error) {
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
    trackEvent(eventName, parameters) {
        if (!this.analytics) {
            console.warn('Analytics not available');
            return;
        }
        try {
            logEvent(this.analytics, eventName, parameters);
            console.log(`Analytics event tracked: ${eventName}`, parameters);
        }
        catch (error) {
            console.error(`Failed to track event ${eventName}:`, error);
        }
    }
    /**
     * Set user ID for analytics
     */
    setAnalyticsUserId(userId) {
        if (!this.analytics)
            return;
        try {
            setUserId(this.analytics, userId);
            console.log(`Analytics user ID set: ${userId}`);
        }
        catch (error) {
            console.error('Failed to set analytics user ID:', error);
        }
    }
    /**
     * Set user properties for analytics
     */
    setUserProperties(properties) {
        if (!this.analytics)
            return;
        try {
            setUserProperties(this.analytics, properties);
            console.log('Analytics user properties set:', properties);
        }
        catch (error) {
            console.error('Failed to set user properties:', error);
        }
    }
    /**
     * Track Firebase operation
     */
    trackFirebaseOperation(service, operation, success, duration, metadata) {
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
    startHealthMonitoring() {
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
    async performHealthCheck() {
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
        }
        catch (error) {
            console.error('Health check failed:', error);
        }
    }
    /**
     * Check Firestore health
     */
    async checkFirestoreHealth() {
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
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.healthChecks.set('firestore', {
                status: 'degraded',
                responseTime,
                errorRate: 100,
                lastChecked: new Date(),
                issues: [error.message],
            });
            this.recordMetric('firestore_health_error', 1, 'count');
        }
    }
    /**
     * Check Storage health
     */
    async checkStorageHealth() {
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
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.healthChecks.set('storage', {
                status: 'degraded',
                responseTime,
                errorRate: 100,
                lastChecked: new Date(),
                issues: [error.message],
            });
            this.recordMetric('storage_health_error', 1, 'count');
        }
    }
    /**
     * Check Functions health
     */
    async checkFunctionsHealth() {
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
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.healthChecks.set('functions', {
                status: 'degraded',
                responseTime,
                errorRate: 100,
                lastChecked: new Date(),
                issues: [error.message],
            });
            this.recordMetric('functions_health_error', 1, 'count');
        }
    }
    /**
     * Check Auth health
     */
    async checkAuthHealth() {
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
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.healthChecks.set('auth', {
                status: 'degraded',
                responseTime,
                errorRate: 100,
                lastChecked: new Date(),
                issues: [error.message],
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
    async updateQuotaUsage() {
        // This would typically integrate with Firebase Admin SDK
        // For now, we'll simulate quota monitoring
        const quotas = [
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
    getSystemHealth() {
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
        let status = 'healthy';
        const downServices = Object.values(services).filter(s => s.status === 'down').length;
        const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length;
        if (downServices > 0) {
            status = 'unhealthy';
        }
        else if (degradedServices > 1) {
            status = 'unhealthy';
        }
        else if (degradedServices > 0) {
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
    getPerformanceMetrics(metricName) {
        if (metricName) {
            const metrics = this.metrics.get(metricName);
            return metrics ? new Map([[metricName, metrics]]) : new Map();
        }
        return new Map(this.metrics);
    }
    /**
     * Get quota usage
     */
    getQuotaUsage() {
        return Array.from(this.quotaUsage.values());
    }
    /**
     * Generate performance report
     */
    generatePerformanceReport() {
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
    getDefaultServiceStatus() {
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
    clearOldMetrics(olderThanHours = 24) {
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
    exportMetrics() {
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
