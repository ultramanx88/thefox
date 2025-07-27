/**
 * Integrated Firebase Monitoring Service
 * Combines error handling, performance monitoring, and logging into a unified system
 */
import { firebaseErrorHandler } from './error-handler';
import { firebaseMonitoringService } from './monitoring';
import { firebaseLogger, LogCategory } from './logger';
// ===========================================
// INTEGRATED MONITORING SERVICE
// ===========================================
export class IntegratedFirebaseMonitoring {
    constructor() {
        this.alerts = new Map();
        this.isInitialized = false;
        this.config = {
            enableErrorHandling: true,
            enablePerformanceMonitoring: true,
            enableLogging: true,
            enableAlerting: true,
            alertThresholds: {
                errorRate: 5, // 5% error rate
                responseTime: 3000, // 3 seconds
                quotaUsage: 85, // 85% quota usage
            },
        };
    }
    static getInstance() {
        if (!IntegratedFirebaseMonitoring.instance) {
            IntegratedFirebaseMonitoring.instance = new IntegratedFirebaseMonitoring();
        }
        return IntegratedFirebaseMonitoring.instance;
    }
    // ===========================================
    // INITIALIZATION
    // ===========================================
    /**
     * Initialize the integrated monitoring system
     */
    async initialize(config) {
        if (this.isInitialized) {
            console.warn('Integrated monitoring already initialized');
            return;
        }
        if (config) {
            this.config = { ...this.config, ...config };
        }
        try {
            console.log('Initializing Integrated Firebase Monitoring...');
            // Initialize all monitoring components
            if (this.config.enableErrorHandling) {
                console.log('Error handling enabled');
            }
            if (this.config.enablePerformanceMonitoring) {
                console.log('Performance monitoring enabled');
            }
            if (this.config.enableLogging) {
                firebaseLogger.info(LogCategory.SYSTEM, 'initialization', 'Integrated monitoring system initialized');
            }
            // Start periodic health checks
            this.startPeriodicChecks();
            this.isInitialized = true;
            console.log('Integrated Firebase Monitoring initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize integrated monitoring:', error);
            throw error;
        }
    }
    // ===========================================
    // UNIFIED OPERATION MONITORING
    // ===========================================
    /**
     * Monitor a Firebase operation with comprehensive tracking
     */
    async monitorOperation(context, operation) {
        const startTime = Date.now();
        const traceId = `${context.service}_${context.operation}_${Date.now()}`;
        // Start performance trace
        if (this.config.enablePerformanceMonitoring) {
            firebaseMonitoringService.startTrace(traceId, {
                service: context.service,
                operation: context.operation,
                userId: context.userId || 'anonymous',
            });
        }
        // Log operation start
        if (this.config.enableLogging) {
            firebaseLogger.info(this.getLogCategory(context.service), context.operation, `Starting ${context.service} operation: ${context.operation}`, {
                userId: context.userId,
                ...context.metadata,
            });
        }
        try {
            // Execute the operation
            const result = await operation();
            const duration = Date.now() - startTime;
            // Log successful operation
            if (this.config.enableLogging) {
                this.logSuccessfulOperation(context, duration);
            }
            // Stop performance trace
            if (this.config.enablePerformanceMonitoring) {
                firebaseMonitoringService.stopTrace(traceId, { duration, success: 1 });
                firebaseMonitoringService.trackFirebaseOperation(context.service, context.operation, true, duration, context.metadata);
            }
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Handle the error
            await this.handleOperationError(context, error, duration);
            // Stop performance trace with error
            if (this.config.enablePerformanceMonitoring) {
                firebaseMonitoringService.stopTrace(traceId, {
                    duration,
                    success: 0,
                    error: 1
                });
                firebaseMonitoringService.trackFirebaseOperation(context.service, context.operation, false, duration, { error: error.message, ...context.metadata });
            }
            throw error;
        }
    }
    /**
     * Monitor Firestore operation
     */
    async monitorFirestoreOperation(operation, collection, documentId, fn, userId, metadata) {
        return this.monitorOperation({
            userId,
            operation,
            service: 'firestore',
            metadata: {
                collection,
                documentId,
                ...metadata,
            },
        }, fn);
    }
    /**
     * Monitor Storage operation
     */
    async monitorStorageOperation(operation, path, fn, userId, metadata) {
        return this.monitorOperation({
            userId,
            operation,
            service: 'storage',
            metadata: {
                path,
                ...metadata,
            },
        }, fn);
    }
    /**
     * Monitor Functions operation
     */
    async monitorFunctionOperation(functionName, fn, userId, inputData, metadata) {
        return this.monitorOperation({
            userId,
            operation: 'call',
            service: 'functions',
            metadata: {
                functionName,
                inputData,
                ...metadata,
            },
        }, fn);
    }
    /**
     * Monitor Auth operation
     */
    async monitorAuthOperation(operation, fn, userId, metadata) {
        return this.monitorOperation({
            userId,
            operation,
            service: 'auth',
            metadata,
        }, fn);
    }
    // ===========================================
    // ERROR HANDLING
    // ===========================================
    /**
     * Handle operation error with comprehensive logging and monitoring
     */
    async handleOperationError(context, error, duration) {
        // Log the error
        if (this.config.enableLogging) {
            firebaseLogger.error(this.getLogCategory(context.service), context.operation, `${context.service} operation failed: ${error.message}`, error, {
                userId: context.userId,
                duration,
                errorCode: error.code,
                ...context.metadata,
            });
        }
        // Handle error through error handler
        if (this.config.enableErrorHandling) {
            const errorContext = {
                operation: context.operation,
                service: context.service,
                userId: context.userId,
                timestamp: new Date(),
                metadata: context.metadata,
            };
            switch (context.service) {
                case 'firestore':
                    await firebaseErrorHandler.handleFirestoreError(error, errorContext);
                    break;
                case 'storage':
                    await firebaseErrorHandler.handleStorageError(error, errorContext);
                    break;
                case 'functions':
                    await firebaseErrorHandler.handleFunctionError(error, errorContext);
                    break;
                case 'auth':
                    await firebaseErrorHandler.handleAuthError(error, errorContext);
                    break;
            }
        }
        // Check if we need to create an alert
        if (this.config.enableAlerting) {
            await this.checkErrorRateAlert();
        }
    }
    // ===========================================
    // LOGGING HELPERS
    // ===========================================
    /**
     * Log successful operation
     */
    logSuccessfulOperation(context, duration) {
        const category = this.getLogCategory(context.service);
        firebaseLogger.info(category, context.operation, `${context.service} operation completed successfully in ${duration}ms`, {
            userId: context.userId,
            duration,
            ...context.metadata,
        });
        // Log performance metric
        firebaseLogger.logPerformance(`${context.service}_${context.operation}`, duration, context.metadata);
    }
    /**
     * Get log category for service
     */
    getLogCategory(service) {
        switch (service) {
            case 'firestore':
                return LogCategory.FIRESTORE;
            case 'storage':
                return LogCategory.STORAGE;
            case 'functions':
                return LogCategory.FUNCTIONS;
            case 'auth':
                return LogCategory.AUTH;
            default:
                return LogCategory.SYSTEM;
        }
    }
    // ===========================================
    // ALERTING SYSTEM
    // ===========================================
    /**
     * Check error rate and create alert if threshold exceeded
     */
    async checkErrorRateAlert() {
        const errorStats = firebaseErrorHandler.getErrorStats();
        const recentErrors = errorStats.recentErrors;
        if (recentErrors.length === 0)
            return;
        // Calculate error rate in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentErrorCount = recentErrors.filter(error => error.createdAt > fiveMinutesAgo).length;
        // Estimate total operations (this would be more accurate with actual metrics)
        const estimatedOperations = recentErrorCount * 20; // Rough estimate
        const errorRate = (recentErrorCount / estimatedOperations) * 100;
        if (errorRate > this.config.alertThresholds.errorRate) {
            await this.createAlert({
                type: 'error_rate',
                severity: errorRate > 10 ? 'critical' : 'high',
                message: `High error rate detected: ${errorRate.toFixed(2)}% (${recentErrorCount} errors in 5 minutes)`,
                metadata: {
                    errorRate,
                    errorCount: recentErrorCount,
                    threshold: this.config.alertThresholds.errorRate,
                },
            });
        }
    }
    /**
     * Check performance and create alert if threshold exceeded
     */
    async checkPerformanceAlert() {
        const performanceReport = firebaseMonitoringService.generatePerformanceReport();
        const avgResponseTime = performanceReport.summary.averageResponseTime;
        if (avgResponseTime > this.config.alertThresholds.responseTime) {
            await this.createAlert({
                type: 'performance',
                severity: avgResponseTime > 5000 ? 'critical' : 'high',
                message: `High response time detected: ${avgResponseTime.toFixed(0)}ms`,
                metadata: {
                    responseTime: avgResponseTime,
                    threshold: this.config.alertThresholds.responseTime,
                },
            });
        }
    }
    /**
     * Check quota usage and create alert if threshold exceeded
     */
    async checkQuotaAlert() {
        const quotaUsage = firebaseMonitoringService.getQuotaUsage();
        for (const quota of quotaUsage) {
            if (quota.percentage > this.config.alertThresholds.quotaUsage) {
                await this.createAlert({
                    type: 'quota',
                    severity: quota.percentage > 95 ? 'critical' : 'high',
                    message: `High quota usage: ${quota.service} ${quota.metric} at ${quota.percentage}%`,
                    metadata: {
                        service: quota.service,
                        metric: quota.metric,
                        percentage: quota.percentage,
                        threshold: this.config.alertThresholds.quotaUsage,
                    },
                });
            }
        }
    }
    /**
     * Create an alert
     */
    async createAlert(alertData) {
        const alert = {
            id: this.generateAlertId(),
            ...alertData,
            timestamp: new Date(),
            resolved: false,
        };
        this.alerts.set(alert.id, alert);
        // Log the alert
        firebaseLogger.warn(LogCategory.SYSTEM, 'alert', `Alert created: ${alert.message}`, alert.metadata);
        // Log security event for critical alerts
        if (alert.severity === 'critical') {
            firebaseLogger.logSecurityEvent('suspicious_activity', 'critical', `Critical alert: ${alert.type}`, alert.metadata || {}, undefined, undefined, false);
        }
        console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
    }
    // ===========================================
    // PERIODIC MONITORING
    // ===========================================
    /**
     * Start periodic health checks and monitoring
     */
    startPeriodicChecks() {
        // Check alerts every minute
        setInterval(async () => {
            if (this.config.enableAlerting) {
                await this.checkErrorRateAlert();
                await this.checkPerformanceAlert();
                await this.checkQuotaAlert();
            }
        }, 60000);
        // Clean up old alerts every hour
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 3600000);
        console.log('Periodic monitoring checks started');
    }
    /**
     * Clean up old resolved alerts
     */
    cleanupOldAlerts() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        for (const [id, alert] of this.alerts.entries()) {
            if (alert.resolved && alert.timestamp < oneDayAgo) {
                this.alerts.delete(id);
            }
        }
    }
    // ===========================================
    // REPORTING AND ANALYTICS
    // ===========================================
    /**
     * Generate comprehensive monitoring report
     */
    generateMonitoringReport() {
        const systemHealth = firebaseMonitoringService.getSystemHealth();
        const errorStats = firebaseErrorHandler.getErrorStats();
        const performanceReport = firebaseMonitoringService.generatePerformanceReport();
        const recentLogs = firebaseLogger.getRecentLogs(50);
        const quotaUsage = firebaseMonitoringService.getQuotaUsage();
        const alerts = Array.from(this.alerts.values())
            .filter(alert => !alert.resolved)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return {
            timestamp: new Date(),
            systemHealth,
            errorStats,
            performanceMetrics: performanceReport,
            recentLogs,
            quotaUsage,
            alerts,
        };
    }
    /**
     * Get system status summary
     */
    getSystemStatus() {
        const systemHealth = firebaseMonitoringService.getSystemHealth();
        const errorStats = firebaseErrorHandler.getErrorStats();
        const performanceReport = firebaseMonitoringService.generatePerformanceReport();
        const quotaUsage = firebaseMonitoringService.getQuotaUsage();
        const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
        const maxQuotaUsage = Math.max(...quotaUsage.map(q => q.percentage), 0);
        return {
            status: systemHealth.status,
            activeAlerts,
            errorRate: performanceReport.summary.errorRate,
            avgResponseTime: performanceReport.summary.averageResponseTime,
            quotaUsage: maxQuotaUsage,
        };
    }
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    /**
     * Generate unique alert ID
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            firebaseLogger.info(LogCategory.SYSTEM, 'alert_resolved', `Alert resolved: ${alert.message}`, { alertId });
        }
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.resolved)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Update monitoring configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        firebaseLogger.info(LogCategory.SYSTEM, 'config_update', 'Monitoring configuration updated', config);
    }
    /**
     * Get monitoring configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// Export singleton instance
export const integratedFirebaseMonitoring = IntegratedFirebaseMonitoring.getInstance();
