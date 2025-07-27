/**
 * Resource Optimization System
 * Integrates memory management, resource allocation, storage quota, and CPU optimization
 */

import { MemoryManager } from './memory-manager';
import { ResourceAllocator } from './resource-allocator';
import { StorageQuotaManager } from './storage-quota-manager';
import { CPUOptimizer } from './cpu-optimizer';

export interface SystemResourceStats {
  memory: {
    current: number;
    available: number;
    pressure: 'low' | 'medium' | 'high' | 'critical';
    leaksDetected: number;
  };
  cpu: {
    currentLoad: number;
    averageLoad: number;
    tasksInQueue: number;
    longTasksDetected: number;
  };
  storage: {
    usage: number;
    quota: number;
    usagePercentage: number;
    persistent: boolean;
  };
  resources: {
    allocatedMemory: number;
    allocatedCPU: number;
    allocatedNetwork: number;
    allocatedStorage: number;
  };
}

export interface OptimizationConfig {
  memory?: {
    maxUsage: number;
    warningThreshold: number;
    criticalThreshold: number;
    autoCleanup: boolean;
  };
  cpu?: {
    maxUsage: number;
    timeSliceMs: number;
    adaptiveScheduling: boolean;
  };
  storage?: {
    warningThreshold: number;
    criticalThreshold: number;
    autoCleanup: boolean;
  };
  resources?: {
    maxMemoryUsage: number;
    maxCPUUsage: number;
    maxNetworkBandwidth: number;
    maxStorageUsage: number;
  };
}

export class ResourceOptimizationSystem {
  private memoryManager: MemoryManager;
  private resourceAllocator: ResourceAllocator;
  private storageQuotaManager: StorageQuotaManager;
  private cpuOptimizer: CPUOptimizer;
  private monitoringInterval: number | null = null;
  private optimizationHistory: SystemResourceStats[] = [];

  constructor(config: OptimizationConfig = {}) {
    // Initialize subsystems
    this.memoryManager = new MemoryManager({
      maxMemoryUsage: config.memory?.maxUsage || 100 * 1024 * 1024,
      warningThreshold: config.memory?.warningThreshold || 0.7,
      criticalThreshold: config.memory?.criticalThreshold || 0.9,
      autoCleanupEnabled: config.memory?.autoCleanup ?? true
    });

    this.resourceAllocator = new ResourceAllocator({
      memory: {
        maxUsage: config.resources?.maxMemoryUsage || 100 * 1024 * 1024,
        warningThreshold: (config.resources?.maxMemoryUsage || 100 * 1024 * 1024) * 0.8,
        criticalThreshold: (config.resources?.maxMemoryUsage || 100 * 1024 * 1024) * 0.95
      },
      cpu: {
        maxUsage: config.resources?.maxCPUUsage || 80,
        priority: 'medium',
        timeSlice: config.cpu?.timeSliceMs || 16
      },
      network: {
        maxBandwidth: config.resources?.maxNetworkBandwidth || 10 * 1024 * 1024,
        maxConcurrentRequests: 6,
        priority: 'medium'
      },
      storage: {
        maxUsage: config.resources?.maxStorageUsage || 500 * 1024 * 1024,
        warningThreshold: (config.resources?.maxStorageUsage || 500 * 1024 * 1024) * 0.8,
        autoCleanup: config.storage?.autoCleanup ?? true
      }
    });

    this.storageQuotaManager = new StorageQuotaManager();

    this.cpuOptimizer = new CPUOptimizer({
      maxCPUUsage: config.cpu?.maxUsage || 70,
      timeSliceMs: config.cpu?.timeSliceMs || 16,
      adaptiveScheduling: config.cpu?.adaptiveScheduling ?? true,
      yieldToMainThread: true
    });

    this.setupIntegration();
    this.startSystemMonitoring();
  }

  /**
   * Get comprehensive system resource statistics
   */
  async getSystemStats(): Promise<SystemResourceStats> {
    const memoryStats = this.memoryManager.getCurrentMemoryStats();
    const memoryReport = this.memoryManager.getOptimizationReport();
    const cpuStats = this.cpuOptimizer.getCPUStats();
    const storageInfo = await this.storageQuotaManager.getQuotaInfo();
    const resourceStats = this.resourceAllocator.getResourceStats();

    const stats: SystemResourceStats = {
      memory: {
        current: memoryStats?.usedJSHeapSize || 0,
        available: memoryStats ? memoryStats.jsHeapSizeLimit - memoryStats.usedJSHeapSize : 0,
        pressure: this.calculateMemoryPressure(memoryStats),
        leaksDetected: memoryReport.detectedLeaks.length
      },
      cpu: {
        currentLoad: cpuStats.currentLoad,
        averageLoad: cpuStats.averageLoad,
        tasksInQueue: cpuStats.tasksInQueue,
        longTasksDetected: cpuStats.longTasksDetected
      },
      storage: {
        usage: storageInfo.usage,
        quota: storageInfo.quota,
        usagePercentage: storageInfo.usagePercentage,
        persistent: storageInfo.persistent
      },
      resources: {
        allocatedMemory: resourceStats.currentUsage?.memory.allocated || 0,
        allocatedCPU: resourceStats.currentUsage?.cpu.allocated || 0,
        allocatedNetwork: resourceStats.currentUsage?.network.allocated || 0,
        allocatedStorage: resourceStats.currentUsage?.storage.allocated || 0
      }
    };

    // Add to history
    this.optimizationHistory.push(stats);
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }

    return stats;
  }

  /**
   * Perform comprehensive system optimization
   */
  async optimizeSystem(): Promise<{
    memoryOptimized: boolean;
    cpuOptimized: boolean;
    storageOptimized: boolean;
    resourcesOptimized: boolean;
    recommendations: string[];
  }> {
    console.log('Starting comprehensive system optimization...');
    
    const results = {
      memoryOptimized: false,
      cpuOptimized: false,
      storageOptimized: false,
      resourcesOptimized: false,
      recommendations: [] as string[]
    };

    try {
      // Memory optimization
      const memoryStats = this.memoryManager.getCurrentMemoryStats();
      if (memoryStats && memoryStats.memoryUsagePercentage > 0.7) {
        await this.memoryManager.performAggressiveCleanup();
        results.memoryOptimized = true;
        console.log('Memory optimization completed');
      }

      // CPU optimization
      const cpuStats = this.cpuOptimizer.getCPUStats();
      if (cpuStats.currentLoad > 70) {
        this.cpuOptimizer.optimizeCPUUsage();
        results.cpuOptimized = true;
        console.log('CPU optimization completed');
      }

      // Storage optimization
      const storageInfo = await this.storageQuotaManager.getQuotaInfo();
      if (storageInfo.usagePercentage > 0.8) {
        await this.storageQuotaManager.performCleanup('aggressive');
        results.storageOptimized = true;
        console.log('Storage optimization completed');
      }

      // Resource allocation optimization
      await this.resourceAllocator.optimizeAllocation();
      results.resourcesOptimized = true;
      console.log('Resource allocation optimization completed');

      // Generate recommendations
      results.recommendations = await this.generateSystemRecommendations();

    } catch (error) {
      console.error('System optimization failed:', error);
    }

    return results;
  }

  /**
   * Schedule a resource-intensive task with optimal resource allocation
   */
  async scheduleOptimizedTask<T>(
    taskName: string,
    task: () => Promise<T>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      estimatedDuration?: number;
      memoryRequired?: number;
      cpuIntensive?: boolean;
      networkRequired?: boolean;
    } = {}
  ): Promise<T> {
    const {
      priority = 'medium',
      estimatedDuration = 1000,
      memoryRequired = 1024 * 1024, // 1MB
      cpuIntensive = false,
      networkRequired = false
    } = options;

    // Request necessary resources
    const resourceRequests = [];

    if (memoryRequired > 0) {
      resourceRequests.push(
        this.resourceAllocator.requestResource({
          id: `${taskName}_memory`,
          type: 'memory',
          amount: memoryRequired,
          priority,
          duration: estimatedDuration
        })
      );
    }

    if (cpuIntensive) {
      resourceRequests.push(
        this.resourceAllocator.requestResource({
          id: `${taskName}_cpu`,
          type: 'cpu',
          amount: 20, // 20% CPU
          priority,
          duration: estimatedDuration
        })
      );
    }

    if (networkRequired) {
      resourceRequests.push(
        this.resourceAllocator.requestResource({
          id: `${taskName}_network`,
          type: 'network',
          amount: 1024 * 1024, // 1MB/s
          priority,
          duration: estimatedDuration
        })
      );
    }

    // Wait for resource allocation
    const allocations = await Promise.all(resourceRequests);
    const allAllocated = allocations.every(allocated => allocated);

    if (!allAllocated) {
      throw new Error(`Failed to allocate resources for task: ${taskName}`);
    }

    try {
      // Execute task based on type
      if (cpuIntensive) {
        // Use CPU optimizer for CPU-intensive tasks
        const taskId = await this.cpuOptimizer.scheduleTask({
          name: taskName,
          priority,
          estimatedDuration,
          task
        });

        // Wait for task completion (simplified - in practice you'd use callbacks)
        return await task();
      } else {
        // Execute directly for non-CPU-intensive tasks
        return await task();
      }
    } finally {
      // Release allocated resources
      if (memoryRequired > 0) {
        this.resourceAllocator.releaseResource(`${taskName}_memory`);
      }
      if (cpuIntensive) {
        this.resourceAllocator.releaseResource(`${taskName}_cpu`);
      }
      if (networkRequired) {
        this.resourceAllocator.releaseResource(`${taskName}_network`);
      }
    }
  }

  /**
   * Monitor system health and trigger optimizations
   */
  private startSystemMonitoring(): void {
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const stats = await this.getSystemStats();
        
        // Check for critical conditions
        if (this.shouldTriggerEmergencyOptimization(stats)) {
          console.warn('Emergency optimization triggered');
          await this.optimizeSystem();
        } else if (this.shouldTriggerPreventiveOptimization(stats)) {
          console.log('Preventive optimization triggered');
          await this.performPreventiveOptimization();
        }

        // Dispatch system status event
        this.dispatchSystemStatusEvent(stats);

      } catch (error) {
        console.error('System monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup integration between subsystems
   */
  private setupIntegration(): void {
    // Memory pressure events
    window.addEventListener('memory-pressure', (event: any) => {
      const { level, stats } = event.detail;
      
      if (level === 'critical') {
        // Trigger aggressive resource cleanup
        this.resourceAllocator.optimizeAllocation();
        this.storageQuotaManager.performCleanup('emergency');
      }
    });

    // Storage quota events
    window.addEventListener('storage-quota-update', (event: any) => {
      const quotaInfo = event.detail;
      
      if (quotaInfo.usagePercentage > 0.9) {
        // Trigger memory cleanup to free up storage
        this.memoryManager.performAggressiveCleanup();
      }
    });

    // Register memory cleanup tasks with storage manager
    this.storageQuotaManager.addCleanupRule({
      name: 'memory-cache-cleanup',
      priority: 3,
      maxAge: 30 * 60 * 1000, // 30 minutes
      maxSize: 20 * 1024 * 1024, // 20MB
      customCleanup: async () => {
        await this.memoryManager.performModerateCleanup();
        return 5 * 1024 * 1024; // Estimate 5MB cleaned
      }
    });

    // Register CPU task cleanup with memory manager
    this.memoryManager.registerCleanupTask('cpu-task-cleanup', async () => {
      // Cancel low-priority CPU tasks if memory is low
      const cpuStats = this.cpuOptimizer.getCPUStats();
      if (cpuStats.tasksInQueue > 20) {
        console.log('Cleaning up CPU task queue due to memory pressure');
        // Implementation would cancel low-priority tasks
      }
    });
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(memoryStats: any): 'low' | 'medium' | 'high' | 'critical' {
    if (!memoryStats) return 'low';
    
    const usage = memoryStats.memoryUsagePercentage;
    
    if (usage > 0.95) return 'critical';
    if (usage > 0.8) return 'high';
    if (usage > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Check if emergency optimization should be triggered
   */
  private shouldTriggerEmergencyOptimization(stats: SystemResourceStats): boolean {
    return (
      stats.memory.pressure === 'critical' ||
      stats.cpu.currentLoad > 95 ||
      stats.storage.usagePercentage > 0.98 ||
      stats.memory.leaksDetected > 10
    );
  }

  /**
   * Check if preventive optimization should be triggered
   */
  private shouldTriggerPreventiveOptimization(stats: SystemResourceStats): boolean {
    return (
      stats.memory.pressure === 'high' ||
      stats.cpu.currentLoad > 80 ||
      stats.storage.usagePercentage > 0.85 ||
      stats.cpu.longTasksDetected > 5
    );
  }

  /**
   * Perform preventive optimization
   */
  private async performPreventiveOptimization(): Promise<void> {
    // Lighter optimization for preventive measures
    const memoryStats = this.memoryManager.getCurrentMemoryStats();
    if (memoryStats && memoryStats.memoryUsagePercentage > 0.7) {
      await this.memoryManager.performModerateCleanup();
    }

    const storageInfo = await this.storageQuotaManager.getQuotaInfo();
    if (storageInfo.usagePercentage > 0.8) {
      await this.storageQuotaManager.performCleanup('normal');
    }

    this.cpuOptimizer.optimizeCPUUsage();
  }

  /**
   * Generate system-wide optimization recommendations
   */
  private async generateSystemRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Get recommendations from each subsystem
    const memoryReport = this.memoryManager.getOptimizationReport();
    const cpuRecommendations = this.cpuOptimizer.getOptimizationRecommendations();
    const storageRecommendations = await this.storageQuotaManager.getOptimizationRecommendations();

    recommendations.push(...memoryReport.recommendations);
    recommendations.push(...cpuRecommendations);
    recommendations.push(...storageRecommendations);

    // Add system-level recommendations
    const stats = await this.getSystemStats();
    
    if (stats.memory.pressure === 'high' && stats.storage.usagePercentage > 0.8) {
      recommendations.push('Both memory and storage are under pressure - consider reducing cache sizes');
    }

    if (stats.cpu.currentLoad > 70 && stats.memory.pressure === 'high') {
      recommendations.push('High CPU and memory usage detected - review resource-intensive operations');
    }

    if (!stats.storage.persistent) {
      recommendations.push('Storage is not persistent - request persistent storage for better reliability');
    }

    // Remove duplicates
    return Array.from(new Set(recommendations));
  }

  /**
   * Dispatch system status event
   */
  private dispatchSystemStatusEvent(stats: SystemResourceStats): void {
    const event = new CustomEvent('system-resource-update', {
      detail: stats
    });
    window.dispatchEvent(event);
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): SystemResourceStats[] {
    return this.optimizationHistory.slice(-50); // Last 50 entries
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('Manual garbage collection triggered');
        return true;
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error);
      }
    }
    return false;
  }

  /**
   * Get system health score (0-100)
   */
  async getSystemHealthScore(): Promise<number> {
    const stats = await this.getSystemStats();
    
    let score = 100;
    
    // Memory health (25% weight)
    const memoryScore = Math.max(0, 100 - (stats.memory.current / (100 * 1024 * 1024)) * 100);
    score -= (100 - memoryScore) * 0.25;
    
    // CPU health (25% weight)
    const cpuScore = Math.max(0, 100 - stats.cpu.currentLoad);
    score -= (100 - cpuScore) * 0.25;
    
    // Storage health (25% weight)
    const storageScore = Math.max(0, 100 - (stats.storage.usagePercentage * 100));
    score -= (100 - storageScore) * 0.25;
    
    // System stability (25% weight)
    const stabilityScore = Math.max(0, 100 - (stats.memory.leaksDetected * 10) - (stats.cpu.longTasksDetected * 5));
    score -= (100 - stabilityScore) * 0.25;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Cleanup and destroy the system
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.memoryManager.destroy();
    this.resourceAllocator.destroy();
    this.storageQuotaManager.destroy();
    this.cpuOptimizer.destroy();

    this.optimizationHistory = [];

    console.log('Resource optimization system destroyed');
  }
}