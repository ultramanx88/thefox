// Performance Monitor for PWA Scalability
export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface PerformanceMetrics {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  
  // Core Metrics
  coreWebVitals: CoreWebVitals;
  loadingMetrics: LoadingMetrics;
  runtimeMetrics: RuntimeMetrics;
  
  // Cache Metrics
  cacheMetrics: {
    hitRatio: number;
    missRatio: number;
    cacheSize: number;
    evictionCount: number;
  };
  
  // Network Metrics
  networkMetrics: {
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  
  // Device Metrics
  deviceMetrics: {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    memorySize: number;
    cpuCores: number;
    screenSize: string;
  };
}

export interface LoadingMetrics {
  domContentLoaded: number;
  windowLoad: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

export interface RuntimeMetrics {
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  navigationTiming: PerformanceNavigationTiming;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private sessionId: string;
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private thresholds = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8s
    ttfb: 600  // 600ms
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeObservers();
    this.startPerformanceTracking();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeObservers(): void {
    // Core Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;
          this.recordCoreWebVital('lcp', lastEntry.startTime);
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
            this.recordCoreWebVital('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordCoreWebVital('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Navigation Timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordNavigationTiming(entry as PerformanceNavigationTiming);
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }

      // Resource Timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordResourceTiming(entry as PerformanceResourceTiming);
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource observer not supported');
      }
    }
  }

  private recordCoreWebVital(metric: keyof CoreWebVitals, value: number): void {
    const currentMetrics = this.getCurrentMetrics();
    currentMetrics.coreWebVitals[metric] = value;

    // Check if threshold exceeded
    if (value > this.thresholds[metric]) {
      this.alertOnThreshold(metric, value, this.thresholds[metric]);
    }

    this.updateMetrics(currentMetrics);
  }

  private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
    const currentMetrics = this.getCurrentMetrics();
    
    currentMetrics.loadingMetrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
      windowLoad: entry.loadEventEnd - entry.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: currentMetrics.coreWebVitals.lcp,
      timeToInteractive: this.calculateTimeToInteractive(entry)
    };

    currentMetrics.coreWebVitals.ttfb = entry.responseStart - entry.requestStart;
    currentMetrics.runtimeMetrics.navigationTiming = entry;

    this.updateMetrics(currentMetrics);
  }

  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    // Track resource loading performance
    const loadTime = entry.responseEnd - entry.startTime;
    
    // Alert on slow resources
    if (loadTime > 3000) { // 3 seconds
      console.warn(`Slow resource detected: ${entry.name} took ${loadTime}ms`);
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
    return fpEntry ? fpEntry.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private calculateTimeToInteractive(entry: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    return entry.domInteractive - entry.navigationStart;
  }

  private getCurrentMetrics(): PerformanceMetrics {
    const existing = this.metrics[this.metrics.length - 1];
    
    if (existing && Date.now() - existing.timestamp.getTime() < 5000) {
      return existing;
    }

    // Create new metrics entry
    const newMetrics: PerformanceMetrics = {
      id: `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.sessionId,
      coreWebVitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      },
      loadingMetrics: {
        domContentLoaded: 0,
        windowLoad: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        timeToInteractive: 0
      },
      runtimeMetrics: {
        jsHeapSizeUsed: 0,
        jsHeapSizeTotal: 0,
        jsHeapSizeLimit: 0,
        navigationTiming: {} as PerformanceNavigationTiming
      },
      cacheMetrics: {
        hitRatio: 0,
        missRatio: 0,
        cacheSize: 0,
        evictionCount: 0
      },
      networkMetrics: this.getNetworkMetrics(),
      deviceMetrics: this.getDeviceMetrics()
    };

    this.metrics.push(newMetrics);
    return newMetrics;
  }

  private updateMetrics(metrics: PerformanceMetrics): void {
    // Update memory metrics
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      metrics.runtimeMetrics.jsHeapSizeUsed = memInfo.usedJSHeapSize;
      metrics.runtimeMetrics.jsHeapSizeTotal = memInfo.totalJSHeapSize;
      metrics.runtimeMetrics.jsHeapSizeLimit = memInfo.jsHeapSizeLimit;
    }

    // Keep only last 100 metrics entries
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private getNetworkMetrics(): PerformanceMetrics['networkMetrics'] {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }

  private getDeviceMetrics(): PerformanceMetrics['deviceMetrics'] {
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
      screenSize: `${screen.width}x${screen.height}`
    };
  }

  private alertOnThreshold(metric: string, value: number, threshold: number): void {
    console.warn(`Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`);
    
    // Send alert to service worker or analytics
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PERFORMANCE_ALERT',
        payload: { metric, value, threshold }
      });
    }
  }

  private startPerformanceTracking(): void {
    // Track performance every 10 seconds
    setInterval(() => {
      this.collectCurrentMetrics();
    }, 10000);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'PERFORMANCE_METRICS') {
          this.handleServiceWorkerMetrics(event.data.payload);
        }
      });
    }

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.collectCurrentMetrics();
      }
    });
  }

  private collectCurrentMetrics(): void {
    const metrics = this.getCurrentMetrics();
    this.updateMetrics(metrics);
  }

  private handleServiceWorkerMetrics(payload: any): void {
    const currentMetrics = this.getCurrentMetrics();
    
    if (payload.cacheStats) {
      // Update cache metrics from service worker
      const cacheStats = Object.values(payload.cacheStats) as any[];
      const totalRequests = cacheStats.reduce((sum, stat) => sum + stat.totalRequests, 0);
      const totalHits = cacheStats.reduce((sum, stat) => sum + (stat.hitRatio * stat.totalRequests), 0);
      
      currentMetrics.cacheMetrics = {
        hitRatio: totalRequests > 0 ? totalHits / totalRequests : 0,
        missRatio: totalRequests > 0 ? 1 - (totalHits / totalRequests) : 0,
        cacheSize: cacheStats.reduce((sum, stat) => sum + stat.cacheSize, 0),
        evictionCount: cacheStats.reduce((sum, stat) => sum + stat.evictionCount, 0)
      };
    }

    this.updateMetrics(currentMetrics);
  }

  // Public API methods
  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getCoreWebVitals(): CoreWebVitals {
    const latest = this.getLatestMetrics();
    return latest ? latest.coreWebVitals : {
      lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0
    };
  }

  public generatePerformanceReport(): any {
    const metrics = this.getAllMetrics();
    
    if (metrics.length === 0) {
      return { error: 'No metrics available' };
    }

    const latest = metrics[metrics.length - 1];
    const averages = this.calculateAverages(metrics);

    return {
      sessionId: this.sessionId,
      timestamp: new Date(),
      current: latest,
      averages,
      trends: this.calculateTrends(metrics),
      alerts: this.checkAllThresholds(latest)
    };
  }

  private calculateAverages(metrics: PerformanceMetrics[]): any {
    if (metrics.length === 0) return {};

    const sums = metrics.reduce((acc, metric) => {
      acc.lcp += metric.coreWebVitals.lcp;
      acc.fid += metric.coreWebVitals.fid;
      acc.cls += metric.coreWebVitals.cls;
      acc.fcp += metric.coreWebVitals.fcp;
      acc.ttfb += metric.coreWebVitals.ttfb;
      return acc;
    }, { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 });

    const count = metrics.length;
    return {
      lcp: sums.lcp / count,
      fid: sums.fid / count,
      cls: sums.cls / count,
      fcp: sums.fcp / count,
      ttfb: sums.ttfb / count
    };
  }

  private calculateTrends(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 2) return {};

    const recent = metrics.slice(-10); // Last 10 measurements
    const older = metrics.slice(-20, -10); // Previous 10 measurements

    if (older.length === 0) return {};

    const recentAvg = this.calculateAverages(recent);
    const olderAvg = this.calculateAverages(older);

    return {
      lcp: recentAvg.lcp - olderAvg.lcp,
      fid: recentAvg.fid - olderAvg.fid,
      cls: recentAvg.cls - olderAvg.cls,
      fcp: recentAvg.fcp - olderAvg.fcp,
      ttfb: recentAvg.ttfb - olderAvg.ttfb
    };
  }

  private checkAllThresholds(metrics: PerformanceMetrics): any[] {
    const alerts = [];
    const vitals = metrics.coreWebVitals;

    Object.entries(this.thresholds).forEach(([key, threshold]) => {
      const value = vitals[key as keyof CoreWebVitals];
      if (value > threshold) {
        alerts.push({
          metric: key,
          value,
          threshold,
          severity: value > threshold * 1.5 ? 'high' : 'medium'
        });
      }
    });

    return alerts;
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}