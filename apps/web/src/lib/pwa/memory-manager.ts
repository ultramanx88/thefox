/**
 * Memory Manager
 * Handles memory usage monitoring, optimization, and leak detection
 */

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercentage: number;
  timestamp: number;
}

export interface MemoryLeak {
  id: string;
  component: string;
  type: 'listener' | 'timer' | 'reference' | 'cache' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  memoryImpact: number; // bytes
  stackTrace?: string;
}

export interface MemoryOptimizationConfig {
  maxMemoryUsage: number; // bytes
  warningThreshold: number; // percentage (0-1)
  criticalThreshold: number; // percentage (0-1)
  cleanupInterval: number; // milliseconds
  leakDetectionEnabled: boolean;
  autoCleanupEnabled: boolean;
  gcSuggestionThreshold: number; // percentage (0-1)
}

export class MemoryManager {
  private config: MemoryOptimizationConfig;
  private memoryHistory: MemoryStats[] = [];
  private detectedLeaks: MemoryLeak[] = [];
  private cleanupTasks: Map<string, () => Promise<void>> = new Map();
  private monitoringInterval: number | null = null;
  private observers: Map<string, PerformanceObserver> = new Map();
  private weakRefs: Set<WeakRef<any>> = new Set();

  constructor(config: Partial<MemoryOptimizationConfig> = {}) {
    this.config = {
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      warningThreshold: 0.7, // 70%
      criticalThreshold: 0.9, // 90%
      cleanupInterval: 30000, // 30 seconds
      leakDetectionEnabled: true,
      autoCleanupEnabled: true,
      gcSuggestionThreshold: 0.8, // 80%
      ...config
    };

    this.initializeMonitoring();
    this.setupCleanupTasks();
    this.startMemoryMonitoring();
  }

  /**
   * Get current memory statistics
   */
  getCurrentMemoryStats(): MemoryStats | null {
    if (!this.isMemoryAPIAvailable()) {
      return null;
    }

    const memory = (performance as any).memory;
    const stats: MemoryStats = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryUsagePercentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    // Add to history
    this.memoryHistory.push(stats);
    
    // Keep only last 100 entries
    if (this.memoryHistory.length > 100) {
      this.memoryHistory = this.memoryHistory.slice(-100);
    }

    return stats;
  }

  /**
   * Monitor memory usage and trigger optimizations
   */
  private startMemoryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = window.setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      if (!stats) return;

      // Check thresholds and trigger actions
      if (stats.memoryUsagePercentage >= this.config.criticalThreshold) {
        this.handleCriticalMemoryUsage(stats);
      } else if (stats.memoryUsagePercentage >= this.config.warningThreshold) {
        this.handleWarningMemoryUsage(stats);
      }

      // Detect memory leaks
      if (this.config.leakDetectionEnabled) {
        this.detectMemoryLeaks();
      }

      // Auto cleanup if enabled
      if (this.config.autoCleanupEnabled) {
        this.performAutomaticCleanup();
      }

    }, this.config.cleanupInterval);
  }

  /**
   * Handle critical memory usage
   */
  private async handleCriticalMemoryUsage(stats: MemoryStats): Promise<void> {
    console.warn('Critical memory usage detected:', stats);

    // Perform aggressive cleanup
    await this.performAggressiveCleanup();

    // Suggest garbage collection
    this.suggestGarbageCollection();

    // Notify listeners
    this.notifyMemoryPressure('critical', stats);
  }

  /**
   * Handle warning memory usage
   */
  private async handleWarningMemoryUsage(stats: MemoryStats): Promise<void> {
    console.warn('High memory usage detected:', stats);

    // Perform moderate cleanup
    await this.performModerateCleanup();

    // Notify listeners
    this.notifyMemoryPressure('warning', stats);
  }

  /**
   * Perform aggressive memory cleanup
   */
  private async performAggressiveCleanup(): Promise<void> {
    console.log('Performing aggressive memory cleanup...');

    // Run all cleanup tasks
    for (const [name, task] of this.cleanupTasks) {
      try {
        await task();
        console.log(`Completed cleanup task: ${name}`);
      } catch (error) {
        console.error(`Cleanup task failed: ${name}`, error);
      }
    }

    // Clear weak references
    this.cleanupWeakReferences();

    // Clear memory history (keep only recent entries)
    this.memoryHistory = this.memoryHistory.slice(-10);

    // Clear old leak records
    this.detectedLeaks = this.detectedLeaks.filter(
      leak => Date.now() - leak.detectedAt < 300000 // Keep last 5 minutes
    );
  }

  /**
   * Perform moderate memory cleanup
   */
  private async performModerateCleanup(): Promise<void> {
    console.log('Performing moderate memory cleanup...');

    // Run high-priority cleanup tasks only
    const highPriorityTasks = ['cache-cleanup', 'dom-cleanup', 'event-cleanup'];
    
    for (const taskName of highPriorityTasks) {
      const task = this.cleanupTasks.get(taskName);
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error(`Cleanup task failed: ${taskName}`, error);
        }
      }
    }

    // Partial weak reference cleanup
    this.cleanupWeakReferences(0.5); // Clean 50%
  }

  /**
   * Perform automatic cleanup based on conditions
   */
  private async performAutomaticCleanup(): Promise<void> {
    const stats = this.getCurrentMemoryStats();
    if (!stats) return;

    // Only run if memory usage is above GC suggestion threshold
    if (stats.memoryUsagePercentage >= this.config.gcSuggestionThreshold) {
      await this.performModerateCleanup();
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    const currentStats = this.getCurrentMemoryStats();
    if (!currentStats || this.memoryHistory.length < 10) return;

    // Analyze memory growth trend
    const recentHistory = this.memoryHistory.slice(-10);
    const memoryGrowth = this.analyzeMemoryGrowth(recentHistory);

    if (memoryGrowth.isSuspicious) {
      const leak: MemoryLeak = {
        id: `leak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        component: 'unknown',
        type: 'unknown',
        severity: this.calculateLeakSeverity(memoryGrowth.growthRate),
        description: `Suspicious memory growth detected: ${memoryGrowth.growthRate.toFixed(2)}% increase`,
        detectedAt: Date.now(),
        memoryImpact: memoryGrowth.totalGrowth,
        stackTrace: this.captureStackTrace()
      };

      this.detectedLeaks.push(leak);
      console.warn('Potential memory leak detected:', leak);
    }

    // Detect specific leak patterns
    this.detectEventListenerLeaks();
    this.detectTimerLeaks();
    this.detectDOMLeaks();
  }

  /**
   * Analyze memory growth patterns
   */
  private analyzeMemoryGrowth(history: MemoryStats[]): {
    isSuspicious: boolean;
    growthRate: number;
    totalGrowth: number;
  } {
    if (history.length < 5) {
      return { isSuspicious: false, growthRate: 0, totalGrowth: 0 };
    }

    const first = history[0];
    const last = history[history.length - 1];
    const totalGrowth = last.usedJSHeapSize - first.usedJSHeapSize;
    const growthRate = (totalGrowth / first.usedJSHeapSize) * 100;

    // Consider suspicious if memory grew more than 20% consistently
    const isSuspicious = growthRate > 20 && this.isConsistentGrowth(history);

    return { isSuspicious, growthRate, totalGrowth };
  }

  /**
   * Check if memory growth is consistent (not just a spike)
   */
  private isConsistentGrowth(history: MemoryStats[]): boolean {
    let increasingCount = 0;
    
    for (let i = 1; i < history.length; i++) {
      if (history[i].usedJSHeapSize > history[i - 1].usedJSHeapSize) {
        increasingCount++;
      }
    }

    // Consider consistent if 70% of measurements show growth
    return increasingCount / (history.length - 1) >= 0.7;
  }

  /**
   * Calculate leak severity based on growth rate
   */
  private calculateLeakSeverity(growthRate: number): MemoryLeak['severity'] {
    if (growthRate > 50) return 'critical';
    if (growthRate > 30) return 'high';
    if (growthRate > 20) return 'medium';
    return 'low';
  }

  /**
   * Detect event listener leaks
   */
  private detectEventListenerLeaks(): void {
    // This would require tracking event listeners
    // For now, we'll implement a basic check
    const eventTargets = document.querySelectorAll('*');
    let suspiciousElements = 0;

    eventTargets.forEach(element => {
      // Check for elements with many event listeners (heuristic)
      const listeners = (element as any)._listeners;
      if (listeners && Object.keys(listeners).length > 10) {
        suspiciousElements++;
      }
    });

    if (suspiciousElements > 50) {
      const leak: MemoryLeak = {
        id: `listener_leak_${Date.now()}`,
        component: 'DOM',
        type: 'listener',
        severity: 'medium',
        description: `${suspiciousElements} elements with excessive event listeners detected`,
        detectedAt: Date.now(),
        memoryImpact: suspiciousElements * 1000 // Estimate
      };

      this.detectedLeaks.push(leak);
    }
  }

  /**
   * Detect timer leaks
   */
  private detectTimerLeaks(): void {
    // Track active timers (this would need to be implemented at the application level)
    const activeTimers = (window as any).__activeTimers || [];
    
    if (activeTimers.length > 100) {
      const leak: MemoryLeak = {
        id: `timer_leak_${Date.now()}`,
        component: 'Timers',
        type: 'timer',
        severity: 'high',
        description: `${activeTimers.length} active timers detected`,
        detectedAt: Date.now(),
        memoryImpact: activeTimers.length * 500 // Estimate
      };

      this.detectedLeaks.push(leak);
    }
  }

  /**
   * Detect DOM leaks
   */
  private detectDOMLeaks(): void {
    const totalElements = document.querySelectorAll('*').length;
    
    // Heuristic: too many DOM elements might indicate a leak
    if (totalElements > 10000) {
      const leak: MemoryLeak = {
        id: `dom_leak_${Date.now()}`,
        component: 'DOM',
        type: 'reference',
        severity: 'medium',
        description: `${totalElements} DOM elements detected`,
        detectedAt: Date.now(),
        memoryImpact: totalElements * 200 // Estimate
      };

      this.detectedLeaks.push(leak);
    }
  }

  /**
   * Register a cleanup task
   */
  registerCleanupTask(name: string, task: () => Promise<void>): void {
    this.cleanupTasks.set(name, task);
    console.log(`Registered cleanup task: ${name}`);
  }

  /**
   * Register a weak reference for tracking
   */
  registerWeakReference<T extends object>(obj: T): WeakRef<T> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);
    return weakRef;
  }

  /**
   * Clean up weak references
   */
  private cleanupWeakReferences(ratio: number = 1): void {
    const refsArray = Array.from(this.weakRefs);
    const toClean = Math.floor(refsArray.length * ratio);
    
    let cleaned = 0;
    for (const ref of refsArray) {
      if (cleaned >= toClean) break;
      
      if (!ref.deref()) {
        this.weakRefs.delete(ref);
        cleaned++;
      }
    }

    console.log(`Cleaned up ${cleaned} weak references`);
  }

  /**
   * Suggest garbage collection
   */
  private suggestGarbageCollection(): void {
    // Modern browsers don't expose gc() for security reasons
    // But we can suggest it through various means
    
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('Manual garbage collection triggered');
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error);
      }
    }

    // Alternative: create memory pressure to encourage GC
    this.createMemoryPressure();
  }

  /**
   * Create memory pressure to encourage garbage collection
   */
  private createMemoryPressure(): void {
    // Create and immediately discard large objects to encourage GC
    const pressure = [];
    for (let i = 0; i < 100; i++) {
      pressure.push(new Array(10000).fill(Math.random()));
    }
    // Let them go out of scope
  }

  /**
   * Setup default cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Cache cleanup
    this.registerCleanupTask('cache-cleanup', async () => {
      // Clear various caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          // Remove oldest 20% of entries
          const toRemove = Math.floor(requests.length * 0.2);
          for (let i = 0; i < toRemove; i++) {
            await cache.delete(requests[i]);
          }
        }
      }
    });

    // DOM cleanup
    this.registerCleanupTask('dom-cleanup', async () => {
      // Remove unused DOM elements
      const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
      unusedElements.forEach(element => element.remove());
      
      // Clear text content of hidden elements
      const hiddenElements = document.querySelectorAll('[style*="display: none"]');
      hiddenElements.forEach(element => {
        if (element.textContent && element.textContent.length > 1000) {
          element.textContent = '';
        }
      });
    });

    // Event cleanup
    this.registerCleanupTask('event-cleanup', async () => {
      // This would need application-specific implementation
      // For now, just log
      console.log('Event cleanup task executed');
    });

    // Storage cleanup
    this.registerCleanupTask('storage-cleanup', async () => {
      // Clear old localStorage entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('temp_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear old sessionStorage
      if (sessionStorage.length > 50) {
        sessionStorage.clear();
      }
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn('Long task detected:', entry);
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task monitoring not supported');
      }

      // Monitor memory usage
      try {
        const measureObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'memory-usage') {
              // Handle memory usage measurements
            }
          });
        });
        
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);
      } catch (error) {
        console.warn('Measure monitoring not supported');
      }
    }
  }

  /**
   * Notify memory pressure to listeners
   */
  private notifyMemoryPressure(level: 'warning' | 'critical', stats: MemoryStats): void {
    // Dispatch custom event
    const event = new CustomEvent('memory-pressure', {
      detail: { level, stats }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get memory optimization report
   */
  getOptimizationReport(): {
    currentStats: MemoryStats | null;
    memoryHistory: MemoryStats[];
    detectedLeaks: MemoryLeak[];
    cleanupTasks: string[];
    recommendations: string[];
  } {
    const currentStats = this.getCurrentMemoryStats();
    const recommendations = this.generateRecommendations(currentStats);

    return {
      currentStats,
      memoryHistory: this.memoryHistory.slice(-20), // Last 20 entries
      detectedLeaks: this.detectedLeaks,
      cleanupTasks: Array.from(this.cleanupTasks.keys()),
      recommendations
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(stats: MemoryStats | null): string[] {
    const recommendations: string[] = [];

    if (!stats) {
      recommendations.push('Memory API not available - consider using Chrome DevTools for memory profiling');
      return recommendations;
    }

    if (stats.memoryUsagePercentage > 0.8) {
      recommendations.push('Memory usage is high - consider reducing cache sizes');
      recommendations.push('Review and cleanup unused event listeners');
      recommendations.push('Check for memory leaks in long-running operations');
    }

    if (this.detectedLeaks.length > 0) {
      recommendations.push(`${this.detectedLeaks.length} potential memory leaks detected - review and fix`);
    }

    if (this.memoryHistory.length > 10) {
      const growth = this.analyzeMemoryGrowth(this.memoryHistory.slice(-10));
      if (growth.isSuspicious) {
        recommendations.push('Suspicious memory growth pattern detected - investigate potential leaks');
      }
    }

    return recommendations;
  }

  /**
   * Check if Memory API is available
   */
  private isMemoryAPIAvailable(): boolean {
    return 'memory' in performance && typeof (performance as any).memory === 'object';
  }

  /**
   * Capture stack trace for debugging
   */
  private captureStackTrace(): string {
    try {
      throw new Error();
    } catch (error) {
      return (error as Error).stack || 'Stack trace not available';
    }
  }

  /**
   * Cleanup and stop monitoring
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear data
    this.memoryHistory = [];
    this.detectedLeaks = [];
    this.cleanupTasks.clear();
    this.weakRefs.clear();

    console.log('Memory manager destroyed');
  }
}