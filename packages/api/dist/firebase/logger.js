/**
 * Comprehensive Logging Service for Firebase Operations
 * Provides structured logging, audit trails, and operation tracking
 */
import { Timestamp } from 'firebase/firestore';
// ===========================================
// LOGGING TYPES AND INTERFACES
// ===========================================
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["CRITICAL"] = "critical";
})(LogLevel || (LogLevel = {}));
export var LogCategory;
(function (LogCategory) {
    LogCategory["AUTH"] = "auth";
    LogCategory["FIRESTORE"] = "firestore";
    LogCategory["STORAGE"] = "storage";
    LogCategory["FUNCTIONS"] = "functions";
    LogCategory["ANALYTICS"] = "analytics";
    LogCategory["SECURITY"] = "security";
    LogCategory["PERFORMANCE"] = "performance";
    LogCategory["SYSTEM"] = "system";
})(LogCategory || (LogCategory = {}));
// ===========================================
// FIREBASE LOGGER SERVICE
// ===========================================
export class FirebaseLoggerService {
    constructor() {
        this.logBuffer = [];
        this.auditBuffer = [];
        this.securityBuffer = [];
        this.config = {
            level: LogLevel.INFO,
            enableConsoleOutput: true,
            enableFirestoreLogging: true,
            enableAuditLogging: true,
            enableSecurityLogging: true,
            maxLogEntries: 1000,
            retentionDays: 30,
            sensitiveFields: ['password', 'token', 'secret', 'key', 'credential'],
        };
        this.sessionId = this.generateSessionId();
        this.initializeLogger();
    }
    static getInstance() {
        if (!FirebaseLoggerService.instance) {
            FirebaseLoggerService.instance = new FirebaseLoggerService();
        }
        return FirebaseLoggerService.instance;
    }
    // ===========================================
    // CORE LOGGING METHODS
    // ===========================================
    /**
     * Log debug message
     */
    debug(category, operation, message, metadata) {
        this.log(LogLevel.DEBUG, category, operation, message, metadata);
    }
    /**
     * Log info message
     */
    info(category, operation, message, metadata) {
        this.log(LogLevel.INFO, category, operation, message, metadata);
    }
    /**
     * Log warning message
     */
    warn(category, operation, message, metadata) {
        this.log(LogLevel.WARN, category, operation, message, metadata);
    }
    /**
     * Log error message
     */
    error(category, operation, message, error, metadata) {
        const logMetadata = {
            ...metadata,
            errorCode: error?.name,
            stackTrace: error?.stack,
        };
        this.log(LogLevel.ERROR, category, operation, message, logMetadata, false);
    }
    /**
     * Log critical message
     */
    critical(category, operation, message, error, metadata) {
        const logMetadata = {
            ...metadata,
            errorCode: error?.name,
            stackTrace: error?.stack,
        };
        this.log(LogLevel.CRITICAL, category, operation, message, logMetadata, false);
    }
    /**
     * Core logging method
     */
    log(level, category, operation, message, metadata, success = true) {
        // Check if log level is enabled
        if (!this.shouldLog(level)) {
            return;
        }
        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date(),
            level,
            category,
            operation,
            message,
            sessionId: this.sessionId,
            metadata: this.sanitizeMetadata(metadata),
            success,
            errorCode: metadata?.errorCode,
            stackTrace: metadata?.stackTrace,
        };
        // Add to buffer
        this.logBuffer.push(logEntry);
        // Maintain buffer size
        if (this.logBuffer.length > this.config.maxLogEntries) {
            this.logBuffer.shift();
        }
        // Console output
        if (this.config.enableConsoleOutput) {
            this.outputToConsole(logEntry);
        }
        // Persist to Firestore
        if (this.config.enableFirestoreLogging) {
            this.persistLogEntry(logEntry);
        }
    }
    // ===========================================
    // FIREBASE OPERATION LOGGING
    // ===========================================
    /**
     * Log Firestore operation
     */
    logFirestoreOperation(operation, collection, documentId, success = true, duration, metadata) {
        const message = `Firestore ${operation} on ${collection}${documentId ? `/${documentId}` : ''}`;
        this.log(success ? LogLevel.INFO : LogLevel.ERROR, LogCategory.FIRESTORE, operation, message, {
            collection,
            documentId,
            duration,
            ...metadata,
        }, success);
    }
    /**
     * Log Storage operation
     */
    logStorageOperation(operation, path, success = true, duration, fileSize, metadata) {
        const message = `Storage ${operation} at ${path}`;
        this.log(success ? LogLevel.INFO : LogLevel.ERROR, LogCategory.STORAGE, operation, message, {
            path,
            duration,
            fileSize,
            ...metadata,
        }, success);
    }
    /**
     * Log Functions operation
     */
    logFunctionOperation(functionName, success = true, duration, inputData, outputData, metadata) {
        const message = `Function ${functionName} ${success ? 'executed' : 'failed'}`;
        this.log(success ? LogLevel.INFO : LogLevel.ERROR, LogCategory.FUNCTIONS, 'call', message, {
            functionName,
            duration,
            inputData: this.sanitizeMetadata(inputData),
            outputData: this.sanitizeMetadata(outputData),
            ...metadata,
        }, success);
    }
    /**
     * Log Authentication operation
     */
    logAuthOperation(operation, userId, success = true, metadata) {
        const message = `Authentication ${operation} ${success ? 'successful' : 'failed'}`;
        this.log(success ? LogLevel.INFO : LogLevel.WARN, LogCategory.AUTH, operation, message, {
            userId,
            ...metadata,
        }, success);
    }
    // ===========================================
    // AUDIT LOGGING
    // ===========================================
    /**
     * Log audit event
     */
    logAuditEvent(userId, userRole, action, resource, resourceId, oldValue, newValue, success = true, reason) {
        if (!this.config.enableAuditLogging) {
            return;
        }
        const auditEntry = {
            id: this.generateLogId(),
            timestamp: new Date(),
            userId,
            userRole,
            action,
            resource,
            resourceId,
            oldValue: this.sanitizeMetadata(oldValue),
            newValue: this.sanitizeMetadata(newValue),
            ipAddress: this.getClientIP(),
            userAgent: this.getUserAgent(),
            success,
            reason,
        };
        this.auditBuffer.push(auditEntry);
        // Maintain buffer size
        if (this.auditBuffer.length > this.config.maxLogEntries) {
            this.auditBuffer.shift();
        }
        // Console output for audit events
        if (this.config.enableConsoleOutput) {
            console.log(`[AUDIT] ${auditEntry.timestamp.toISOString()} - ${userId} (${userRole}) ${action} ${resource}${resourceId ? `/${resourceId}` : ''} - ${success ? 'SUCCESS' : 'FAILED'}`);
        }
        // Persist audit log
        this.persistAuditEntry(auditEntry);
    }
    // ===========================================
    // SECURITY LOGGING
    // ===========================================
    /**
     * Log security event
     */
    logSecurityEvent(type, severity, action, details, userId, resource, blocked = false) {
        if (!this.config.enableSecurityLogging) {
            return;
        }
        const securityEntry = {
            id: this.generateLogId(),
            timestamp: new Date(),
            type,
            severity,
            userId,
            ipAddress: this.getClientIP(),
            userAgent: this.getUserAgent(),
            action,
            resource,
            details: this.sanitizeMetadata(details),
            blocked,
        };
        this.securityBuffer.push(securityEntry);
        // Maintain buffer size
        if (this.securityBuffer.length > this.config.maxLogEntries) {
            this.securityBuffer.shift();
        }
        // Console output for security events
        if (this.config.enableConsoleOutput) {
            console.warn(`[SECURITY] ${securityEntry.timestamp.toISOString()} - ${severity.toUpperCase()} - ${action} - ${blocked ? 'BLOCKED' : 'ALLOWED'}`);
        }
        // Persist security log
        this.persistSecurityEntry(securityEntry);
        // Send immediate alert for critical security events
        if (severity === 'critical') {
            this.sendSecurityAlert(securityEntry);
        }
    }
    // ===========================================
    // PERFORMANCE LOGGING
    // ===========================================
    /**
     * Log performance metric
     */
    logPerformance(operation, duration, metadata) {
        this.log(LogLevel.INFO, LogCategory.PERFORMANCE, operation, `Operation completed in ${duration}ms`, {
            duration,
            ...metadata,
        });
    }
    /**
     * Measure and log operation performance
     */
    async measureOperation(operation, category, fn, metadata) {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            this.log(LogLevel.INFO, category, operation, `Operation completed successfully in ${duration}ms`, {
                duration,
                ...metadata,
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.log(LogLevel.ERROR, category, operation, `Operation failed after ${duration}ms: ${error.message}`, {
                duration,
                error: error.message,
                ...metadata,
            }, false);
            throw error;
        }
    }
    // ===========================================
    // PERSISTENCE METHODS
    // ===========================================
    /**
     * Persist log entry to Firestore
     */
    async persistLogEntry(logEntry) {
        try {
            const { FirestoreService } = await import('./firestore');
            await FirestoreService.create('logs', {
                ...logEntry,
                timestamp: Timestamp.fromDate(logEntry.timestamp),
            });
        }
        catch (error) {
            // Don't throw here to avoid infinite logging loops
            console.error('Failed to persist log entry:', error);
        }
    }
    /**
     * Persist audit entry to Firestore
     */
    async persistAuditEntry(auditEntry) {
        try {
            const { FirestoreService } = await import('./firestore');
            await FirestoreService.create('auditLogs', {
                ...auditEntry,
                timestamp: Timestamp.fromDate(auditEntry.timestamp),
            });
        }
        catch (error) {
            console.error('Failed to persist audit entry:', error);
        }
    }
    /**
     * Persist security entry to Firestore
     */
    async persistSecurityEntry(securityEntry) {
        try {
            const { FirestoreService } = await import('./firestore');
            await FirestoreService.create('securityLogs', {
                ...securityEntry,
                timestamp: Timestamp.fromDate(securityEntry.timestamp),
            });
        }
        catch (error) {
            console.error('Failed to persist security entry:', error);
        }
    }
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    /**
     * Initialize logger
     */
    initializeLogger() {
        // Set up periodic log cleanup
        setInterval(() => {
            this.cleanupOldLogs();
        }, 3600000); // Every hour
        console.log('Firebase Logger Service initialized');
    }
    /**
     * Check if log level should be logged
     */
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const logLevelIndex = levels.indexOf(level);
        return logLevelIndex >= currentLevelIndex;
    }
    /**
     * Output log entry to console
     */
    outputToConsole(logEntry) {
        const timestamp = logEntry.timestamp.toISOString();
        const level = logEntry.level.toUpperCase();
        const category = logEntry.category.toUpperCase();
        const message = `[${timestamp}] [${level}] [${category}] ${logEntry.operation}: ${logEntry.message}`;
        switch (logEntry.level) {
            case LogLevel.DEBUG:
                console.debug(message, logEntry.metadata);
                break;
            case LogLevel.INFO:
                console.info(message, logEntry.metadata);
                break;
            case LogLevel.WARN:
                console.warn(message, logEntry.metadata);
                break;
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
                console.error(message, logEntry.metadata);
                break;
        }
    }
    /**
     * Sanitize metadata to remove sensitive information
     */
    sanitizeMetadata(metadata) {
        if (!metadata)
            return metadata;
        if (typeof metadata === 'string') {
            return this.sanitizeString(metadata);
        }
        if (Array.isArray(metadata)) {
            return metadata.map(item => this.sanitizeMetadata(item));
        }
        if (typeof metadata === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(metadata)) {
                if (this.config.sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                    sanitized[key] = '[REDACTED]';
                }
                else {
                    sanitized[key] = this.sanitizeMetadata(value);
                }
            }
            return sanitized;
        }
        return metadata;
    }
    /**
     * Sanitize string for sensitive information
     */
    sanitizeString(str) {
        // Basic email sanitization
        return str.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[EMAIL]');
    }
    /**
     * Generate unique log ID
     */
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get client IP address
     */
    getClientIP() {
        // This would be implemented based on your environment
        return 'unknown';
    }
    /**
     * Get user agent
     */
    getUserAgent() {
        return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    }
    /**
     * Send security alert
     */
    async sendSecurityAlert(securityEntry) {
        console.error('CRITICAL SECURITY ALERT:', securityEntry);
        // Here you would integrate with your alerting system
        // For example, send to Slack, email, or webhook
    }
    /**
     * Clean up old logs
     */
    cleanupOldLogs() {
        const cutoffDate = new Date(Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000));
        // Clean up log buffer
        this.logBuffer = this.logBuffer.filter(log => log.timestamp > cutoffDate);
        // Clean up audit buffer
        this.auditBuffer = this.auditBuffer.filter(audit => audit.timestamp > cutoffDate);
        // Clean up security buffer
        this.securityBuffer = this.securityBuffer.filter(security => security.timestamp > cutoffDate);
        console.log('Old logs cleaned up');
    }
    // ===========================================
    // PUBLIC API METHODS
    // ===========================================
    /**
     * Update logger configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        console.log('Logger configuration updated');
    }
    /**
     * Get recent logs
     */
    getRecentLogs(limit = 100) {
        return this.logBuffer
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get recent audit logs
     */
    getRecentAuditLogs(limit = 100) {
        return this.auditBuffer
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get recent security logs
     */
    getRecentSecurityLogs(limit = 100) {
        return this.securityBuffer
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Export logs
     */
    exportLogs() {
        return {
            timestamp: new Date(),
            logs: this.logBuffer,
            auditLogs: this.auditBuffer,
            securityLogs: this.securityBuffer,
        };
    }
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logBuffer = [];
        this.auditBuffer = [];
        this.securityBuffer = [];
        console.log('All logs cleared');
    }
}
// Export singleton instance
export const firebaseLogger = FirebaseLoggerService.getInstance();
