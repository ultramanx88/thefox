// Test file for Advanced Performance Monitor
import { AdvancedPerformanceMonitor } from '../advanced-performance-monitor';

// Mock global objects
const mockPerformanceObserver = jest.fn();
const mockPerformance = {
  now: jest.fn().mockReturnValue(100),
  getEntriesByType: jest.fn().mockReturnValue([]),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  }
};

const mockNavigator = {
  onLine: true,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  hardwareConcurrency: 8,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  },
  deviceMemory: 8
};

const mockScreen = {
  width: 1920,
  height: 1080,
  orientation: {
    type: 'landscape-primary'
  }
};

const mockWindow = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 2,
  matchMedia: jest.fn().mockReturnValue({ matches: false }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Setup global mocks
global.PerformanceObserver = mockPerformanceObserver;
global.performance = mockPerformance as any;
global.navigator = mockNavigator as any;
global.screen = mockScreen as any;
global.window = mockWindow as any;
global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
} as any;

describe('AdvancedPerformanceMonitor', () => {
  let monitor: AdvancedPerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = AdvancedPerformanceMonitor.getInstance();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AdvancedPerformanceMonitor.getInstance();
      const instance2 = AdvancedPerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring successfully', () => {
      monitor.startMonitoring();
      expect(mockWindow.addEventListener).toHaveBeenCalled();
    });

    it('should stop monitoring and cleanup', () => {
      monitor.startMonitoring();
      monitor.stopMonitoring();
      expect(mockWindow.removeEventListener).toHaveBeenCalled();
    });

    it('should not start monitoring twice', () => {
      monitor.startMonitoring();
      const addEventListenerCallCount = mockWindow.addEventListener.mock.calls.length;
      
      monitor.startMonitoring(); // Second call
      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(addEventListenerCallCount);
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should collect initial metrics', () => {
      const metrics = monitor.getLatestMetrics();
      expect(metrics).toBeDefined();
      expect(metrics?.coreWebVitals).toBeDefined();
      expect(metrics?.deviceContext).toBeDefined();
      expect(metrics?.networkMetrics).toBeDefined();
    });

    it('should update core web vitals', () => {
      // Simulate LCP measurement
      (monitor as any).updateMetric('coreWebVitals.lcp', 2000);
      
      const metrics = monitor.getLatestMetrics();
      expect(metrics?.coreWebVitals.lcp).toBe(2000);
    });

    it('should collect device context correctly', () => {
      const metrics = monitor.getLatestMetrics();
      expect(metrics?.deviceContext).toEqual({
        deviceType: 'desktop',
        memorySize: 8,
        cpuCores: 8,
        screenSize: '1920x1080',
        pixelRatio: 2,
        orientation: 'landscape-primary',
        batteryLevel: undefined,
        batteryCharging: undefined
      });
    });

    it('should collect network metrics correctly', () => {
      const metrics = monitor.getLatestMetrics();
      expect(metrics?.networkMetrics).toEqual({
        connectionType: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        onlineStatus: true,
        networkChanges: []
      });
    });
  });

  describe('Alert System', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should create alert when threshold is exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate high LCP value
      (monitor as any).updateMetric('coreWebVitals.lcp', 5000);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert'),
        expect.stringContaining('lcp threshold exceeded')
      );
      
      consoleSpy.mockRestore();
    });

    it('should track alerts correctly', () => {
      // Simulate multiple threshold violations
      (monitor as any).updateMetric('coreWebVitals.lcp', 5000);
      (monitor as any).updateMetric('coreWebVitals.fid', 200);
      
      const alerts = monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const unresolvedAlerts = monitor.getUnresolvedAlerts();
      expect(unresolvedAlerts.length).toBeGreaterThan(0);
    });

    it('should resolve alerts', () => {
      // Create an alert
      (monitor as any).updateMetric('coreWebVitals.lcp', 5000);
      
      const alerts = monitor.getAlerts();
      const alertId = alerts[0]?.id;
      
      if (alertId) {
        const resolved = monitor.resolveAlert(alertId);
        expect(resolved).toBe(true);
        
        const updatedAlerts = monitor.getAlerts();
        const resolvedAlert = updatedAlerts.find(a => a.id === alertId);
        expect(resolvedAlert?.resolved).toBe(true);
      }
    });
  });

  describe('Performance Thresholds', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should use correct thresholds for Core Web Vitals', () => {
      const thresholds = (monitor as any).thresholds.coreWebVitals;
      
      expect(thresholds.lcp).toEqual({ good: 2500, poor: 4000 });
      expect(thresholds.fid).toEqual({ good: 100, poor: 300 });
      expect(thresholds.cls).toEqual({ good: 0.1, poor: 0.25 });
      expect(thresholds.fcp).toEqual({ good: 1800, poor: 3000 });
      expect(thresholds.ttfb).toEqual({ good: 600, poor: 1500 });
      expect(thresholds.inp).toEqual({ good: 200, poor: 500 });
    });

    it('should update thresholds', () => {
      const newThresholds = {
        coreWebVitals: {
          lcp: { good: 2000, poor: 3500 }
        }
      };
      
      monitor.updateThresholds(newThresholds as any);
      
      const updatedThresholds = (monitor as any).thresholds.coreWebVitals.lcp;
      expect(updatedThresholds).toEqual({ good: 2000, poor: 3500 });
    });
  });

  describe('Long Tasks Tracking', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should track long tasks', () => {
      const longTask = {
        startTime: 1000,
        duration: 100,
        attribution: ['script']
      };
      
      (monitor as any).addLongTaskMetric(longTask);
      
      const metrics = monitor.getLatestMetrics();
      expect(metrics?.runtimeMetrics.longTasks).toContainEqual(longTask);
    });

    it('should create alert for long tasks exceeding threshold', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const longTask = {
        startTime: 1000,
        duration: 100, // Above 50ms threshold
        attribution: ['script']
      };
      
      (monitor as any).addLongTaskMetric(longTask);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert'),
        expect.stringContaining('Long task detected')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Layout Shifts Tracking', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should track layout shifts', () => {
      const layoutShift = {
        value: 0.05,
        hadRecentInput: false,
        lastInputTime: 0,
        sources: ['div']
      };
      
      (monitor as any).addLayoutShiftMetric(layoutShift);
      
      const metrics = monitor.getLatestMetrics();
      expect(metrics?.runtimeMetrics.layoutShifts).toContainEqual(layoutShift);
    });
  });

  describe('Error Tracking', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should track JavaScript errors', () => {
      const jsError = {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        stack: 'Error stack',
        timestamp: Date.now()
      };
      
      (monitor as any).addJSError(jsError);
      
      const metrics = monitor.getLatestMetrics();
      expect(metrics?.errorMetrics.jsErrors).toContainEqual(jsError);
      expect(metrics?.errorMetrics.totalErrors).toBe(1);
    });

    it('should create alert for JavaScript errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const jsError = {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        stack: 'Error stack',
        timestamp: Date.now()
      };
      
      (monitor as any).addJSError(jsError);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert'),
        expect.stringContaining('JavaScript Error')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should generate advanced report', () => {
      // Add some metrics
      (monitor as any).updateMetric('coreWebVitals.lcp', 2000);
      (monitor as any).updateMetric('coreWebVitals.fid', 80);
      
      const report = monitor.generateAdvancedReport();
      
      expect(report).toBeDefined();
      expect(report.sessionId).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.latest).toBeDefined();
      expect(report.alerts).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should provide recommendations based on metrics', () => {
      // Simulate poor performance
      (monitor as any).updateMetric('coreWebVitals.lcp', 5000);
      (monitor as any).updateMetric('coreWebVitals.fid', 200);
      
      const report = monitor.generateAdvancedReport();
      
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should export metrics data', () => {
      const exportData = monitor.exportMetrics();
      
      expect(exportData).toBeDefined();
      expect(exportData.sessionId).toBeDefined();
      expect(exportData.timestamp).toBeDefined();
      expect(exportData.metrics).toBeDefined();
      expect(exportData.alerts).toBeDefined();
      expect(exportData.thresholds).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should limit metrics history size', () => {
      // Add many metrics entries
      for (let i = 0; i < 150; i++) {
        (monitor as any).getCurrentMetrics();
      }
      
      const allMetrics = monitor.getAllMetrics();
      expect(allMetrics.length).toBeLessThanOrEqual(100);
    });

    it('should limit alerts history size', () => {
      // Create many alerts
      for (let i = 0; i < 150; i++) {
        (monitor as any).createAlert('threshold', 'medium', 'test', i, 50, `Test alert ${i}`);
      }
      
      const allAlerts = monitor.getAlerts();
      expect(allAlerts.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Anomaly Detection', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should detect performance anomalies', () => {
      // Create baseline metrics
      for (let i = 0; i < 10; i++) {
        (monitor as any).updateMetric('coreWebVitals.lcp', 2000);
      }
      
      // Create anomalous metrics
      for (let i = 0; i < 10; i++) {
        (monitor as any).updateMetric('coreWebVitals.lcp', 4000); // 2x increase
      }
      
      // Trigger anomaly detection
      (monitor as any).detectAnomalies();
      
      const alerts = monitor.getAlerts();
      const anomalyAlerts = alerts.filter(a => a.type === 'anomaly');
      expect(anomalyAlerts.length).toBeGreaterThan(0);
    });
  });
});

describe('Performance Observer Integration', () => {
  let monitor: AdvancedPerformanceMonitor;

  beforeEach(() => {
    monitor = AdvancedPerformanceMonitor.getInstance();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  it('should handle PerformanceObserver not being available', () => {
    // Temporarily remove PerformanceObserver
    const originalPO = global.PerformanceObserver;
    delete (global as any).PerformanceObserver;
    
    expect(() => {
      monitor.startMonitoring();
    }).not.toThrow();
    
    // Restore PerformanceObserver
    global.PerformanceObserver = originalPO;
  });

  it('should handle observer creation failures gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Mock PerformanceObserver to throw
    global.PerformanceObserver = jest.fn().mockImplementation(() => {
      throw new Error('Observer not supported');
    });
    
    expect(() => {
      monitor.startMonitoring();
    }).not.toThrow();
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('observer not supported')
    );
    
    consoleSpy.mockRestore();
  });
});