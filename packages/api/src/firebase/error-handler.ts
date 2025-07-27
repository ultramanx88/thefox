/**
 * Centralized Error Handling Service for Firebase Operations
 * Handles all Firebase-related errors with proper logging, retry logic, and monitoring
 */

import { 
  FirebaseError,
  FirestoreError,
  AuthError,
  StorageError,
  FunctionsError
} from 'firebase/app';

// ===========================================
// ERROR TYPES AND INTERFACES
// ===========================================

export interface ErrorContext {
  operation: string;
  service: 'firestore' | 'auth' | 'storage' | 'functions' | 'analytics';
  userId?: string;
  documentPath?: string;
  functionName?: string;
  timestamp: Date;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  error: FirebaseError;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: {
    errorRate: number; // errors per minute
    quotaUsage: number; // percentage
    responseTime: number; // milliseconds
  };
  channels: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
}

// ===========================================
// ERROR CATEGORIES
// ===========================================

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  QUOTA = 'quota',
  STORAGE = 'storage',
  FUNCTIONS = 'functions',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ===========================================
// FIREBASE ERROR HANDLER
// ===========================================

export class FirebaseErrorHandler {
  private static instance: FirebaseErrorHandler;
  private errorLogs: Map<string, ErrorLog> = new Map();
  private retryConfig: RetryConfig;
  private alertConfig: AlertConfig;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, Date> = new Map();

  private constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'internal',
        'cancelled',
        'unknown'
      ]
    };

    this.alertConfig = {
      enabled: true,
      thresholds: {
        errorRate: 10, // 10 errors per minute
        quotaUsage: 80, // 80% quota usage
        responseTime: 5000 // 5 seconds
      },
      channels: {
        email: ['admin@thefox.app'],
        webhook: process.env.ALERT_WEBHOOK_URL,
      }
    };

    this.initializeErrorTracking();
  }

  static getInstance(): FirebaseErrorHandler {
    if (!FirebaseErrorHandler.instance) {
      FirebaseErrorHandler.instance = new FirebaseErrorHandler();
    }
    return FirebaseErrorHandler.instance;
  }

  // ===========================================
  // ERROR HANDLING METHODS
  // ===========================================

  /**
   * Handle Firebase authentication errors
   */
  async handleAuthError(error: AuthError, context: Partial<ErrorContext>): Promise<void> {
    const fullContext: ErrorContext = {
      service: 'auth',
      operation: context.operation || 'unknown',
      timestamp: new Date(),
      ...context
    };

    const category = this.categorizeAuthError(error);
    const severity = this.determineSeverity(error, category);

    await this.logError(error, fullContext, severity);

    // Handle specific auth errors
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        // Don't retry authentication errors
        break;
      
      case 'auth/too-many-requests':
        // Rate limiting - implement backoff
        await this.handleRateLimit(error, fullContext);
        break;
      
      case 'auth/network-request-failed':
        // Network error - can retry
        throw new Error('Network error during authentication. Please try again.');
      
      default:
        console.error('Unhandled auth error:', error);
    }
  }

  /**
   * Handle Firestore database errors
   */
  async handleFirestoreError(error: FirestoreError, context: Partial<ErrorContext>): Promise<void> {
    const fullContext: ErrorContext = {
      service: 'firestore',
      operation: context.operation || 'unknown',
      timestamp: new Date(),
      ...context
    };

    const category = this.categorizeFirestoreError(error);
    const severity = this.determineSeverity(error, category);

    await this.logError(error, fullContext, severity);

    // Handle specific Firestore errors
    switch (error.code) {
      case 'permission-denied':
        throw new Error('Access denied. Please check your permissions.');
      
      case 'not-found':
        throw new Error('Document not found.');
      
      case 'already-exists':
        throw new Error('Document already exists.');
      
      case 'resource-exhausted':
        await this.handleQuotaExceeded(error, fullContext);
        throw new Error('Service temporarily unavailable. Please try again later.');
      
      case 'unavailable':
      case 'deadline-exceeded':
        // These can be retried
        throw error;
      
      default:
        console.error('Unhandled Firestore error:', error);
        throw error;
    }
  }

  /**
   * Handle Firebase Storage errors
   */
  async handleStorageError(error: StorageError, context: Partial<ErrorContext>): Promise<void> {
    const fullContext: ErrorContext = {
      service: 'storage',
      operation: context.operation || 'unknown',
      timestamp: new Date(),
      ...context
    };

    const category = this.categorizeStorageError(error);
    const severity = this.determineSeverity(error, category);

    await this.logError(error, fullContext, severity);

    // Handle specific Storage errors
    switch (error.code) {
      case 'storage/object-not-found':
        throw new Error('File not found.');
      
      case 'storage/unauthorized':
        throw new Error('Unauthorized access to file.');
      
      case 'storage/quota-exceeded':
        await this.handleQuotaExceeded(error, fullContext);
        throw new Error('Storage quota exceeded. Please contact support.');
      
      case 'storage/invalid-format':
        throw new Error('Invalid file format.');
      
      case 'storage/retry-limit-exceeded':
        throw new Error('Upload failed after multiple attempts. Please try again.');
      
      default:
        console.error('Unhandled Storage error:', error);
        throw error;
    }
  }

  /**
   * Handle Cloud Functions errors
   */
  async handleFunctionError(error: FunctionsError, context: Partial<ErrorContext>): Promise<void> {
    const fullContext: ErrorContext = {
      service: 'functions',
      operation: context.operation || 'unknown',
      timestamp: new Date(),
      ...context
    };

    const category = this.categorizeFunctionError(error);
    const severity = this.determineSeverity(error, category);

    await this.logError(error, fullContext, severity);

    // Handle specific Functions errors
    switch (error.code) {
      case 'functions/not-found':
        throw new Error('Function not found.');
      
      case 'functions/permission-denied':
        throw new Error('Permission denied to call function.');
      
      case 'functions/deadline-exceeded':
        throw new Error('Function timeout. Please try again.');
      
      case 'functions/resource-exhausted':
        await this.handleQuotaExceeded(error, fullContext);
        throw new Error('Service temporarily unavailable.');
      
      default:
        console.error('Unhandled Functions error:', error);
        throw error;
    }
  }

  // ===========================================
  // RETRY LOGIC
  // ===========================================

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customConfig };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry
        if (attempt > 0) {
          console.log(`Operation succeeded after ${attempt} retries:`, context.operation);
        }
        
        return result;

      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error as FirebaseError)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.log(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${config.maxRetries}):`, context.operation);
        
        await this.delay(delay);
      }
    }

    // All retries failed
    await this.logError(lastError as FirebaseError, context, ErrorSeverity.HIGH);
    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: FirebaseError): boolean {
    return this.retryConfig.retryableErrors.includes(error.code);
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================
  // ERROR CATEGORIZATION
  // ===========================================

  private categorizeAuthError(error: AuthError): ErrorCategory {
    const authErrors = {
      'auth/user-not-found': ErrorCategory.AUTHENTICATION,
      'auth/wrong-password': ErrorCategory.AUTHENTICATION,
      'auth/invalid-email': ErrorCategory.VALIDATION,
      'auth/user-disabled': ErrorCategory.AUTHORIZATION,
      'auth/too-many-requests': ErrorCategory.QUOTA,
      'auth/network-request-failed': ErrorCategory.NETWORK,
    };

    return authErrors[error.code] || ErrorCategory.UNKNOWN;
  }

  private categorizeFirestoreError(error: FirestoreError): ErrorCategory {
    const firestoreErrors = {
      'permission-denied': ErrorCategory.AUTHORIZATION,
      'not-found': ErrorCategory.VALIDATION,
      'already-exists': ErrorCategory.VALIDATION,
      'resource-exhausted': ErrorCategory.QUOTA,
      'unavailable': ErrorCategory.NETWORK,
      'deadline-exceeded': ErrorCategory.NETWORK,
    };

    return firestoreErrors[error.code] || ErrorCategory.UNKNOWN;
  }

  private categorizeStorageError(error: StorageError): ErrorCategory {
    const storageErrors = {
      'storage/object-not-found': ErrorCategory.VALIDATION,
      'storage/unauthorized': ErrorCategory.AUTHORIZATION,
      'storage/quota-exceeded': ErrorCategory.QUOTA,
      'storage/invalid-format': ErrorCategory.VALIDATION,
      'storage/retry-limit-exceeded': ErrorCategory.NETWORK,
    };

    return storageErrors[error.code] || ErrorCategory.UNKNOWN;
  }

  private categorizeFunctionError(error: FunctionsError): ErrorCategory {
    const functionErrors = {
      'functions/not-found': ErrorCategory.VALIDATION,
      'functions/permission-denied': ErrorCategory.AUTHORIZATION,
      'functions/deadline-exceeded': ErrorCategory.NETWORK,
      'functions/resource-exhausted': ErrorCategory.QUOTA,
    };

    return functionErrors[error.code] || ErrorCategory.UNKNOWN;
  }

  // ===========================================
  // SEVERITY DETERMINATION
  // ===========================================

  private determineSeverity(error: FirebaseError, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.QUOTA) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (category === ErrorCategory.AUTHORIZATION || 
        error.code.includes('permission-denied')) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (category === ErrorCategory.NETWORK || 
        category === ErrorCategory.STORAGE) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors (validation, etc.)
    return ErrorSeverity.LOW;
  }

  // ===========================================
  // LOGGING AND MONITORING
  // ===========================================

  /**
   * Log error with context
   */
  private async logError(
    error: FirebaseError, 
    context: ErrorContext, 
    severity: ErrorSeverity
  ): Promise<void> {
    const errorId = this.generateErrorId();
    
    const errorLog: ErrorLog = {
      id: errorId,
      error,
      context,
      severity,
      resolved: false,
      retryCount: 0,
      maxRetries: this.retryConfig.maxRetries,
      createdAt: new Date(),
    };

    this.errorLogs.set(errorId, errorLog);

    // Console logging
    console.error(`[${severity.toUpperCase()}] Firebase Error:`, {
      id: errorId,
      code: error.code,
      message: error.message,
      service: context.service,
      operation: context.operation,
      timestamp: context.timestamp.toISOString(),
    });

    // Update error counts for alerting
    this.updateErrorCounts(error.code);

    // Check if we need to send alerts
    await this.checkAlertThresholds();

    // Store in Firestore for persistence (if available)
    try {
      await this.persistErrorLog(errorLog);
    } catch (persistError) {
      console.warn('Failed to persist error log:', persistError);
    }
  }

  /**
   * Persist error log to Firestore
   */
  private async persistErrorLog(errorLog: ErrorLog): Promise<void> {
    try {
      const { FirestoreService } = await import('./firestore');
      
      await FirestoreService.create('errorLogs', {
        id: errorLog.id,
        errorCode: errorLog.error.code,
        errorMessage: errorLog.error.message,
        context: errorLog.context,
        severity: errorLog.severity,
        resolved: errorLog.resolved,
        retryCount: errorLog.retryCount,
        createdAt: errorLog.createdAt,
      });

    } catch (error) {
      // Don't throw here to avoid infinite error loops
      console.warn('Failed to persist error log to Firestore:', error);
    }
  }

  // ===========================================
  // ALERTING SYSTEM
  // ===========================================

  /**
   * Handle quota exceeded scenarios
   */
  private async handleQuotaExceeded(error: FirebaseError, context: ErrorContext): Promise<void> {
    console.error('QUOTA EXCEEDED:', {
      service: context.service,
      operation: context.operation,
      timestamp: context.timestamp,
    });

    // Send immediate alert
    await this.sendAlert({
      type: 'quota_exceeded',
      service: context.service,
      error: error.message,
      timestamp: context.timestamp,
    });
  }

  /**
   * Handle rate limiting
   */
  private async handleRateLimit(error: FirebaseError, context: ErrorContext): Promise<void> {
    console.warn('RATE LIMIT HIT:', {
      service: context.service,
      operation: context.operation,
      timestamp: context.timestamp,
    });

    // Implement exponential backoff
    const backoffTime = 60000; // 1 minute
    console.log(`Backing off for ${backoffTime}ms due to rate limiting`);
    
    await this.delay(backoffTime);
  }

  /**
   * Update error counts for alerting
   */
  private updateErrorCounts(errorCode: string): void {
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);
    this.lastErrorTime.set(errorCode, new Date());
  }

  /**
   * Check if alert thresholds are exceeded
   */
  private async checkAlertThresholds(): Promise<void> {
    if (!this.alertConfig.enabled) return;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Count errors in the last minute
    let recentErrorCount = 0;
    for (const [errorCode, lastTime] of this.lastErrorTime.entries()) {
      if (lastTime > oneMinuteAgo) {
        recentErrorCount += this.errorCounts.get(errorCode) || 0;
      }
    }

    // Check error rate threshold
    if (recentErrorCount >= this.alertConfig.thresholds.errorRate) {
      await this.sendAlert({
        type: 'high_error_rate',
        errorCount: recentErrorCount,
        threshold: this.alertConfig.thresholds.errorRate,
        timestamp: now,
      });
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alertData: any): Promise<void> {
    console.error('ALERT TRIGGERED:', alertData);

    // Send email alerts
    if (this.alertConfig.channels.email) {
      // Implementation would integrate with email service
      console.log('Email alert sent to:', this.alertConfig.channels.email);
    }

    // Send webhook alerts
    if (this.alertConfig.channels.webhook) {
      try {
        await fetch(this.alertConfig.channels.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData),
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    // Set up periodic cleanup of old error logs
    setInterval(() => {
      this.cleanupOldErrorLogs();
    }, 3600000); // Every hour

    console.log('Firebase Error Handler initialized');
  }

  /**
   * Clean up old error logs
   */
  private cleanupOldErrorLogs(): void {
    const oneDayAgo = new Date(Date.now() - 86400000); // 24 hours ago
    
    for (const [id, errorLog] of this.errorLogs.entries()) {
      if (errorLog.createdAt < oneDayAgo && errorLog.resolved) {
        this.errorLogs.delete(id);
      }
    }

    // Reset error counts
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByService: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorLog[];
  } {
    const errorsByService: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const recentErrors: ErrorLog[] = [];

    const oneDayAgo = new Date(Date.now() - 86400000);

    for (const errorLog of this.errorLogs.values()) {
      // Count by service
      errorsByService[errorLog.context.service] = 
        (errorsByService[errorLog.context.service] || 0) + 1;

      // Count by severity
      errorsBySeverity[errorLog.severity] = 
        (errorsBySeverity[errorLog.severity] || 0) + 1;

      // Recent errors
      if (errorLog.createdAt > oneDayAgo) {
        recentErrors.push(errorLog);
      }
    }

    return {
      totalErrors: this.errorLogs.size,
      errorsByService,
      errorsBySeverity,
      recentErrors: recentErrors.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): void {
    const errorLog = this.errorLogs.get(errorId);
    if (errorLog) {
      errorLog.resolved = true;
      errorLog.resolvedAt = new Date();
    }
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }
}

// Export singleton instance
export const firebaseErrorHandler = FirebaseErrorHandler.getInstance();