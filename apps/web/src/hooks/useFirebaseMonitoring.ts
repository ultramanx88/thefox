/**
 * React Hook for Firebase Monitoring and Error Handling
 * Provides easy access to monitoring, error handling, and logging in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  integratedFirebaseMonitoring,
  firebaseErrorHandler,
  firebaseMonitoringService,
  firebaseLogger
} from '@repo/api/firebase/config';

// ===========================================
// HOOK TYPES
// ===========================================

interface UseFirebaseMonitoringOptions {
  autoInitialize?: boolean;
  enableErrorHandling?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableLogging?: boolean;
  enableAlerting?: boolean;
}

interface MonitoringState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  systemStatus: any;
  activeAlerts: any[];
  errorStats: any;
  performanceMetrics: any;
}

interface OperationOptions {
  userId?: string;
  metadata?: Record<string, any>;
  enableRetry?: boolean;
  maxRetries?: number;
}

// ===========================================
// MAIN MONITORING HOOK
// ===========================================

export function useFirebaseMonitoring(options: UseFirebaseMonitoringOptions = {}) {
  const {
    autoInitialize = true,
    enableErrorHandling = true,
    enablePerformanceMonitoring = true,
    enableLogging = true,
    enableAlerting = true,
  } = options;

  const [state, setState] = useState<MonitoringState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    systemStatus: null,
    activeAlerts: [],
    errorStats: null,
    performanceMetrics: null,
  });

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize monitoring system
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await integratedFirebaseMonitoring.initialize({
        enableErrorHandling,
        enablePerformanceMonitoring,
        enableLogging,
        enableAlerting,
      });

      setState(prev => ({ ...prev, isInitialized: true, isLoading: false }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [enableErrorHandling, enablePerformanceMonitoring, enableLogging, enableAlerting, state.isInitialized, state.isLoading]);

  // Update monitoring data periodically
  const updateMonitoringData = useCallback(() => {
    if (!state.isInitialized) return;

    try {
      const systemStatus = integratedFirebaseMonitoring.getSystemStatus();
      const activeAlerts = integratedFirebaseMonitoring.getActiveAlerts();
      const errorStats = firebaseErrorHandler.getErrorStats();
      const performanceReport = firebaseMonitoringService.generatePerformanceReport();

      setState(prev => ({
        ...prev,
        systemStatus,
        activeAlerts,
        errorStats,
        performanceMetrics: performanceReport,
      }));

    } catch (error) {
      console.error('Failed to update monitoring data:', error);
    }
  }, [state.isInitialized]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isLoading]);

  // Set up periodic updates
  useEffect(() => {
    if (state.isInitialized) {
      updateMonitoringData(); // Initial update
      
      updateIntervalRef.current = setInterval(updateMonitoringData, 10000); // Update every 10 seconds
      
      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    }
  }, [state.isInitialized, updateMonitoringData]);

  return {
    ...state,
    initialize,
    updateMonitoringData,
    service: integratedFirebaseMonitoring,
  };
}

// ===========================================
// OPERATION MONITORING HOOKS
// ===========================================

export function useMonitoredFirestoreOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeOperation = useCallback(async <T>(
    operation: 'read' | 'write' | 'update' | 'delete' | 'query',
    collection: string,
    documentId: string | undefined,
    fn: () => Promise<T>,
    options: OperationOptions = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await integratedFirebaseMonitoring.monitorFirestoreOperation(
        operation,
        collection,
        documentId,
        fn,
        options.userId,
        options.metadata
      );

      setIsLoading(false);
      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    executeOperation,
    isLoading,
    error,
  };
}

export function useMonitoredStorageOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const executeOperation = useCallback(async <T>(
    operation: 'upload' | 'download' | 'delete' | 'list',
    path: string,
    fn: () => Promise<T>,
    options: OperationOptions = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await integratedFirebaseMonitoring.monitorStorageOperation(
        operation,
        path,
        fn,
        options.userId,
        options.metadata
      );

      setIsLoading(false);
      setProgress(100);
      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      setProgress(0);
      throw error;
    }
  }, []);

  return {
    executeOperation,
    isLoading,
    error,
    progress,
    setProgress, // For manual progress updates during uploads
  };
}

export function useMonitoredFunctionCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const callFunction = useCallback(async <T>(
    functionName: string,
    fn: () => Promise<T>,
    options: OperationOptions & { inputData?: any } = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await integratedFirebaseMonitoring.monitorFunctionOperation(
        functionName,
        fn,
        options.userId,
        options.inputData,
        options.metadata
      );

      setIsLoading(false);
      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    callFunction,
    isLoading,
    error,
  };
}

export function useMonitoredAuthOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAuth = useCallback(async <T>(
    operation: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
    fn: () => Promise<T>,
    options: OperationOptions = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await integratedFirebaseMonitoring.monitorAuthOperation(
        operation,
        fn,
        options.userId,
        options.metadata
      );

      setIsLoading(false);
      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    executeAuth,
    isLoading,
    error,
  };
}

// ===========================================
// PERFORMANCE MONITORING HOOKS
// ===========================================

export function usePerformanceTrace(traceName: string) {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const traceIdRef = useRef<string | null>(null);

  const startTrace = useCallback((metadata?: Record<string, string>) => {
    if (isActive) return;

    const traceId = firebaseMonitoringService.startTrace(traceName, metadata);
    traceIdRef.current = traceId;
    setIsActive(true);
    setDuration(null);
  }, [traceName, isActive]);

  const stopTrace = useCallback((customMetrics?: Record<string, number>) => {
    if (!isActive || !traceIdRef.current) return;

    firebaseMonitoringService.stopTrace(traceIdRef.current, customMetrics);
    setIsActive(false);
    traceIdRef.current = null;
  }, [isActive]);

  const measureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    metadata?: Record<string, string>
  ): Promise<T> => {
    const startTime = Date.now();
    startTrace(metadata);

    try {
      const result = await operation();
      const operationDuration = Date.now() - startTime;
      
      stopTrace({ duration: operationDuration });
      setDuration(operationDuration);
      
      return result;

    } catch (error) {
      const operationDuration = Date.now() - startTime;
      
      stopTrace({ 
        duration: operationDuration,
        error: 1 
      });
      setDuration(operationDuration);
      
      throw error;
    }
  }, [startTrace, stopTrace]);

  return {
    startTrace,
    stopTrace,
    measureOperation,
    isActive,
    duration,
  };
}

// ===========================================
// ERROR HANDLING HOOKS
// ===========================================

export function useErrorHandler() {
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  const handleError = useCallback(async (
    error: Error,
    context: {
      operation: string;
      service: 'firestore' | 'storage' | 'functions' | 'auth';
      userId?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      const errorContext = {
        ...context,
        timestamp: new Date(),
      };

      // Handle through error handler
      switch (context.service) {
        case 'firestore':
          await firebaseErrorHandler.handleFirestoreError(error as any, errorContext);
          break;
        case 'storage':
          await firebaseErrorHandler.handleStorageError(error as any, errorContext);
          break;
        case 'functions':
          await firebaseErrorHandler.handleFunctionError(error as any, errorContext);
          break;
        case 'auth':
          await firebaseErrorHandler.handleAuthError(error as any, errorContext);
          break;
      }

      // Update recent errors
      const errorStats = firebaseErrorHandler.getErrorStats();
      setRecentErrors(errorStats.recentErrors.slice(0, 10));

    } catch (handlingError) {
      console.error('Error handling failed:', handlingError);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setRecentErrors([]);
  }, []);

  return {
    handleError,
    recentErrors,
    clearErrors,
  };
}

// ===========================================
// LOGGING HOOKS
// ===========================================

export function useFirebaseLogger() {
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const logOperation = useCallback((
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical',
    category: string,
    operation: string,
    message: string,
    metadata?: Record<string, any>
  ) => {
    switch (level) {
      case 'debug':
        firebaseLogger.debug(category as any, operation, message, metadata);
        break;
      case 'info':
        firebaseLogger.info(category as any, operation, message, metadata);
        break;
      case 'warn':
        firebaseLogger.warn(category as any, operation, message, metadata);
        break;
      case 'error':
        firebaseLogger.error(category as any, operation, message, undefined, metadata);
        break;
      case 'critical':
        firebaseLogger.critical(category as any, operation, message, undefined, metadata);
        break;
    }

    // Update recent logs
    const logs = firebaseLogger.getRecentLogs(20);
    setRecentLogs(logs);
  }, []);

  const logAuditEvent = useCallback((
    userId: string,
    userRole: string,
    action: string,
    resource: string,
    resourceId?: string,
    oldValue?: any,
    newValue?: any,
    success: boolean = true,
    reason?: string
  ) => {
    firebaseLogger.logAuditEvent(
      userId,
      userRole,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      success,
      reason
    );
  }, []);

  const logSecurityEvent = useCallback((
    type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity',
    severity: 'low' | 'medium' | 'high' | 'critical',
    action: string,
    details: Record<string, any>,
    userId?: string,
    resource?: string,
    blocked: boolean = false
  ) => {
    firebaseLogger.logSecurityEvent(
      type,
      severity,
      action,
      details,
      userId,
      resource,
      blocked
    );
  }, []);

  return {
    logOperation,
    logAuditEvent,
    logSecurityEvent,
    recentLogs,
  };
}

// ===========================================
// SYSTEM STATUS HOOKS
// ===========================================

export function useSystemHealth() {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateHealth = () => {
      try {
        const health = firebaseMonitoringService.getSystemHealth();
        setSystemHealth(health);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to get system health:', error);
        setIsLoading(false);
      }
    };

    updateHealth();
    const interval = setInterval(updateHealth, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    systemHealth,
    isLoading,
    isHealthy: systemHealth?.status === 'healthy',
    isDegraded: systemHealth?.status === 'degraded',
    isUnhealthy: systemHealth?.status === 'unhealthy',
  };
}

export function useQuotaMonitoring() {
  const [quotaUsage, setQuotaUsage] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateQuota = () => {
      try {
        const usage = firebaseMonitoringService.getQuotaUsage();
        setQuotaUsage(usage);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to get quota usage:', error);
        setIsLoading(false);
      }
    };

    updateQuota();
    const interval = setInterval(updateQuota, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getHighUsageQuotas = useCallback((threshold: number = 80) => {
    return quotaUsage.filter(quota => quota.percentage >= threshold);
  }, [quotaUsage]);

  const getCriticalQuotas = useCallback((threshold: number = 95) => {
    return quotaUsage.filter(quota => quota.percentage >= threshold);
  }, [quotaUsage]);

  return {
    quotaUsage,
    isLoading,
    getHighUsageQuotas,
    getCriticalQuotas,
  };
}

// ===========================================
// ALERTS HOOK
// ===========================================

export function useAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateAlerts = () => {
      try {
        const activeAlerts = integratedFirebaseMonitoring.getActiveAlerts();
        setAlerts(activeAlerts);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to get alerts:', error);
        setIsLoading(false);
      }
    };

    updateAlerts();
    const interval = setInterval(updateAlerts, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    integratedFirebaseMonitoring.resolveAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  }, []);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
  }, [alerts]);

  const getHighPriorityAlerts = useCallback(() => {
    return alerts.filter(alert => 
      (alert.severity === 'critical' || alert.severity === 'high') && !alert.resolved
    );
  }, [alerts]);

  return {
    alerts,
    isLoading,
    resolveAlert,
    getCriticalAlerts,
    getHighPriorityAlerts,
  };
}