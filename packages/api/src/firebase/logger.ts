/**
 * Comprehensive Logging Service for Firebase Operations
 * Provides structured logging, audit trails, and operation tracking
 */

import { Timestamp } from 'firebase/firestore';

// ===========================================
// LOGGING TYPES AND INTERFACES
// ===========================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum LogCategory {
  AUTH = 'auth',
  FIRESTORE = 'firestore',
  STORAGE = 'storage',
  FUNCTIONS = 'functions',
  ANALYTICS = 'analytics',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  SYSTEM = 'system'
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

// ===========================================
// FIREBASE LOGGER SERVICE
// ===========================================

export class FirebaseLoggerService {
  private static instance: FirebaseLoggerService;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private auditBuffer: AuditLogEntry[] = [];
  private securityBuffer: SecurityLogEntry[] = [];
  private sessionId: string;

  private constructor() {
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

  static getInstance(): FirebaseLoggerService {
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
  debug(category: LogCategory, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, category, operation, message, metadata);
  }

  /**
   * Log info message
   */
  info(category: LogCategory, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, operation, message, metadata);
  }

  /**
   * Log warning message
   */
  warn(category: LogCategory, operation: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, operation, message, metadata);
  }

  /**
   * Log error message
   */
  error(category: LogCategory, operation: string, message: string, error?: Error, metadata?: Record<string, any>): void {
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
  critical(category: LogCategory, operation: string, message: string, error?: Error, metadata?: Record<string, any>): void {
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
  private log(
    level: LogLevel,
    category: LogCategory,
    operation: string,
    message: string,
    metadata?: Record<string, any>,
    success: boolean = true
  ): void {
    // Check if log level is enabled
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
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
  logFirestoreOperation(
    operation: 'read' | 'write' | 'update' | 'delete' | 'query',
    collection: string,
    documentId?: string,
    success: boolean = true,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const message = `Firestore ${operation} on ${collection}${documentId ? `/${documentId}` : ''}`;
    
    this.log(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.FIRESTORE,
      operation,
      message,
      {
        collection,
        documentId,
        duration,
        ...metadata,
      },
      success
    );
  }

  /**
   * Log Storage operation
   */
  logStorageOperation(
    operation: 'upload' | 'download' | 'delete' | 'list',
    path: string,
    success: boolean = true,
    duration?: number,
    fileSize?: number,
    metadata?: Record<string, any>
  ): void {
    const message = `Storage ${operation} at ${path}`;
    
    this.log(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.STORAGE,
      operation,
      message,
      {
        path,
        duration,
        fileSize,
        ...metadata,
      },
      success
    );
  }

  /**
   * Log Functions operation
   */
  logFunctionOperation(
    functionName: string,
    success: boolean = true,
    duration?: number,
    inputData?: any,
    outputData?: any,
    metadata?: Record<string, any>
  ): void {
    const message = `Function ${functionName} ${success ? 'executed' : 'failed'}`;
    
    this.log(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.FUNCTIONS,
      'call',
      message,
      {
        functionName,
        duration,
        inputData: this.sanitizeMetadata(inputData),
        outputData: this.sanitizeMetadata(outputData),
        ...metadata,
      },
      success
    );
  }

  /**
   * Log Authentication operation
   */
  logAuthOperation(
    operation: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
    userId?: string,
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const message = `Authentication ${operation} ${success ? 'successful' : 'failed'}`;
    
    this.log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.AUTH,
      operation,
      message,
      {
        userId,
        ...metadata,
      },
      success
    );
  }

  // ===========================================
  // AUDIT LOGGING
  // ===========================================

  /**
   * Log audit event
   */
  logAuditEvent(
    userId: string,
    userRole: string,
    action: string,
    resource: string,
    resourceId?: string,
    oldValue?: any,
    newValue?: any,
    success: boolean = true,
    reason?: string
  ): void {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const auditEntry: AuditLogEntry = {
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
  logSecurityEvent(
    type: SecurityLogEntry['type'],
    severity: SecurityLogEntry['severity'],
    action: string,
    details: Record<string, any>,
    userId?: string,
    resource?: string,
    blocked: boolean = false
  ): void {
    if (!this.config.enableSecurityLogging) {
      return;
    }

    const securityEntry: SecurityLogEntry = {
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
  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      operation,
      `Operation completed in ${duration}ms`,
      {
        duration,
        ...metadata,
      }
    );
  }

  /**
   * Measure and log operation performance
   */
  async measureOperation<T>(
    operation: string,
    category: LogCategory,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.log(
        LogLevel.INFO,
        category,
        operation,
        `Operation completed successfully in ${duration}ms`,
        {
          duration,
          ...metadata,
        }
      );

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log(
        LogLevel.ERROR,
        category,
        operation,
        `Operation failed after ${duration}ms: ${(error as Error).message}`,
        {
          duration,
          error: (error as Error).message,
          ...metadata,
        },
        false
      );

      throw error;
    }
  }

  // ===========================================
  // PERSISTENCE METHODS
  // ===========================================

  /**
   * Persist log entry to Firestore
   */
  private async persistLogEntry(logEntry: LogEntry): Promise<void> {
    try {
      const { FirestoreService } = await import('./firestore');
      
      await FirestoreService.create('logs', {
        ...logEntry,
        timestamp: Timestamp.fromDate(logEntry.timestamp),
      });

    } catch (error) {
      // Don't throw here to avoid infinite logging loops
      console.error('Failed to persist log entry:', error);
    }
  }

  /**
   * Persist audit entry to Firestore
   */
  private async persistAuditEntry(auditEntry: AuditLogEntry): Promise<void> {
    try {
      const { FirestoreService } = await import('./firestore');
      
      await FirestoreService.create('auditLogs', {
        ...auditEntry,
        timestamp: Timestamp.fromDate(auditEntry.timestamp),
      });

    } catch (error) {
      console.error('Failed to persist audit entry:', error);
    }
  }

  /**
   * Persist security entry to Firestore
   */
  private async persistSecurityEntry(securityEntry: SecurityLogEntry): Promise<void> {
    try {
      const { FirestoreService } = await import('./firestore');
      
      await FirestoreService.create('securityLogs', {
        ...securityEntry,
        timestamp: Timestamp.fromDate(securityEntry.timestamp),
      });

    } catch (error) {
      console.error('Failed to persist security entry:', error);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Initialize logger
   */
  private initializeLogger(): void {
    // Set up periodic log cleanup
    setInterval(() => {
      this.cleanupOldLogs();
    }, 3600000); // Every hour

    console.log('Firebase Logger Service initialized');
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(logEntry: LogEntry): void {
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
  private sanitizeMetadata(metadata?: any): any {
    if (!metadata) return metadata;

    if (typeof metadata === 'string') {
      return this.sanitizeString(metadata);
    }

    if (Array.isArray(metadata)) {
      return metadata.map(item => this.sanitizeMetadata(item));
    }

    if (typeof metadata === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(metadata)) {
        if (this.config.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        } else {
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
  private sanitizeString(str: string): string {
    // Basic email sanitization
    return str.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[EMAIL]');
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(): string {
    // This would be implemented based on your environment
    return 'unknown';
  }

  /**
   * Get user agent
   */
  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(securityEntry: SecurityLogEntry): Promise<void> {
    console.error('CRITICAL SECURITY ALERT:', securityEntry);
    
    // Here you would integrate with your alerting system
    // For example, send to Slack, email, or webhook
  }

  /**
   * Clean up old logs
   */
  private cleanupOldLogs(): void {
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
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Logger configuration updated');
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logBuffer
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent audit logs
   */
  getRecentAuditLogs(limit: number = 100): AuditLogEntry[] {
    return this.auditBuffer
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent security logs
   */
  getRecentSecurityLogs(limit: number = 100): SecurityLogEntry[] {
    return this.securityBuffer
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Export logs
   */
  exportLogs(): {
    timestamp: Date;
    logs: LogEntry[];
    auditLogs: AuditLogEntry[];
    securityLogs: SecurityLogEntry[];
  } {
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
  clearLogs(): void {
    this.logBuffer = [];
    this.auditBuffer = [];
    this.securityBuffer = [];
    console.log('All logs cleared');
  }
}

// Export singleton instance
export const firebaseLogger = FirebaseLoggerService.getInstance();