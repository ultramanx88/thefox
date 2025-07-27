/**
 * Centralized Error Handling Service for Firebase Operations
 * Handles all Firebase-related errors with proper logging, retry logic, and monitoring
 */
import { FirebaseError, FirestoreError, AuthError, StorageError, FunctionsError } from 'firebase/app';
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
        errorRate: number;
        quotaUsage: number;
        responseTime: number;
    };
    channels: {
        email?: string[];
        webhook?: string;
        slack?: string;
    };
}
export declare enum ErrorCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    VALIDATION = "validation",
    NETWORK = "network",
    QUOTA = "quota",
    STORAGE = "storage",
    FUNCTIONS = "functions",
    UNKNOWN = "unknown"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class FirebaseErrorHandler {
    private static instance;
    private errorLogs;
    private retryConfig;
    private alertConfig;
    private errorCounts;
    private lastErrorTime;
    private constructor();
    static getInstance(): FirebaseErrorHandler;
    /**
     * Handle Firebase authentication errors
     */
    handleAuthError(error: AuthError, context: Partial<ErrorContext>): Promise<void>;
    /**
     * Handle Firestore database errors
     */
    handleFirestoreError(error: FirestoreError, context: Partial<ErrorContext>): Promise<void>;
    /**
     * Handle Firebase Storage errors
     */
    handleStorageError(error: StorageError, context: Partial<ErrorContext>): Promise<void>;
    /**
     * Handle Cloud Functions errors
     */
    handleFunctionError(error: FunctionsError, context: Partial<ErrorContext>): Promise<void>;
    /**
     * Retry operation with exponential backoff
     */
    retryOperation<T>(operation: () => Promise<T>, context: ErrorContext, customConfig?: Partial<RetryConfig>): Promise<T>;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Delay utility for retry logic
     */
    private delay;
    private categorizeAuthError;
    private categorizeFirestoreError;
    private categorizeStorageError;
    private categorizeFunctionError;
    private determineSeverity;
    /**
     * Log error with context
     */
    private logError;
    /**
     * Persist error log to Firestore
     */
    private persistErrorLog;
    /**
     * Handle quota exceeded scenarios
     */
    private handleQuotaExceeded;
    /**
     * Handle rate limiting
     */
    private handleRateLimit;
    /**
     * Update error counts for alerting
     */
    private updateErrorCounts;
    /**
     * Check if alert thresholds are exceeded
     */
    private checkAlertThresholds;
    /**
     * Send alert notification
     */
    private sendAlert;
    /**
     * Initialize error tracking
     */
    private initializeErrorTracking;
    /**
     * Clean up old error logs
     */
    private cleanupOldErrorLogs;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByService: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        recentErrors: ErrorLog[];
    };
    /**
     * Mark error as resolved
     */
    resolveError(errorId: string): void;
    /**
     * Update retry configuration
     */
    updateRetryConfig(config: Partial<RetryConfig>): void;
    /**
     * Update alert configuration
     */
    updateAlertConfig(config: Partial<AlertConfig>): void;
}
export declare const firebaseErrorHandler: FirebaseErrorHandler;
