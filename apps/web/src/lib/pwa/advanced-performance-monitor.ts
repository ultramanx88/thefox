// Advanced Performance Monitoring System for Scalable PWA
export interface AdvancedPerformanceMetrics {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  
  // Core Web Vitals
  coreWebVitals: CoreWebVitals;
  
  // Loading Performance
  loadingMetrics: LoadingMetrics;
  
  // Runtime Performance
  runtimeMetrics: RuntimeMetrics;
  
  // Network Performance
  networkMetrics: NetworkMetrics;
  
  // Cache Performance
  cacheMetrics: CacheMetrics;
  
  // User Interaction Metrics
  interactionMetrics: InteractionMetrics;
  
  // Resource Performance
  resourceMetrics: ResourceMetrics;
  
  // Error Metrics
  errorMetrics: ErrorMetrics;
  
  // Device Context
  deviceContext: DeviceContext;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint (new metric)
}

export interface LoadingMetrics {
  domContentLoaded: number;
  windowLoad: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
}

export interface RuntimeMetrics {
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  longTasks: LongTaskMetric[];
  layoutShifts: LayoutShiftMetric[];
  navigationTiming: PerformanceNavigationTiming;
  resourceTiming: PerformanceResourceTiming[];
}

export interface NetworkMetrics {
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  onlineStatus: boolean;
  networkChanges: NetworkChangeEvent[];
}

export interface CacheMetrics {
  hitRatio: number;
  missRatio: number;
  totalRequests: number;
  cacheSize: number;
  evictionCount: number;
  averageResponseTime: number;
  cacheStrategies: CacheStrategyMetric[];
}

export interface InteractionMetrics {
  totalInteractions: number;
  averageInteractionDelay: number;
  slowInteractions: SlowInteractionMetric[];
  clickThroughRate: number;
  bounceRate: number;
  sessionDuration: number;
}

export interface ResourceMetrics {
  totalResources: number;
  totalSize: number;
  slowResources: SlowResourceMetric[];
  failedResources: FailedResourceMetric[];
  compressionRatio: number;
  cacheableResources: number;
}

export interface ErrorMetrics {
  jsErrors: JSErrorMetric[];
  networkErrors: NetworkErrorMetric[];
  cacheErrors: CacheErrorMetric[];
  totalErrors: number;
  errorRate: number;
}

export interface DeviceContext {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  memorySize: number;
  cpuCores: number;
  screenSize: string;
  pixelRatio: number;
  orientation: string;
  batteryLevel?: number;
  batteryCharging?: boolean;
}

// Supporting interfaces
export interface LongTaskMetric {
  startTime: number;
  duration: number;
  attribution: string[];
}

export interface LayoutShiftMetric {
  value: number;
  hadRecentInput: boolean;
  lastInputTime: number;
  sources: string[];
}

export interface NetworkChangeEvent {
  timestamp: number;
  from: string;
  to: string;
  downlink: number;
  rtt: number;
}

export interface CacheStrategyMetric {
  name: string;
  hitRatio: number;
  averageResponseTime: number;
  totalRequests: number;
}

export interface SlowInteractionMetric {
  type: string;
  target: string;
  delay: number;
  timestamp: number;
}

export interface SlowResourceMetric {
  url: string;
  type: string;
  size: number;
  loadTime: number;
  timestamp: number;
}

export interface FailedResourceMetric {
  url: string;
  type: string;
  error: string;
  timestamp: number;
}

export interface JSErrorMetric {
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  stack: string;
  timestamp: number;
}

export interface NetworkErrorMetric {
  url: string;
  method: string;
  status: number;
  statusText: string;
  timestamp: number;
}

export interface CacheErrorMetric {
  operation: string;
  cacheName: string;
  error: string;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold?: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceThresholds {
  coreWebVitals: {
    lcp: { good: number; poor: number };
    fid: { good: number; poor: number };
    cls: { good: number; poor: number };
    fcp: { good: number; poor: number };
    ttfb: { good: number; poor: number };
    inp: { good: number; poor: number };
  };
  loading: {
    domContentLoaded: number;
    windowLoad: number;
    timeToInteractive: number;
    totalBlockingTime: number;
  };
  runtime: {
    memoryUsage: number;
    longTaskDuration: number;
    layoutShiftValue: number;
  };
  network: {
    slowResourceThreshold: number;
    errorRateThreshold: number;
  };
  cache: {
    minHitRatio: number;
    maxResponseTime: number;
  };
}

export class AdvancedPerformanceMonitor {
  private static instance: AdvancedPerformanceMonitor;
  private sessionId: string;
  private metrics: AdvancedPerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  
  private thresholds: PerformanceThresholds = {
    coreWebVitals: {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 600, poor: 1500 },
      inp: { good: 200, poor: 500 }
    },
    loading: {
      domContentLoaded: 3000,
      windowLoad: 5000,
      timeToInteractive: 5000,
      totalBlockingTime: 300
    },
    runtime: {
      memoryUsage: 100 * 1024 * 1024, // 100MB
      longTaskDuration: 50,
      layoutShiftValue: 0.1
    },
    network: {
      slowResourceThreshold: 3000,
      errorRateThreshold: 0.05
    },
    cache: {
      minHitRatio: 0.85,
      maxResponseTime: 200
    }
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AdvancedPerformanceMonitor {
    if (!AdvancedPerformanceMonitor.instance) {
      AdvancedPerformanceMonitor.instance = new AdvancedPerformanceMonitor();
    }
    return AdvancedPerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.initializeObservers();
    this.setupErrorHandlers();
    this.startPeriodicCollection();
    this.setupNetworkMonitoring();
    this.setupInteractionTracking();
    
    console.log('Advanced Performance Monitoring started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.cleanup();
    console.log('Advanced Performance Monitoring stopped');
  }

  private initializeObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Core Web Vitals Observers
    this.setupCoreWebVitalsObservers();
    
    // Long Tasks Observer
    this.setupLongTasksObserver();
    
    // Layout Shift Observer
    this.setupLayoutShiftObserver();
    
    // Navigation Observer
    this.setupNavigationObserver();
    
    // Resource Observer
    this.setupResourceObserver();
  }

  private setupCoreWebVitalsObservers(): void {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updateMetric('coreWebVitals.lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const delay = entry.processingStart - entry.startTime;
          this.updateMetric('coreWebVitals.fid', delay);
          this.checkThreshold('fid', delay);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.updateMetric('coreWebVitals.cls', clsValue);
            this.addLayoutShiftMetric(entry);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // Interaction to Next Paint (INP)
    try {
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const inp = entry.processingEnd - entry.startTime;
          this.updateMetric('coreWebVitals.inp', inp);
          this.checkThreshold('inp', inp);
        });
      });
      inpObserver.observe({ entryTypes: ['event'] });
      this.observers.push(inpObserver);
    } catch (e) {
      console.warn('INP observer not supported');
    }
  }

  private setupLongTasksObserver(): void {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const longTask: LongTaskMetric = {
            startTime: entry.startTime,
            duration: entry.duration,
            attribution: entry.attribution?.map((attr: any) => attr.name) || []
          };
          this.addLongTaskMetric(longTask);
          
          if (entry.duration > this.thresholds.runtime.longTaskDuration) {
            this.createAlert('threshold', 'high', 'longTask', entry.duration, 
              this.thresholds.runtime.longTaskDuration, 
              `Long task detected: ${entry.duration}ms`);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('Long tasks observer not supported');
    }
  }

  private setupLayoutShiftObserver(): void {
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const layoutShift: LayoutShiftMetric = {
            value: entry.value,
            hadRecentInput: entry.hadRecentInput,
            lastInputTime: entry.lastInputTime,
            sources: entry.sources?.map((source: any) => source.node) || []
          };
          this.addLayoutShiftMetric(layoutShift);
        });
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutShiftObserver);
    } catch (e) {
      console.warn('Layout shift observer not supported');
    }
  }

  private setupNavigationObserver(): void {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processNavigationTiming(entry as PerformanceNavigationTiming);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  private setupResourceObserver(): void {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processResourceTiming(entry as PerformanceResourceTiming);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  private setupErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      const jsError: JSErrorMetric = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || '',
        timestamp: Date.now()
      };
      this.addJSError(jsError);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const jsError: JSErrorMetric = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        filename: '',
        lineno: 0,
        colno: 0,
        stack: event.reason?.stack || '',
        timestamp: Date.now()
      };
      this.addJSError(jsError);
    });
  }

  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.addNetworkChange('offline', 'online');
    });

    window.addEventListener('offline', () => {
      this.addNetworkChange('online', 'offline');
    });

    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.updateNetworkMetrics();
      });
    }
  }

  private setupInteractionTracking(): void {
    let interactionCount = 0;
    let totalDelay = 0;
    const slowInteractions: SlowInteractionMetric[] = [];

    const trackInteraction = (event: Event) => {
      const startTime = performance.now();
      
      requestIdleCallback(() => {
        const delay = performance.now() - startTime;
        interactionCount++;
        totalDelay += delay;
        
        if (delay > 100) { // Slow interaction threshold
          slowInteractions.push({
            type: event.type,
            target: (event.target as Element)?.tagName || 'unknown',
            delay,
            timestamp: Date.now()
          });
        }
        
        this.updateInteractionMetrics(interactionCount, totalDelay / interactionCount, slowInteractions);
      });
    };

    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });
  }

  private startPeriodicCollection(): void {
    // Collect metrics every 10 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.collectCurrentMetrics();
      }
    }, 10000);

    // Send metrics to service worker every 30 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.sendMetricsToServiceWorker();
      }
    }, 30000);

    // Check for anomalies every minute
    setInterval(() => {
      if (this.isMonitoring) {
        this.detectAnomalies();
      }
    }, 60000);
  }

  private updateMetric(path: string, value: number): void {
    const currentMetrics = this.getCurrentMetrics();
    this.setNestedValue(currentMetrics, path, value);
    this.checkThreshold(path.split('.').pop() || '', value);
  }

  private setNestedValue(obj: any, path: string, value: number): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private checkThreshold(metric: string, value: number): void {
    const thresholds = this.getThresholdForMetric(metric);
    if (!thresholds) return;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let threshold = 0;

    if (value > thresholds.poor) {
      severity = 'critical';
      threshold = thresholds.poor;
    } else if (value > thresholds.good) {
      severity = 'medium';
      threshold = thresholds.good;
    }

    if (severity !== 'low') {
      this.createAlert('threshold', severity, metric, value, threshold, 
        `${metric} threshold exceeded: ${value} > ${threshold}`);
    }
  }

  private getThresholdForMetric(metric: string): { good: number; poor: number } | null {
    const coreWebVitalsThreshold = (this.thresholds.coreWebVitals as any)[metric];
    if (coreWebVitalsThreshold) return coreWebVitalsThreshold;
    
    return null;
  }

  private createAlert(
    type: 'threshold' | 'anomaly' | 'error',
    severity: 'low' | 'medium' | 'high' | 'critical',
    metric: string,
    value: number,
    threshold?: number,
    message?: string
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      metric,
      value,
      threshold,
      message: message || `Performance alert for ${metric}`,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify service worker about critical alerts
    if (severity === 'critical' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PERFORMANCE_ALERT',
        payload: alert
      });
    }

    console.warn(`Performance Alert [${severity.toUpperCase()}]:`, message);
  }

  private getCurrentMetrics(): AdvancedPerformanceMetrics {
    const existing = this.metrics[this.metrics.length - 1];
    
    if (existing && Date.now() - existing.timestamp.getTime() < 5000) {
      return existing;
    }

    // Create new metrics entry
    const newMetrics: AdvancedPerformanceMetrics = {
      id: `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.sessionId,
      coreWebVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, inp: 0 },
      loadingMetrics: {
        domContentLoaded: 0, windowLoad: 0, firstPaint: 0, firstContentfulPaint: 0,
        largestContentfulPaint: 0, timeToInteractive: 0, totalBlockingTime: 0, speedIndex: 0
      },
      runtimeMetrics: {
        jsHeapSizeUsed: 0, jsHeapSizeTotal: 0, jsHeapSizeLimit: 0,
        longTasks: [], layoutShifts: [], navigationTiming: {} as PerformanceNavigationTiming,
        resourceTiming: []
      },
      networkMetrics: this.getNetworkMetrics(),
      cacheMetrics: { hitRatio: 0, missRatio: 0, totalRequests: 0, cacheSize: 0, evictionCount: 0, averageResponseTime: 0, cacheStrategies: [] },
      interactionMetrics: { totalInteractions: 0, averageInteractionDelay: 0, slowInteractions: [], clickThroughRate: 0, bounceRate: 0, sessionDuration: 0 },
      resourceMetrics: { totalResources: 0, totalSize: 0, slowResources: [], failedResources: [], compressionRatio: 0, cacheableResources: 0 },
      errorMetrics: { jsErrors: [], networkErrors: [], cacheErrors: [], totalErrors: 0, errorRate: 0 },
      deviceContext: this.getDeviceContext()
    };

    this.metrics.push(newMetrics);
    
    // Keep only last 100 metrics entries
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return newMetrics;
  }

  private getNetworkMetrics(): NetworkMetrics {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      onlineStatus: navigator.onLine,
      networkChanges: []
    };
  }

  private getDeviceContext(): DeviceContext {
    const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    return {
      deviceType: getDeviceType(),
      memorySize: (navigator as any).deviceMemory || 0,
      cpuCores: navigator.hardwareConcurrency || 0,
      screenSize: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || 'unknown',
      batteryLevel: (navigator as any).battery?.level,
      batteryCharging: (navigator as any).battery?.charging
    };
  }

  private processNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = this.getCurrentMetrics();
    
    metrics.loadingMetrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
    metrics.loadingMetrics.windowLoad = entry.loadEventEnd - entry.navigationStart;
    metrics.coreWebVitals.ttfb = entry.responseStart - entry.requestStart;
    metrics.runtimeMetrics.navigationTiming = entry;
    
    // Calculate additional metrics
    metrics.loadingMetrics.timeToInteractive = this.calculateTimeToInteractive(entry);
    metrics.loadingMetrics.totalBlockingTime = this.calculateTotalBlockingTime();
  }

  private processResourceTiming(entry: PerformanceResourceTiming): void {
    const metrics = this.getCurrentMetrics();
    const loadTime = entry.responseEnd - entry.startTime;
    
    metrics.resourceMetrics.totalResources++;
    metrics.resourceMetrics.totalSize += entry.transferSize || 0;
    
    // Track slow resources
    if (loadTime > this.thresholds.network.slowResourceThreshold) {
      metrics.resourceMetrics.slowResources.push({
        url: entry.name,
        type: this.getResourceType(entry.name),
        size: entry.transferSize || 0,
        loadTime,
        timestamp: Date.now()
      });
    }
    
    // Track cacheable resources
    if (this.isCacheableResource(entry)) {
      metrics.resourceMetrics.cacheableResources++;
    }
    
    metrics.runtimeMetrics.resourceTiming.push(entry);
  }

  private calculateTimeToInteractive(entry: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    return entry.domInteractive - entry.navigationStart;
  }

  private calculateTotalBlockingTime(): number {
    // Calculate TBT from long tasks
    const metrics = this.getCurrentMetrics();
    return metrics.runtimeMetrics.longTasks.reduce((total, task) => {
      return total + Math.max(0, task.duration - 50);
    }, 0);
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  private isCacheableResource(entry: PerformanceResourceTiming): boolean {
    // Simple heuristic for cacheable resources
    return entry.name.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2)$/) !== null;
  }

  private addLongTaskMetric(longTask: LongTaskMetric): void {
    const metrics = this.getCurrentMetrics();
    metrics.runtimeMetrics.longTasks.push(longTask);
  }

  private addLayoutShiftMetric(layoutShift: LayoutShiftMetric): void {
    const metrics = this.getCurrentMetrics();
    metrics.runtimeMetrics.layoutShifts.push(layoutShift);
  }

  private addNetworkChange(from: string, to: string): void {
    const metrics = this.getCurrentMetrics();
    const connection = (navigator as any).connection;
    
    metrics.networkMetrics.networkChanges.push({
      timestamp: Date.now(),
      from,
      to,
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    });
  }

  private updateNetworkMetrics(): void {
    const metrics = this.getCurrentMetrics();
    metrics.networkMetrics = this.getNetworkMetrics();
  }

  private updateInteractionMetrics(
    totalInteractions: number,
    averageDelay: number,
    slowInteractions: SlowInteractionMetric[]
  ): void {
    const metrics = this.getCurrentMetrics();
    metrics.interactionMetrics.totalInteractions = totalInteractions;
    metrics.interactionMetrics.averageInteractionDelay = averageDelay;
    metrics.interactionMetrics.slowInteractions = slowInteractions;
  }

  private addJSError(error: JSErrorMetric): void {
    const metrics = this.getCurrentMetrics();
    metrics.errorMetrics.jsErrors.push(error);
    metrics.errorMetrics.totalErrors++;
    
    this.createAlert('error', 'high', 'jsError', 1, undefined, 
      `JavaScript Error: ${error.message}`);
  }

  private collectCurrentMetrics(): void {
    const metrics = this.getCurrentMetrics();
    
    // Update memory metrics
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      metrics.runtimeMetrics.jsHeapSizeUsed = memInfo.usedJSHeapSize;
      metrics.runtimeMetrics.jsHeapSizeTotal = memInfo.totalJSHeapSize;
      metrics.runtimeMetrics.jsHeapSizeLimit = memInfo.jsHeapSizeLimit;
      
      // Check memory threshold
      if (memInfo.usedJSHeapSize > this.thresholds.runtime.memoryUsage) {
        this.createAlert('threshold', 'high', 'memoryUsage', memInfo.usedJSHeapSize,
          this.thresholds.runtime.memoryUsage, 'High memory usage detected');
      }
    }
    
    // Update session duration
    const sessionStart = this.metrics[0]?.timestamp.getTime() || Date.now();
    metrics.interactionMetrics.sessionDuration = Date.now() - sessionStart;
  }

  private sendMetricsToServiceWorker(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const latestMetrics = this.getLatestMetrics();
      navigator.serviceWorker.controller.postMessage({
        type: 'PERFORMANCE_METRICS_UPDATE',
        payload: latestMetrics
      });
    }
  }

  private detectAnomalies(): void {
    if (this.metrics.length < 10) return; // Need enough data points
    
    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);
    
    if (older.length === 0) return;
    
    // Detect anomalies in key metrics
    this.detectMetricAnomaly('coreWebVitals.lcp', recent, older);
    this.detectMetricAnomaly('coreWebVitals.fid', recent, older);
    this.detectMetricAnomaly('loadingMetrics.domContentLoaded', recent, older);
  }

  private detectMetricAnomaly(metricPath: string, recent: AdvancedPerformanceMetrics[], older: AdvancedPerformanceMetrics[]): void {
    const recentValues = recent.map(m => this.getNestedValue(m, metricPath)).filter(v => v > 0);
    const olderValues = older.map(m => this.getNestedValue(m, metricPath)).filter(v => v > 0);
    
    if (recentValues.length === 0 || olderValues.length === 0) return;
    
    const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
    
    // Detect significant increase (>50%)
    if (recentAvg > olderAvg * 1.5) {
      this.createAlert('anomaly', 'medium', metricPath, recentAvg, olderAvg,
        `Performance anomaly detected in ${metricPath}: ${recentAvg.toFixed(2)} vs ${olderAvg.toFixed(2)}`);
    }
  }

  private getNestedValue(obj: any, path: string): number {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return 0;
      }
    }
    
    return typeof current === 'number' ? current : 0;
  }

  private cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Public API methods
  public getLatestMetrics(): AdvancedPerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getAllMetrics(): AdvancedPerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getUnresolvedAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  public generateAdvancedReport(): any {
    const metrics = this.getAllMetrics();
    const alerts = this.getAlerts();
    
    if (metrics.length === 0) {
      return { error: 'No metrics available' };
    }

    const latest = metrics[metrics.length - 1];
    const summary = this.calculateSummaryStats(metrics);
    const trends = this.calculateTrends(metrics);
    const recommendations = this.generateRecommendations(latest, alerts);

    return {
      sessionId: this.sessionId,
      timestamp: new Date(),
      summary,
      latest,
      trends,
      alerts: {
        total: alerts.length,
        unresolved: alerts.filter(a => !a.resolved).length,
        bySeverity: this.groupAlertsBySeverity(alerts),
        recent: alerts.slice(-10)
      },
      recommendations
    };
  }

  private calculateSummaryStats(metrics: AdvancedPerformanceMetrics[]): any {
    if (metrics.length === 0) return {};

    const coreWebVitals = {
      lcp: this.calculateAverage(metrics, 'coreWebVitals.lcp'),
      fid: this.calculateAverage(metrics, 'coreWebVitals.fid'),
      cls: this.calculateAverage(metrics, 'coreWebVitals.cls'),
      fcp: this.calculateAverage(metrics, 'coreWebVitals.fcp'),
      ttfb: this.calculateAverage(metrics, 'coreWebVitals.ttfb'),
      inp: this.calculateAverage(metrics, 'coreWebVitals.inp')
    };

    return {
      totalSessions: 1,
      totalMetrics: metrics.length,
      timeRange: {
        start: metrics[0].timestamp,
        end: metrics[metrics.length - 1].timestamp
      },
      coreWebVitals,
      averageMemoryUsage: this.calculateAverage(metrics, 'runtimeMetrics.jsHeapSizeUsed'),
      totalErrors: metrics.reduce((sum, m) => sum + m.errorMetrics.totalErrors, 0),
      averageLoadTime: this.calculateAverage(metrics, 'loadingMetrics.windowLoad')
    };
  }

  private calculateAverage(metrics: AdvancedPerformanceMetrics[], path: string): number {
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v > 0);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateTrends(metrics: AdvancedPerformanceMetrics[]): any {
    if (metrics.length < 2) return {};

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    if (older.length === 0) return {};

    return {
      lcp: this.calculateTrend(recent, older, 'coreWebVitals.lcp'),
      fid: this.calculateTrend(recent, older, 'coreWebVitals.fid'),
      cls: this.calculateTrend(recent, older, 'coreWebVitals.cls'),
      memoryUsage: this.calculateTrend(recent, older, 'runtimeMetrics.jsHeapSizeUsed'),
      loadTime: this.calculateTrend(recent, older, 'loadingMetrics.windowLoad')
    };
  }

  private calculateTrend(recent: AdvancedPerformanceMetrics[], older: AdvancedPerformanceMetrics[], path: string): number {
    const recentAvg = this.calculateAverage(recent, path);
    const olderAvg = this.calculateAverage(older, path);
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  private groupAlertsBySeverity(alerts: PerformanceAlert[]): any {
    return alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateRecommendations(metrics: AdvancedPerformanceMetrics, alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Core Web Vitals recommendations
    if (metrics.coreWebVitals.lcp > this.thresholds.coreWebVitals.lcp.good) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing critical resources');
    }
    
    if (metrics.coreWebVitals.fid > this.thresholds.coreWebVitals.fid.good) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time and breaking up long tasks');
    }
    
    if (metrics.coreWebVitals.cls > this.thresholds.coreWebVitals.cls.good) {
      recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and avoiding dynamic content insertion');
    }
    
    // Memory recommendations
    if (metrics.runtimeMetrics.jsHeapSizeUsed > this.thresholds.runtime.memoryUsage) {
      recommendations.push('Optimize memory usage by implementing proper cleanup and avoiding memory leaks');
    }
    
    // Cache recommendations
    if (metrics.cacheMetrics.hitRatio < this.thresholds.cache.minHitRatio) {
      recommendations.push('Improve cache hit ratio by optimizing cache strategies and increasing cache duration for static assets');
    }
    
    // Error recommendations
    if (metrics.errorMetrics.totalErrors > 0) {
      recommendations.push('Address JavaScript errors to improve application stability and user experience');
    }
    
    return recommendations;
  }

  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public exportMetrics(): any {
    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts,
      thresholds: this.thresholds
    };
  }
}