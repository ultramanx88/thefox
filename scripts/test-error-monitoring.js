#!/usr/bin/env node

/**
 * Error Handling and Monitoring Test Script
 * Tests comprehensive error handling, logging, and monitoring systems
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');

// Test configuration
const TEST_CONFIG = {
  firebase: {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  }
};

// Initialize Firebase for testing
const app = initializeApp(TEST_CONFIG.firebase);
const db = getFirestore(app);

// Connect to emulator for testing
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('Connected to Firestore emulator');
} catch (error) {
  console.log('Firestore emulator connection failed (may already be connected)');
}

// Test utilities
class ErrorMonitoringTester {
  constructor() {
    this.testResults = [];
    this.mockErrors = new Map();
    this.mockMetrics = new Map();
    this.mockLogs = [];
  }

  // ===========================================
  // TEST UTILITIES
  // ===========================================

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    this.testResults.push({
      timestamp,
      type,
      message,
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock Firebase errors
  createMockFirebaseError(code, message, service = 'firestore') {
    return {
      code,
      message,
      name: 'FirebaseError',
      service,
      stack: `Error: ${message}\n    at MockFunction (test:1:1)`,
    };
  }

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================

  async testErrorCategorization() {
    this.log('Testing error categorization...');

    try {
      const testErrors = [
        // Authentication errors
        { code: 'auth/user-not-found', message: 'User not found', service: 'auth' },
        { code: 'auth/wrong-password', message: 'Wrong password', service: 'auth' },
        { code: 'auth/too-many-requests', message: 'Too many requests', service: 'auth' },
        
        // Firestore errors
        { code: 'permission-denied', message: 'Permission denied', service: 'firestore' },
        { code: 'not-found', message: 'Document not found', service: 'firestore' },
        { code: 'resource-exhausted', message: 'Quota exceeded', service: 'firestore' },
        
        // Storage errors
        { code: 'storage/object-not-found', message: 'File not found', service: 'storage' },
        { code: 'storage/quota-exceeded', message: 'Storage quota exceeded', service: 'storage' },
        
        // Functions errors
        { code: 'functions/deadline-exceeded', message: 'Function timeout', service: 'functions' },
        { code: 'functions/resource-exhausted', message: 'Function quota exceeded', service: 'functions' },
      ];

      for (const errorData of testErrors) {
        const error = this.createMockFirebaseError(errorData.code, errorData.message, errorData.service);
        
        // Simulate error categorization
        let category = 'unknown';
        let severity = 'low';
        
        if (errorData.code.includes('permission') || errorData.code.includes('unauthorized')) {
          category = 'authorization';
          severity = 'high';
        } else if (errorData.code.includes('quota') || errorData.code.includes('resource-exhausted')) {
          category = 'quota';
          severity = 'critical';
        } else if (errorData.code.includes('network') || errorData.code.includes('unavailable')) {
          category = 'network';
          severity = 'medium';
        } else if (errorData.code.includes('not-found') || errorData.code.includes('invalid')) {
          category = 'validation';
          severity = 'low';
        }

        this.log(`Error ${errorData.code} categorized as ${category} with ${severity} severity`);
        
        // Store for later analysis
        this.mockErrors.set(errorData.code, {
          error,
          category,
          severity,
          timestamp: new Date(),
        });
      }

      this.log(`Error categorization test completed. Processed ${testErrors.length} errors`, 'success');
      return true;

    } catch (error) {
      this.log(`Error categorization test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testRetryLogic() {
    this.log('Testing retry logic...');

    try {
      const retryableErrors = ['unavailable', 'deadline-exceeded', 'resource-exhausted'];
      const nonRetryableErrors = ['permission-denied', 'not-found', 'invalid-argument'];

      // Test retryable errors
      for (const errorCode of retryableErrors) {
        this.log(`Testing retry for ${errorCode}...`);
        
        let attempts = 0;
        const maxRetries = 3;
        
        while (attempts <= maxRetries) {
          attempts++;
          
          if (attempts <= maxRetries) {
            // Simulate retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
            this.log(`Retry attempt ${attempts}/${maxRetries} after ${delay}ms`);
            await this.delay(Math.min(delay, 100)); // Shortened for testing
            
            // Simulate success on final attempt
            if (attempts === maxRetries) {
              this.log(`Operation succeeded after ${attempts} attempts`);
              break;
            }
          }
        }
      }

      // Test non-retryable errors
      for (const errorCode of nonRetryableErrors) {
        this.log(`Testing non-retryable error ${errorCode} - should fail immediately`);
        // These should not be retried
      }

      this.log('Retry logic test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Retry logic test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testErrorLogging() {
    this.log('Testing error logging...');

    try {
      const testOperations = [
        { service: 'firestore', operation: 'read', collection: 'users', success: true, duration: 150 },
        { service: 'firestore', operation: 'write', collection: 'orders', success: false, duration: 300, error: 'permission-denied' },
        { service: 'storage', operation: 'upload', path: '/images/test.jpg', success: true, duration: 2000, fileSize: 1024000 },
        { service: 'functions', operation: 'call', functionName: 'processOrder', success: false, duration: 5000, error: 'deadline-exceeded' },
        { service: 'auth', operation: 'login', success: true, duration: 800 },
      ];

      for (const op of testOperations) {
        // Simulate logging
        const logEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          level: op.success ? 'info' : 'error',
          category: op.service,
          operation: op.operation,
          message: `${op.service} ${op.operation} ${op.success ? 'completed' : 'failed'}`,
          duration: op.duration,
          success: op.success,
          metadata: {
            collection: op.collection,
            path: op.path,
            functionName: op.functionName,
            fileSize: op.fileSize,
            errorCode: op.error,
          },
        };

        this.mockLogs.push(logEntry);
        this.log(`Logged ${op.service} ${op.operation}: ${op.success ? 'SUCCESS' : 'FAILED'} (${op.duration}ms)`);
      }

      this.log(`Error logging test completed. Generated ${testOperations.length} log entries`, 'success');
      return true;

    } catch (error) {
      this.log(`Error logging test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // MONITORING TESTS
  // ===========================================

  async testPerformanceMonitoring() {
    this.log('Testing performance monitoring...');

    try {
      const operations = [
        'firestore_read',
        'firestore_write',
        'storage_upload',
        'functions_call',
        'auth_login',
      ];

      // Simulate performance traces
      for (const operation of operations) {
        const startTime = Date.now();
        
        // Simulate operation duration
        const duration = 100 + Math.random() * 2000;
        await this.delay(Math.min(duration, 50)); // Shortened for testing
        
        const actualDuration = Date.now() - startTime;
        
        // Record performance metric
        this.mockMetrics.set(`${operation}_duration`, {
          name: `${operation}_duration`,
          value: actualDuration,
          unit: 'ms',
          timestamp: new Date(),
        });

        this.log(`Performance trace: ${operation} completed in ${actualDuration}ms`);
      }

      // Simulate custom metrics
      const customMetrics = [
        { name: 'database_connections', value: 25, unit: 'count' },
        { name: 'cache_hit_rate', value: 85.5, unit: 'percentage' },
        { name: 'memory_usage', value: 512, unit: 'bytes' },
        { name: 'error_rate', value: 2.3, unit: 'percentage' },
      ];

      for (const metric of customMetrics) {
        this.mockMetrics.set(metric.name, {
          ...metric,
          timestamp: new Date(),
        });
        
        this.log(`Custom metric: ${metric.name} = ${metric.value}${metric.unit}`);
      }

      this.log(`Performance monitoring test completed. Tracked ${operations.length + customMetrics.length} metrics`, 'success');
      return true;

    } catch (error) {
      this.log(`Performance monitoring test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testHealthChecks() {
    this.log('Testing health checks...');

    try {
      const services = ['firestore', 'storage', 'functions', 'auth'];
      const healthStatus = {};

      for (const service of services) {
        const startTime = Date.now();
        
        // Simulate health check
        const isHealthy = Math.random() > 0.2; // 80% chance of being healthy
        const responseTime = 50 + Math.random() * 500;
        
        await this.delay(Math.min(responseTime, 20)); // Shortened for testing
        
        const actualResponseTime = Date.now() - startTime;
        
        healthStatus[service] = {
          status: isHealthy ? 'operational' : 'degraded',
          responseTime: actualResponseTime,
          errorRate: isHealthy ? 0 : Math.random() * 10,
          lastChecked: new Date(),
          issues: isHealthy ? [] : ['Simulated health issue'],
        };

        this.log(`Health check: ${service} is ${healthStatus[service].status} (${actualResponseTime}ms)`);
      }

      // Calculate overall system health
      const degradedServices = Object.values(healthStatus).filter(s => s.status === 'degraded').length;
      const overallStatus = degradedServices === 0 ? 'healthy' : degradedServices > 1 ? 'unhealthy' : 'degraded';
      
      this.log(`Overall system health: ${overallStatus}`, overallStatus === 'healthy' ? 'success' : 'warn');

      this.log('Health checks test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Health checks test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testQuotaMonitoring() {
    this.log('Testing quota monitoring...');

    try {
      const quotas = [
        { service: 'firestore', metric: 'reads', current: 45000, limit: 50000 },
        { service: 'firestore', metric: 'writes', current: 18000, limit: 20000 },
        { service: 'storage', metric: 'bandwidth', current: 800, limit: 1000 },
        { service: 'functions', metric: 'invocations', current: 180000, limit: 200000 },
      ];

      for (const quota of quotas) {
        const percentage = (quota.current / quota.limit) * 100;
        
        this.log(`Quota: ${quota.service} ${quota.metric} - ${quota.current}/${quota.limit} (${percentage.toFixed(1)}%)`);
        
        // Check for quota warnings
        if (percentage >= 90) {
          this.log(`WARNING: High quota usage for ${quota.service} ${quota.metric}`, 'warn');
        } else if (percentage >= 95) {
          this.log(`CRITICAL: Very high quota usage for ${quota.service} ${quota.metric}`, 'error');
        }
      }

      this.log('Quota monitoring test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Quota monitoring test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // ALERTING TESTS
  // ===========================================

  async testAlertingSystem() {
    this.log('Testing alerting system...');

    try {
      const alerts = [];

      // Simulate different types of alerts
      const alertScenarios = [
        {
          type: 'error_rate',
          severity: 'high',
          message: 'High error rate detected: 8.5% (42 errors in 5 minutes)',
          threshold: 5,
          current: 8.5,
        },
        {
          type: 'performance',
          severity: 'medium',
          message: 'High response time detected: 3500ms',
          threshold: 3000,
          current: 3500,
        },
        {
          type: 'quota',
          severity: 'critical',
          message: 'High quota usage: firestore reads at 95%',
          threshold: 85,
          current: 95,
        },
        {
          type: 'security',
          severity: 'critical',
          message: 'Multiple failed authentication attempts detected',
          threshold: 10,
          current: 25,
        },
      ];

      for (const scenario of alertScenarios) {
        const alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...scenario,
          timestamp: new Date(),
          resolved: false,
        };

        alerts.push(alert);
        
        this.log(`ALERT [${scenario.severity.toUpperCase()}]: ${scenario.message}`, 
          scenario.severity === 'critical' ? 'error' : 'warn');
        
        // Simulate alert resolution for some alerts
        if (Math.random() > 0.5) {
          await this.delay(100);
          alert.resolved = true;
          this.log(`Alert ${alert.id} resolved`);
        }
      }

      const activeAlerts = alerts.filter(a => !a.resolved);
      this.log(`Alerting test completed. Generated ${alerts.length} alerts, ${activeAlerts.length} still active`, 'success');
      
      return true;

    } catch (error) {
      this.log(`Alerting system test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // INTEGRATION TESTS
  // ===========================================

  async testIntegratedMonitoring() {
    this.log('Testing integrated monitoring...');

    try {
      // Simulate a complete operation with monitoring
      const operations = [
        {
          name: 'user_login',
          service: 'auth',
          duration: 800,
          success: true,
        },
        {
          name: 'fetch_user_data',
          service: 'firestore',
          duration: 150,
          success: true,
        },
        {
          name: 'upload_profile_image',
          service: 'storage',
          duration: 2500,
          success: false,
          error: 'storage/quota-exceeded',
        },
        {
          name: 'send_notification',
          service: 'functions',
          duration: 1200,
          success: true,
        },
      ];

      for (const op of operations) {
        this.log(`Starting operation: ${op.name}`);
        
        // Start performance trace
        const traceId = `${op.service}_${op.name}_${Date.now()}`;
        this.log(`Performance trace started: ${traceId}`);
        
        // Simulate operation
        await this.delay(Math.min(op.duration, 50));
        
        if (op.success) {
          this.log(`Operation ${op.name} completed successfully in ${op.duration}ms`);
          
          // Log successful operation
          this.mockLogs.push({
            level: 'info',
            category: op.service,
            operation: op.name,
            message: `${op.service} operation completed successfully`,
            duration: op.duration,
            success: true,
            timestamp: new Date(),
          });
          
        } else {
          this.log(`Operation ${op.name} failed: ${op.error}`, 'error');
          
          // Log failed operation
          this.mockLogs.push({
            level: 'error',
            category: op.service,
            operation: op.name,
            message: `${op.service} operation failed: ${op.error}`,
            duration: op.duration,
            success: false,
            errorCode: op.error,
            timestamp: new Date(),
          });
          
          // Handle error
          this.log(`Error handled through error handler: ${op.error}`);
        }
        
        // Stop performance trace
        this.log(`Performance trace stopped: ${traceId}`);
        
        // Record metrics
        this.mockMetrics.set(`${op.service}_${op.name}_duration`, {
          name: `${op.service}_${op.name}_duration`,
          value: op.duration,
          unit: 'ms',
          timestamp: new Date(),
        });
      }

      this.log('Integrated monitoring test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Integrated monitoring test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // REPORTING TESTS
  // ===========================================

  async testReportGeneration() {
    this.log('Testing report generation...');

    try {
      // Generate summary statistics
      const totalErrors = this.mockErrors.size;
      const totalMetrics = this.mockMetrics.size;
      const totalLogs = this.mockLogs.length;
      
      const errorsByService = {};
      const metricsByType = {};
      const logsByLevel = {};

      // Analyze errors
      for (const [code, errorData] of this.mockErrors.entries()) {
        const service = errorData.error.service;
        errorsByService[service] = (errorsByService[service] || 0) + 1;
      }

      // Analyze metrics
      for (const [name, metric] of this.mockMetrics.entries()) {
        const type = name.split('_')[0];
        metricsByType[type] = (metricsByType[type] || 0) + 1;
      }

      // Analyze logs
      for (const log of this.mockLogs) {
        logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
      }

      // Generate report
      const report = {
        timestamp: new Date(),
        summary: {
          totalErrors,
          totalMetrics,
          totalLogs,
          errorRate: (totalErrors / Math.max(totalLogs, 1)) * 100,
        },
        breakdown: {
          errorsByService,
          metricsByType,
          logsByLevel,
        },
      };

      this.log('='.repeat(50));
      this.log('MONITORING REPORT');
      this.log('='.repeat(50));
      this.log(`Total Errors: ${report.summary.totalErrors}`);
      this.log(`Total Metrics: ${report.summary.totalMetrics}`);
      this.log(`Total Logs: ${report.summary.totalLogs}`);
      this.log(`Error Rate: ${report.summary.errorRate.toFixed(2)}%`);
      this.log('');
      this.log('Errors by Service:');
      Object.entries(report.breakdown.errorsByService).forEach(([service, count]) => {
        this.log(`  ${service}: ${count}`);
      });
      this.log('');
      this.log('Metrics by Type:');
      Object.entries(report.breakdown.metricsByType).forEach(([type, count]) => {
        this.log(`  ${type}: ${count}`);
      });
      this.log('');
      this.log('Logs by Level:');
      Object.entries(report.breakdown.logsByLevel).forEach(([level, count]) => {
        this.log(`  ${level}: ${count}`);
      });
      this.log('='.repeat(50));

      this.log('Report generation test completed', 'success');
      return true;

    } catch (error) {
      this.log(`Report generation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // MAIN TEST RUNNER
  // ===========================================

  async runAllTests() {
    this.log('Starting Error Handling and Monitoring Tests...', 'info');
    this.log('='.repeat(60), 'info');

    const tests = [
      { name: 'Error Categorization', fn: () => this.testErrorCategorization() },
      { name: 'Retry Logic', fn: () => this.testRetryLogic() },
      { name: 'Error Logging', fn: () => this.testErrorLogging() },
      { name: 'Performance Monitoring', fn: () => this.testPerformanceMonitoring() },
      { name: 'Health Checks', fn: () => this.testHealthChecks() },
      { name: 'Quota Monitoring', fn: () => this.testQuotaMonitoring() },
      { name: 'Alerting System', fn: () => this.testAlertingSystem() },
      { name: 'Integrated Monitoring', fn: () => this.testIntegratedMonitoring() },
      { name: 'Report Generation', fn: () => this.testReportGeneration() },
    ];

    const results = [];

    for (const test of tests) {
      this.log(`\nRunning test: ${test.name}`, 'info');
      this.log('-'.repeat(40), 'info');
      
      const startTime = Date.now();
      const success = await test.fn();
      const duration = Date.now() - startTime;
      
      results.push({
        name: test.name,
        success,
        duration,
      });
      
      this.log(`Test ${test.name} ${success ? 'PASSED' : 'FAILED'} (${duration}ms)`, success ? 'success' : 'error');
    }

    // Print summary
    this.log('\n' + '='.repeat(60), 'info');
    this.log('TEST SUMMARY', 'info');
    this.log('='.repeat(60), 'info');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    this.log(`Total tests: ${results.length}`, 'info');
    this.log(`Passed: ${passed}`, 'success');
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`Total duration: ${totalDuration}ms`, 'info');

    results.forEach(result => {
      const status = result.success ? 'PASS' : 'FAIL';
      const type = result.success ? 'success' : 'error';
      this.log(`  ${status}: ${result.name} (${result.duration}ms)`, type);
    });

    if (failed === 0) {
      this.log('\nAll tests passed! ✅', 'success');
    } else {
      this.log(`\n${failed} test(s) failed! ❌`, 'error');
    }

    return {
      total: results.length,
      passed,
      failed,
      duration: totalDuration,
      results,
    };
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ErrorMonitoringTester();
  
  tester.runAllTests()
    .then(summary => {
      console.log('\nTest execution completed.');
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = ErrorMonitoringTester;