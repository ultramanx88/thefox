/**
 * Comprehensive Logging Service for Firebase Operations
 * Provides structured logging, audit trails, and operation tracking
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    CRITICAL = "critical"
}
export declare enum LogCategory {
    AUTH = "auth",
    FIRESTORE = "firestore",
    STORAGE = "storage",
    FUNCTIONS = "functions",
    ANALYTICS = "analytics",
    SECURITY = "security",
    PERFORMANCE = "performance",
    SYSTEM = "system"
}
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    category: LogCategory;
    operation: string;
    message: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
    duration?: number;
    success: boolean;
    errorCode?: string;
    stackTrace?: string;
}
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    userId: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    reason?: string;
}
export interface SecurityLogEntry {
    id: string;
    timestamp: Date;
    type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    action: string;
    resource?: string;
    details: Record<string, any>;
    blocked: boolean;
}
export interface LoggerConfig {
    level: LogLevel;
    enableConsoleOutput: boolean;
    enableFirestoreLogging: boolean;
    enableAuditLogging: boolean;
    enableSecurityLogging: boolean;
    maxLogEntries: number;
    retentionDays: number;
    sensitiveFields: string[];
}
export declare class FirebaseLoggerService {
    private static instance;
    private config;
    private logBuffer;
    private auditBuffer;
    private securityBuffer;
    private sessionId;
    private constructor();
    static getInstance(): FirebaseLoggerService;
    /**
     * Log debug message
     */
    debug(category: LogCategory, operation: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Log info message
     */
    info(category: LogCategory, operation: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Log warning message
     */
    warn(category: LogCategory, operation: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Log error message
     */
    error(category: LogCategory, operation: string, message: string, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Log critical message
     */
    critical(category: LogCategory, operation: string, message: string, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Log Firestore operation
     */
    logFirestoreOperation(operation: 'read' | 'write' | 'update' | 'delete' | 'query', collection: string, documentId?: string, success?: boolean, duration?: number, metadata?: Record<string, any>): void;
    /**
     * Log Storage operation
     */
    logStorageOperation(operation: 'upload' | 'download' | 'delete' | 'list', path: string, success?: boolean, duration?: number, fileSize?: number, metadata?: Record<string, any>): void;
    /**
     * Log Functions operation
     */
    logFunctionOperation(functionName: string, success?: boolean, duration?: number, inputData?: any, outputData?: any, metadata?: Record<string, any>): void;
    /**
     * Log Authentication operation
     */
    logAuthOperation(operation: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh', userId?: string, success?: boolean, metadata?: Record<string, any>): void;
    /**
     * Log audit event
     */
    logAuditEvent(userId: string, userRole: string, action: string, resource: string, resourceId?: string, oldValue?: any, newValue?: any, success?: boolean, reason?: string): void;
    /**
     * Log security event
     */
    logSecurityEvent(type: SecurityLogEntry['type'], severity: SecurityLogEntry['severity'], action: string, details: Record<string, any>, userId?: string, resource?: string, blocked?: boolean): void;
    /**
     * Log performance metric
     */
    logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void;
    /**
     * Measure and log operation performance
     */
    measureOperation<T>(operation: string, category: LogCategory, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    /**
     * Persist log entry to Firestore
     */
    private persistLogEntry;
    /**
     * Persist audit entry to Firestore
     */
    private persistAuditEntry;
    /**
     * Persist security entry to Firestore
     */
    private persistSecurityEntry;
    /**
     * Initialize logger
     */
    private initializeLogger;
    /**
     * Check if log level should be logged
     */
    private shouldLog;
    /**
     * Output log entry to console
     */
    private outputToConsole;
    /**
     * Sanitize metadata to remove sensitive information
     */
    private sanitizeMetadata;
    /**
     * Sanitize string for sensitive information
     */
    private sanitizeString;
    /**
     * Generate unique log ID
     */
    private generateLogId;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Get client IP address
     */
    private getClientIP;
    /**
     * Get user agent
     */
    private getUserAgent;
    /**
     * Send security alert
     */
    private sendSecurityAlert;
    /**
     * Clean up old logs
     */
    private cleanupOldLogs;
    /**
     * Update logger configuration
     */
    updateConfig(config: Partial<LoggerConfig>): void;
    /**
     * Get recent logs
     */
    getRecentLogs(limit?: number): LogEntry[];
    /**
     * Get recent audit logs
     */
    getRecentAuditLogs(limit?: number): AuditLogEntry[];
    /**
     * Get recent security logs
     */
    getRecentSecurityLogs(limit?: number): SecurityLogEntry[];
    /**
     * Export logs
     */
    exportLogs(): {
        timestamp: Date;
        logs: LogEntry[];
        auditLogs: AuditLogEntry[];
        securityLogs: SecurityLogEntry[];
    };
    /**
     * Clear all logs
     */
    clearLogs(): void;
}
export declare const firebaseLogger: FirebaseLoggerService;
