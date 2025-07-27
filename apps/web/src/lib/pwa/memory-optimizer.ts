/**
 * Memory and Resource Optimizer
 * Handles memory usage monitoring, automatic cleanup, and resource management
 */

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercentage: number;
  estimatedAvailableMemory: number;
}

export interface ResourceUsage {
  memory: MemoryStats;
  storage: StorageStats;
  cpu: CPUStats;
  network: NetworkStats;
  battery?: BatteryStats;
}

export interface StorageStats {
  quota: number;
  usage: number;
  usagePercentage: number;
  availableSpace: number;
  cacheUsage: number;
  indexedDBUsage: number;
}

export interface CPUStats {
  usage: number; // Estimated percentage
  loadAverage: number[];
  activeWorkers: number;
  backgroundTasks: number;
}

export interface NetworkStats {
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  onLine: boolean;
}

export interface BatteryStats {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export interface OptimizationConfig {
  memoryThresholds: {
    warning: number; // 70%
    critical: number; // 85%
    emergency: number; // 95%
  };
  storageThresholds: {
    warning: number; // 80%
    critical: number; // 90%
    emergency: number; // 95%
  };
  cleanupIntervals: {
    memory: number; // 30 seconds
    storage: number; // 5 minutes
    cache: number; // 10 minutes
  };
  aggressiveCleanup: boolean;
  autoGarbageCollection: boolean;
  memoryLeakDetection: boolean;
}

export class MemoryOptimizer {
  private config: OptimizationConfig;
  private memoryHistory: MemoryStats[] = [];
  private cleanupTasks: Map<string, NodeJS.Timeout> = new Map();
  private resourceMonitors: Map<string, any> = new Map();
  private memoryLeaks: Map<string, any> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      memoryThresholds: {
        warning: 0.7,
        critical: 0.85,
        emergency: 0.95
      },
      storageThresholds: {
        warning: 0.8,
        critical: 0.9,
        emergency: 0.95
      },
      cleanupIntervals: {
        memory: 30000, // 30 seconds
        storage: 300000, // 5 minutes
        cache: 600000 // 10 minutes
      },
      aggressiveCleanup: false,
      autoGarbageCollection: true,
      memoryLeakDetection: true,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize memory optimizer
   */
  private initialize(): void {
    this.setupMemoryMonitoring();
    this.setupStorageMonitoring();
    this.setupPerformanceObservers();
    this.startCleanupSchedulers();
    
    if (this.config.memoryLeakDetection) {
      this.setupMemoryLeakDetection();
    }

    console.log('Memory optimizer initialized');
  }

  /**
   * Get current memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    const performance = (window as any).performance;
    
    if (performance && performance.memory) {
      const memory = performance.memory;
      const memoryUsagePercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryUsagePercentage,
        estimatedAvailableMemory: memory.jsHeapSizeLimit - memory.usedJSHeapSize
      };
    }

    // Fallback estimation
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 2147483648, // 2GB default
      memoryUsagePercentage: 0,
      estimatedAvailableMemory: 2147483648
    };
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const usagePercentage = quota > 0 ? usage / quota : 0;

      // Get cache usage
      const cacheUsage = await this.getCacheUsage();
      
      // Get IndexedDB usage (estimated)
      const indexedDBUsage = await this.getIndexedDBUsage();

      return {
        quota,
        usage,
        usagePercentage,
        availableSpace: quota - usage,
        cacheUsage,
        indexedDBUsage
      };
    } catch (error) {
      console.warn('Failed to get storage stats:', error);
      return {
        quota: 0,
        usage: 0,
        usagePercentage: 0,
        availableSpace: 0,
        cacheUsage: 0,
        indexedDBUsage: 0
      };
    }
  }

  /**
   * Get CPU statistics (estimated)
   */
  getCPUStats(): CPUStats {
    const activeWorkers = this.resourceMonitors.get('workers')?.size || 0;
    const backgroundTasks = this.resourceMonitors.get('backgroundTasks')?.size || 0;
    
    // Estimate CPU usage based on active tasks and performance
    let estimatedUsage = 0;
    if (activeWorkers > 0) estimatedUsage += activeWorkers * 10;
    if (backgroundTasks > 0) estimatedUsage += backgroundTasks * 5;
    
    return {
      usage: Math.min(estimatedUsage, 100),
      loadAverage: [0, 0, 0], // Not available in browser
      activeWorkers,
      backgroundTasks
    };
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): NetworkStats {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      onLine: navigator.onLine
    };
  }

  /**
   * Get battery statistics
   */
  async getBatteryStats(): Promise<BatteryStats | undefined> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    return undefined;
  }

  /**
   * Get comprehensive resource usage
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    const [memory, storage, battery] = await Promise.all([
      this.getMemoryStats(),
      this.getStorageStats(),
      this.getBatteryStats()
    ]);

    return {
      memory,
      storage,
      cpu: this.getCPUStats(),
      network: this.getNetworkStats(),
      battery
    };
  }

  /**
   * Perform memory cleanup
   */
  async performMemoryCleanup(aggressive: boolean = false): Promise<void> {
    console.log(`Performing ${aggressive ? 'aggressive' : 'standard'} memory cleanup`);

    try {
      // Clear unused variables and references
      await this.clearUnusedReferences();
      
      // Clean up event listeners
      await this.cleanupEventListeners();
      
      // Clear expired caches
      await this.clearExpiredCaches();
      
      // Clean up DOM elements
      await this.cleanupDOMElements();
      
      if (aggressive) {
        // Force garbage collection if available
        await this.forceGarbageCollection();
        
        // Clear all non-essential caches
        await this.clearNonEssentialCaches();
        
        // Reduce memory footprint of large objects
        await this.optimizeLargeObjects();
      }

      console.log('Memory cleanup completed');
    } catch (error) {
      console.error('Memory cleanup failed:', error);
    }
  }

  /**
   * Perform storage cleanup
   */
  async performStorageCleanup(): Promise<void> {
    console.log('Performing storage cleanup');

    try {
      // Clean up old cache entries
      await this.cleanupOldCacheEntries();
      
      // Clean up IndexedDB
      await this.cleanupIndexedDB();
      
      // Clean up localStorage
      await this.cleanupLocalStorage();
      
      // Clean up sessionStorage
      await this.cleanupSessionStorage();

      console.log('Storage cleanup completed');
    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }
  }

  /**
   * Detect and handle memory leaks
   */
  async detectMemoryLeaks(): Promise<any[]> {
    const currentMemory = await this.getMemoryStats();
    this.memoryHistory.push(currentMemory);
    
    // Keep only last 10 measurements
    if (this.memoryHistory.length > 10) {
      this.memoryHistory = this.memoryHistory.slice(-10);
    }

    const leaks: any[] = [];

    if (this.memoryHistory.length >= 5) {
      // Check for consistent memory growth
      const recentGrowth = this.calculateMemoryGrowthTrend();
      
      if (recentGrowth > 0.1) { // 10% growth trend
        leaks.push({
          type: 'consistent_growth',
          severity: 'warning',
          growth: recentGrowth,
          description: 'Consistent memory growth detected'
        });
      }

      // Check for sudden memory spikes
      const memorySpike = this.detectMemorySpikes();
      if (memorySpike) {
        leaks.push(memorySpike);
      }
    }

    // Store detected leaks
    leaks.forEach(leak => {
      this.memoryLeaks.set(leak.type, {
        ...leak,
        detectedAt: Date.now()
      });
    });

    return leaks;
  }

  /**
   * Optimize memory usage automatically
   */
  async optimizeMemoryUsage(): Promise<void> {
    const memoryStats = await this.getMemoryStats();
    const { memoryUsagePercentage } = memoryStats;

    if (memoryUsagePercentage >= this.config.memoryThresholds.emergency) {
      console.warn('Emergency memory cleanup triggered');
      await this.performMemoryCleanup(true);
      
      // Also trigger storage cleanup
      await this.performStorageCleanup();
      
    } else if (memoryUsagePercentage >= this.config.memoryThresholds.critical) {
      console.warn('Critical memory cleanup triggered');
      await this.performMemoryCleanup(true);
      
    } else if (memoryUsagePercentage >= this.config.memoryThresholds.warning) {
      console.log('Warning level memory cleanup triggered');
      await this.performMemoryCleanup(false);
    }

    // Check for memory leaks
    if (this.config.memoryLeakDetection) {
      const leaks = await this.detectMemoryLeaks();
      if (leaks.length > 0) {
        console.warn('Memory leaks detected:', leaks);
        await this.handleMemoryLeaks(leaks);
      }
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const resourceUsage = await this.getResourceUsage();
    const recommendations: string[] = [];

    // Memory recommendations
    if (resourceUsage.memory.memoryUsagePercentage > 0.8) {
      recommendations.push('Consider reducing memory usage by clearing unused data');
    }

    // Storage recommendations
    if (resourceUsage.storage.usagePercentage > 0.9) {
      recommendations.push('Storage is nearly full, consider clearing old cache data');
    }

    // Network recommendations
    if (resourceUsage.network.saveData) {
      recommendations.push('Data saver mode detected, optimize for reduced bandwidth usage');
    }

    // Battery recommendations
    if (resourceUsage.battery && resourceUsage.battery.level < 0.2 && !resourceUsage.battery.charging) {
      recommendations.push('Low battery detected, consider reducing background activities');
    }

    // CPU recommendations
    if (resourceUsage.cpu.usage > 80) {
      recommendations.push('High CPU usage detected, consider reducing concurrent operations');
    }

    return recommendations;
  }

  // Private helper methods

  private setupMemoryMonitoring(): void {
    // Monitor memory usage periodically
    const memoryMonitor = setInterval(async () => {
      await this.optimizeMemoryUsage();
    }, this.config.cleanupIntervals.memory);

    this.cleanupTasks.set('memoryMonitor', memoryMonitor);
  }

  private setupStorageMonitoring(): void {
    // Monitor storage usage periodically
    const storageMonitor = setInterval(async () => {
      const storageStats = await this.getStorageStats();
      
      if (storageStats.usagePercentage >= this.config.storageThresholds.critical) {
        await this.performStorageCleanup();
      }
    }, this.config.cleanupIntervals.storage);

    this.cleanupTasks.set('storageMonitor', storageMonitor);
  }

  private setupPerformanceObservers(): void {
    try {
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', entry.duration + 'ms');
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);

      // Observe memory usage
      const memoryObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          // Handle memory-related performance entries
        });
      });
      
      this.observers.set('memory', memoryObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  private startCleanupSchedulers(): void {
    // Cache cleanup scheduler
    const cacheCleanup = setInterval(async () => {
      await this.clearExpiredCaches();
    }, this.config.cleanupIntervals.cache);

    this.cleanupTasks.set('cacheCleanup', cacheCleanup);
  }

  private setupMemoryLeakDetection(): void {
    // Set up periodic memory leak detection
    const leakDetection = setInterval(async () => {
      await this.detectMemoryLeaks();
    }, 60000); // Every minute

    this.cleanupTasks.set('leakDetection', leakDetection);
  }

  private async clearUnusedReferences(): Promise<void> {
    // Clear unused references in resource monitors
    this.resourceMonitors.forEach((monitor, key) => {
      if (monitor && typeof monitor.cleanup === 'function') {
        monitor.cleanup();
      }
    });
  }

  private async cleanupEventListeners(): Promise<void> {
    // Remove unused event listeners
    // This would be implemented based on your specific event listener tracking
  }

  private async clearExpiredCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const cacheDate = response.headers.get('date');
            if (cacheDate) {
              const age = Date.now() - new Date(cacheDate).getTime();
              const maxAge = 24 * 60 * 60 * 1000; // 24 hours
              
              if (age > maxAge) {
                await cache.delete(request);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired caches:', error);
    }
  }

  private async cleanupDOMElements(): Promise<void> {
    // Remove unused DOM elements
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach(element => {
      element.remove();
    });
  }

  private async forceGarbageCollection(): Promise<void> {
    // Force garbage collection if available (Chrome DevTools)
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  private async clearNonEssentialCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      const nonEssentialCaches = cacheNames.filter(name => 
        !name.includes('critical') && !name.includes('essential')
      );
      
      for (const cacheName of nonEssentialCaches) {
        await caches.delete(cacheName);
      }
    } catch (error) {
      console.warn('Failed to clear non-essential caches:', error);
    }
  }

  private async optimizeLargeObjects(): Promise<void> {
    // Optimize large objects by removing unnecessary properties
    // This would be implemented based on your specific large objects
  }

  private async getCacheUsage(): Promise<number> {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.warn('Failed to calculate cache usage:', error);
      return 0;
    }
  }

  private async getIndexedDBUsage(): Promise<number> {
    // Estimate IndexedDB usage
    // This is a simplified estimation
    return 0;
  }

  private calculateMemoryGrowthTrend(): number {
    if (this.memoryHistory.length < 2) return 0;
    
    const recent = this.memoryHistory.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    return (last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize;
  }

  private detectMemorySpikes(): any | null {
    if (this.memoryHistory.length < 2) return null;
    
    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const previous = this.memoryHistory[this.memoryHistory.length - 2];
    
    const spike = (current.usedJSHeapSize - previous.usedJSHeapSize) / previous.usedJSHeapSize;
    
    if (spike > 0.5) { // 50% increase
      return {
        type: 'memory_spike',
        severity: 'critical',
        spike,
        description: 'Sudden memory spike detected'
      };
    }
    
    return null;
  }

  private async handleMemoryLeaks(leaks: any[]): Promise<void> {
    for (const leak of leaks) {
      switch (leak.type) {
        case 'consistent_growth':
          await this.performMemoryCleanup(true);
          break;
        case 'memory_spike':
          await this.forceGarbageCollection();
          break;
      }
    }
  }

  private async cleanupOldCacheEntries(): Promise<void> {
    // Implementation for cleaning up old cache entries
    await this.clearExpiredCaches();
  }

  private async cleanupIndexedDB(): Promise<void> {
    // Implementation for cleaning up IndexedDB
    // This would integrate with your IndexedDB cleanup logic
  }

  private async cleanupLocalStorage(): Promise<void> {
    // Clean up expired localStorage items
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('temp_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private async cleanupSessionStorage(): Promise<void> {
    // Clean up expired sessionStorage items
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('temp_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Cleanup and destroy optimizer
   */
  destroy(): void {
    // Clear all intervals
    this.cleanupTasks.forEach((task, key) => {
      clearInterval(task);
    });
    this.cleanupTasks.clear();

    // Disconnect observers
    this.observers.forEach((observer, key) => {
      observer.disconnect();
    });
    this.observers.clear();

    // Clear resource monitors
    this.resourceMonitors.clear();
    this.memoryLeaks.clear();
    this.memoryHistory = [];

    console.log('Memory optimizer destroyed');
  }
}