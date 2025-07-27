/**
 * Integrated Firebase Monitoring Service
 * Combines error handling, performance monitoring, and logging into a unified system
 */
export interface MonitoringConfig {
    enableErrorHandling: boolean;
    enablePerformanceMonitoring: boolean;
    enableLogging: boolean;
    enableAlerting: boolean;
    alertThresholds: {
        errorRate: number;
        responseTime: number;
        quotaUsage: number;
    };
}
export interface OperationContext {
    userId?: string;
    operation: string;
    service: 'firestore' | 'storage' | 'functions' | 'auth';
    metadata?: Record<string, any>;
}
export interface MonitoringReport {
    timestamp: Date;
    systemHealth: any;
    errorStats: any;
    performanceMetrics: any;
    recentLogs: any[];
    quotaUsage: any[];
    alerts: Alert[];
}
export interface Alert {
    id: string;
    type: 'error_rate' | 'performance' | 'quota' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
    metadata?: Record<string, any>;
}
export declare class IntegratedFirebaseMonitoring {
    private static instance;
    private config;
    private alerts;
    private isInitialized;
    private constructor();
    static getInstance(): IntegratedFirebaseMonitoring;
    /**
     * Initialize the integrated monitoring system
     */
    initialize(config?: Partial<MonitoringConfig>): Promise<void>;
    /**
     * Monitor a Firebase operation with comprehensive tracking
     */
    monitorOperation<T>(context: OperationContext, operation: () => Promise<T>): Promise<T>;
    /**
     * Monitor Firestore operation
     */
    monitorFirestoreOperation<T>(operation: 'read' | 'write' | 'update' | 'delete' | 'query', collection: string, documentId: string | undefined, fn: () => Promise<T>, userId?: string, metadata?: Record<string, any>): Promise<T>;
    /**
     * Monitor Storage operation
     */
    monitorStorageOperation<T>(operation: 'upload' | 'download' | 'delete' | 'list', path: string, fn: () => Promise<T>, userId?: string, metadata?: Record<string, any>): Promise<T>;
    /**
     * Monitor Functions operation
     */
    monitorFunctionOperation<T>(functionName: string, fn: () => Promise<T>, userId?: string, inputData?: any, metadata?: Record<string, any>): Promise<T>;
    /**
     * Monitor Auth operation
     */
    monitorAuthOperation<T>(operation: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh', fn: () => Promise<T>, userId?: string, metadata?: Record<string, any>): Promise<T>;
    /**
     * Handle operation error with comprehensive logging and monitoring
     */
    private handleOperationError;
    /**
     * Log successful operation
     */
    private logSuccessfulOperation;
    /**
     * Get log category for service
     */
    private getLogCategory;
    /**
     * Check error rate and create alert if threshold exceeded
     */
    private checkErrorRateAlert;
    /**
     * Check performance and create alert if threshold exceeded
     */
    private checkPerformanceAlert;
    /**
     * Check quota usage and create alert if threshold exceeded
     */
    private checkQuotaAlert;
    /**
     * Create an alert
     */
    private createAlert;
    /**
     * Start periodic health checks and monitoring
     */
    private startPeriodicChecks;
    /**
     * Clean up old resolved alerts
     */
    private cleanupOldAlerts;
    /**
     * Generate comprehensive monitoring report
     */
    generateMonitoringReport(): MonitoringReport;
    /**
     * Get system status summary
     */
    getSystemStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeAlerts: number;
        errorRate: number;
        avgResponseTime: number;
        quotaUsage: number;
    };
    /**
     * Generate unique alert ID
     */
    private generateAlertId;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): void;
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Update monitoring configuration
     */
    updateConfig(config: Partial<MonitoringConfig>): void;
    /**
     * Get monitoring configuration
     */
    getConfig(): MonitoringConfig;
}
export declare const integratedFirebaseMonitoring: IntegratedFirebaseMonitoring;
