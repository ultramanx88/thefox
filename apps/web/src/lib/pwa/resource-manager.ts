/**
 * Resource Manager
 * Central manager for memory, storage, and CPU optimization
 */

import { MemoryOptimizer, MemoryStats, ResourceUsage } from './memory-optimizer';
import { StorageQuotaManager, StorageQuota, StorageBreakdown } from './storage-quota-manager';
import { CPUOptimizer, CPUMetrics } from './cpu-optimizer';

export interface SystemResources {
  memory: MemoryStats;
  storage: StorageQuota & { breakdown: StorageBreakdown };
  cpu: CPUMetrics;
  network: NetworkInfo;
  battery?: BatteryInfo;
  performance: PerformanceMetrics;
}

export interface NetworkInfo {
  online: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameDrops: number;
  renderTime: number;
  scriptTime: number;
  layoutTime: number;
}

export interface ResourceManagerConfig {
  memoryConfig?: any;
  storageConfig?: any;
  cpuConfig?: any;
  monitoringInterval: number;
  autoOptimization: boolean;
  aggressiveCleanup: boolean;
  performanceThresholds: {
    memory: number; // 85%
    storage: number; // 90%
    cpu: number; // 80%
    fps: number; // 30 fps minimum
  };
}

export interface OptimizationReport {
  timestamp: number;
  resourcesBefore: SystemResources;
  resourcesAfter: SystemResources;
  optimizationsPerformed: string[];
  improvements: {
    memoryFreed: number;
    storageFreed: number;
    cpuReduced: number;
    performanceGain: number;
  };
  recommendations: string[];
}

export class ResourceManager {
  private config: ResourceManagerConfig;
  private memoryOptimizer: MemoryOptimizer;
  private storageManager: StorageQuotaManager;
  private cpuOptimizer: CPUOptimizer;
  
  private monitoringInterval?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;
  private resourceHistory: SystemResources[] = [];
  private optimizationHistory: OptimizationReport[] = [];
  
  private resourceObservers: ((resources: SystemResources) => void)[] = [];

  constructor(config: Partial<ResourceManagerConfig> = {}) {
    this.config = {
      monitoringInterval: 30000, // 30 seconds
      autoOptimization: true,
      aggressiveCleanup: false,
      performanceThresholds: {
        memory: 0.85,
        storage: 0.9,
        cpu: 0.8,
        fps: 30
      },
      ...config
    };

    // Initialize optimizers
    this.memoryOptimizer = new MemoryOptimizer(this.config.memoryConfig);
    this.storageManager = new StorageQuotaManager(this.config.storageConfig);
    this.cpuOptimizer = new CPUOptimizer(this.config.cpuConfig);

    this.initialize();
  }

  /**
   * Initialize resource manager
   */
  private async initialize(): Promise<void> {
    try {
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Start resource monitoring
      this.startResourceMonitoring();
      
      // Setup storage quota observer
      this.storageManager.addQuotaObserver((quota) => {
        if (quota.usagePercentage > this.config.performanceThresholds.storage) {
          this.handleStorageThresholdExceeded(quota);
        }
      });

      console.log('Resource manager initialized');
    } catch (error) {
      console.error('Failed to initialize resource manager:', error);
    }
  }

  /**
   * Get current system resources
   */
  async getSystemResources(): Promise<SystemResources> {
    const [memory, storageQuota, storageBreakdown, cpu, network, battery, performance] = await Promise.all([
      this.memoryOptimizer.getMemoryStats(),
      this.storageManager.getStorageQuota(),
      this.storageManager.getStorageBreakdown(),
      Promise.resolve(this.cpuOptimizer.getCPUMetrics()),
      Promise.resolve(this.getNetworkInfo()),
      this.getBatteryInfo(),
      Promise.resolve(this.getPerformanceMetrics())
    ]);

    return {
      memory,
      storage: { ...storageQuota, breakdown: storageBreakdown },
      cpu,
      network,
      battery,
      performance
    };
  }

  /**
   * Perform comprehensive resource optimization
   */
  async optimizeResources(aggressive: boolean = false): Promise<OptimizationReport> {
    console.log(`Starting ${aggressive ? 'aggressive' : 'standard'} resource optimization`);
    
    const resourcesBefore = await this.getSystemResources();
    const optimizationsPerformed: string[] = [];
    
    try {
      // Memory optimization
      if (resourcesBefore.memory.memoryUsagePercentage > this.config.performanceThresholds.memory) {
        await this.memoryOptimizer.performMemoryCleanup(aggressive);
        optimizationsPerformed.push('Memory cleanup');
      }

      // Storage optimization
      if (resourcesBefore.storage.usagePercentage > this.config.performanceThresholds.storage) {
        const freedBytes = await this.storageManager.performCleanup();
        optimizationsPerformed.push(`Storage cleanup (${this.formatBytes(freedBytes)} freed)`);
      }

      // CPU optimization
      if (resourcesBefore.cpu.estimatedUsage > this.config.performanceThresholds.cpu) {
        await this.cpuOptimizer.optimizeBackgroundProcesses();
        optimizationsPerformed.push('CPU optimization');
      }

      // Performance optimization
      if (resourcesBefore.performance.fps < this.config.performanceThresholds.fps) {
        await this.optimizePerformance();
        optimizationsPerformed.push('Performance optimization');
      }

      // Additional aggressive optimizations
      if (aggressive) {
        await this.performAggressiveOptimization();
        optimizationsPerformed.push('Aggressive optimization');
      }

      // Get resources after optimization
      const resourcesAfter = await this.getSystemResources();
      
      // Calculate improvements
      const improvements = this.calculateImprovements(resourcesBefore, resourcesAfter);
      
      // Get recommendations
      const recommendations = await this.getOptimizationRecommendations(resourcesAfter);
      
      const report: OptimizationReport = {
        timestamp: Date.now(),
        resourcesBefore,
        resourcesAfter,
        optimizationsPerformed,
        improvements,
        recommendations
      };

      // Store optimization history
      this.optimizationHistory.push(report);
      if (this.optimizationHistory.length > 50) {
        this.optimizationHistory = this.optimizationHistory.slice(-50);
      }

      console.log('Resource optimization completed:', report);
      return report;

    } catch (error) {
      console.error('Resource optimization failed:', error);
      throw error;
    }
  }

  /**
   * Schedule a CPU task with resource awareness
   */
  async scheduleTask(
    name: string,
    execute: () => Promise<any>,
    priority: 'critical' | 'high' | 'medium' | 'low' | 'idle' = 'medium',
    estimatedDuration: number = 10
  ): Promise<string> {
    // Check if we have enough resources
    const resources = await this.getSystemResources();
    
    // Defer non-critical tasks if resources are constrained
    if (priority !== 'critical' && this.areResourcesConstrained(resources)) {
      priority = 'low'; // Downgrade priority
    }

    return this.cpuOptimizer.scheduleTask(name, execute, priority, estimatedDuration);
  }

  /**
   * Reserve resources for critical operations
   */
  async reserveResources(memoryBytes: number, storageBytes: number): Promise<boolean> {
    const memoryAvailable = await this.checkMemoryAvailability(memoryBytes);
    const storageAvailable = await this.storageManager.reserveSpace(storageBytes);
    
    return memoryAvailable && storageAvailable;
  }

  /**
   * Get resource usage trends
   */
  getResourceTrends(hours: number = 1): any {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentHistory = this.resourceHistory.filter(r => r.timestamp > cutoff);
    
    if (recentHistory.length < 2) {
      return null;
    }

    const first = recentHistory[0];
    const last = recentHistory[recentHistory.length - 1];
    
    return {
      memory: {
        trend: last.memory.memoryUsagePercentage - first.memory.memoryUsagePercentage,
        average: recentHistory.reduce((sum, r) => sum + r.memory.memoryUsagePercentage, 0) / recentHistory.length
      },
      storage: {
        trend: last.storage.usagePercentage - first.storage.usagePercentage,
        average: recentHistory.reduce((sum, r) => sum + r.storage.usagePercentage, 0) / recentHistory.length
      },
      cpu: {
        trend: last.cpu.estimatedUsage - first.cpu.estimatedUsage,
        average: recentHistory.reduce((sum, r) => sum + r.cpu.estimatedUsage, 0) / recentHistory.length
      }
    };
  }

  /**
   * Add resource observer
   */
  addResourceObserver(observer: (resources: SystemResources) => void): void {
    this.resourceObservers.push(observer);
  }

  /**
   * Remove resource observer
   */
  removeResourceObserver(observer: (resources: SystemResources) => void): void {
    const index = this.resourceObservers.indexOf(observer);
    if (index > -1) {
      this.resourceObservers.splice(index, 1);
    }
  }

  // Private methods

  private setupPerformanceMonitoring(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // Process performance entries
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            // Handle custom performance measures
          }
        });
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private startResourceMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const resources = await this.getSystemResources();
        
        // Store in history
        this.resourceHistory.push({ ...resources, timestamp: Date.now() } as any);
        if (this.resourceHistory.length > 100) {
          this.resourceHistory = this.resourceHistory.slice(-100);
        }

        // Notify observers
        this.notifyResourceObservers(resources);

        // Auto optimization if enabled
        if (this.config.autoOptimization && this.shouldAutoOptimize(resources)) {
          await this.optimizeResources(this.config.aggressiveCleanup);
        }

      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, this.config.monitoringInterval);
  }

  private notifyResourceObservers(resources: SystemResources): void {
    this.resourceObservers.forEach(observer => {
      try {
        observer(resources);
      } catch (error) {
        console.error('Error in resource observer:', error);
      }
    });
  }

  private shouldAutoOptimize(resources: SystemResources): boolean {
    return (
      resources.memory.memoryUsagePercentage > this.config.performanceThresholds.memory ||
      resources.storage.usagePercentage > this.config.performanceThresholds.storage ||
      resources.cpu.estimatedUsage > this.config.performanceThresholds.cpu ||
      resources.performance.fps < this.config.performanceThresholds.fps
    );
  }

  private areResourcesConstrained(resources: SystemResources): boolean {
    return (
      resources.memory.memoryUsagePercentage > 0.9 ||
      resources.storage.usagePercentage > 0.95 ||
      resources.cpu.estimatedUsage > 0.9
    );
  }

  private async handleStorageThresholdExceeded(quota: StorageQuota): Promise<void> {
    console.warn('Storage threshold exceeded, performing cleanup');
    await this.storageManager.performCleanup();
  }

  private getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }

  private async getBatteryInfo(): Promise<BatteryInfo | undefined> {
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

  private getPerformanceMetrics(): PerformanceMetrics {
    // This would integrate with actual performance measurement
    return {
      fps: 60, // Would measure actual FPS
      frameDrops: 0,
      renderTime: 0,
      scriptTime: 0,
      layoutTime: 0
    };
  }

  private async optimizePerformance(): Promise<void> {
    // Reduce animation quality
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    // Reduce visual effects
    document.documentElement.classList.add('reduced-motion');
    
    // Defer non-critical rendering
    await this.cpuOptimizer.scheduleTask(
      'defer-rendering',
      async () => {
        // Defer non-critical DOM updates
        const nonCriticalElements = document.querySelectorAll('[data-defer-render="true"]');
        nonCriticalElements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      },
      'low'
    );
  }

  private async performAggressiveOptimization(): Promise<void> {
    // Force garbage collection
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Clear all non-essential caches
    try {
      const cacheNames = await caches.keys();
      const nonEssentialCaches = cacheNames.filter(name => 
        !name.includes('critical') && !name.includes('essential')
      );
      
      for (const cacheName of nonEssentialCaches) {
        await caches.delete(cacheName);
      }
    } catch (error) {
      console.warn('Aggressive cache cleanup failed:', error);
    }

    // Reduce memory footprint
    await this.memoryOptimizer.optimizeMemoryUsage();
  }

  private async checkMemoryAvailability(requiredBytes: number): Promise<boolean> {
    const memoryStats = await this.memoryOptimizer.getMemoryStats();
    return memoryStats.estimatedAvailableMemory >= requiredBytes;
  }

  private calculateImprovements(before: SystemResources, after: SystemResources): any {
    return {
      memoryFreed: before.memory.usedJSHeapSize - after.memory.usedJSHeapSize,
      storageFreed: before.storage.usage - after.storage.usage,
      cpuReduced: before.cpu.estimatedUsage - after.cpu.estimatedUsage,
      performanceGain: after.performance.fps - before.performance.fps
    };
  }

  private async getOptimizationRecommendations(resources: SystemResources): Promise<string[]> {
    const recommendations: string[] = [];

    // Memory recommendations
    const memoryRecs = await this.memoryOptimizer.getOptimizationRecommendations();
    recommendations.push(...memoryRecs);

    // Storage recommendations
    const storageRecs = await this.storageManager.getStorageRecommendations();
    recommendations.push(...storageRecs);

    // Performance recommendations
    if (resources.performance.fps < 30) {
      recommendations.push('Consider reducing visual effects to improve frame rate');
    }

    if (resources.cpu.estimatedUsage > 80) {
      recommendations.push('High CPU usage detected, consider deferring non-critical tasks');
    }

    if (resources.network.saveData) {
      recommendations.push('Data saver mode active, optimize for reduced bandwidth usage');
    }

    return recommendations;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Destroy resource manager
   */
  destroy(): void {
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Destroy optimizers
    this.memoryOptimizer.destroy();
    this.storageManager.destroy();
    this.cpuOptimizer.destroy();

    // Clear data
    this.resourceHistory = [];
    this.optimizationHistory = [];
    this.resourceObservers = [];

    console.log('Resource manager destroyed');
  }
}