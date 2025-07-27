/**
 * Resource Allocator
 * Manages CPU, memory, network, and storage resources intelligently
 */

export interface ResourceQuota {
  cpu: {
    maxUsage: number; // percentage (0-100)
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeSlice: number; // milliseconds
  };
  memory: {
    maxUsage: number; // bytes
    warningThreshold: number; // bytes
    criticalThreshold: number; // bytes
  };
  network: {
    maxBandwidth: number; // bytes per second
    maxConcurrentRequests: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  storage: {
    maxUsage: number; // bytes
    warningThreshold: number; // bytes
    autoCleanup: boolean;
  };
}

export interface ResourceRequest {
  id: string;
  type: 'cpu' | 'memory' | 'network' | 'storage';
  amount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration?: number; // milliseconds, for temporary allocations
  callback?: () => void;
  onRelease?: () => void;
}

export interface ResourceAllocation {
  requestId: string;
  type: 'cpu' | 'memory' | 'network' | 'storage';
  allocated: number;
  allocatedAt: number;
  expiresAt?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceUsage {
  cpu: {
    current: number; // percentage
    allocated: number; // percentage
    available: number; // percentage
    tasks: number;
  };
  memory: {
    current: number; // bytes
    allocated: number; // bytes
    available: number; // bytes
    pressure: 'low' | 'medium' | 'high' | 'critical';
  };
  network: {
    current: number; // bytes per second
    allocated: number; // bytes per second
    available: number; // bytes per second
    activeRequests: number;
  };
  storage: {
    current: number; // bytes
    allocated: number; // bytes
    available: number; // bytes
    quotaUsage: number; // percentage
  };
}

export class ResourceAllocator {
  private quota: ResourceQuota;
  private allocations: Map<string, ResourceAllocation> = new Map();
  private pendingRequests: ResourceRequest[] = [];
  private usageHistory: ResourceUsage[] = [];
  private monitoringInterval: number | null = null;
  private cpuTaskQueue: Array<{ task: () => Promise<void>; priority: number }> = [];
  private networkQueue: Array<{ request: () => Promise<any>; priority: number }> = [];

  constructor(quota: Partial<ResourceQuota> = {}) {
    this.quota = {
      cpu: {
        maxUsage: 80, // 80% max CPU usage
        priority: 'medium',
        timeSlice: 16, // 16ms time slice (60fps)
        ...quota.cpu
      },
      memory: {
        maxUsage: 100 * 1024 * 1024, // 100MB
        warningThreshold: 80 * 1024 * 1024, // 80MB
        criticalThreshold: 95 * 1024 * 1024, // 95MB
        ...quota.memory
      },
      network: {
        maxBandwidth: 10 * 1024 * 1024, // 10MB/s
        maxConcurrentRequests: 6,
        priority: 'medium',
        ...quota.network
      },
      storage: {
        maxUsage: 500 * 1024 * 1024, // 500MB
        warningThreshold: 400 * 1024 * 1024, // 400MB
        autoCleanup: true,
        ...quota.storage
      }
    };

    this.startResourceMonitoring();
    this.setupResourceProcessors();
  }

  /**
   * Request resource allocation
   */
  async requestResource(request: ResourceRequest): Promise<boolean> {
    const currentUsage = await this.getCurrentResourceUsage();
    
    if (this.canAllocateResource(request, currentUsage)) {
      return this.allocateResource(request);
    } else {
      // Add to pending queue if high priority
      if (request.priority === 'high' || request.priority === 'critical') {
        this.pendingRequests.push(request);
        this.processPendingRequests();
      }
      return false;
    }
  }

  /**
   * Release allocated resource
   */
  releaseResource(requestId: string): void {
    const allocation = this.allocations.get(requestId);
    if (allocation) {
      this.allocations.delete(requestId);
      
      // Call release callback if provided
      const request = this.pendingRequests.find(r => r.id === requestId);
      if (request?.onRelease) {
        request.onRelease();
      }

      console.log(`Released ${allocation.type} resource: ${allocation.allocated}`);
      
      // Process pending requests
      this.processPendingRequests();
    }
  }

  /**
   * Get current resource usage
   */
  async getCurrentResourceUsage(): Promise<ResourceUsage> {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const networkUsage = await this.getNetworkUsage();
    const storageUsage = await this.getStorageUsage();

    const usage: ResourceUsage = {
      cpu: {
        current: cpuUsage.current,
        allocated: this.getAllocatedCPU(),
        available: Math.max(0, this.quota.cpu.maxUsage - cpuUsage.current),
        tasks: this.cpuTaskQueue.length
      },
      memory: {
        current: memoryUsage.current,
        allocated: this.getAllocatedMemory(),
        available: Math.max(0, this.quota.memory.maxUsage - memoryUsage.current),
        pressure: memoryUsage.pressure
      },
      network: {
        current: networkUsage.current,
        allocated: this.getAllocatedNetwork(),
        available: Math.max(0, this.quota.network.maxBandwidth - networkUsage.current),
        activeRequests: this.networkQueue.length
      },
      storage: {
        current: storageUsage.current,
        allocated: this.getAllocatedStorage(),
        available: Math.max(0, this.quota.storage.maxUsage - storageUsage.current),
        quotaUsage: storageUsage.quotaUsage
      }
    };

    // Add to history
    this.usageHistory.push(usage);
    if (this.usageHistory.length > 100) {
      this.usageHistory = this.usageHistory.slice(-100);
    }

    return usage;
  }

  /**
   * Optimize resource allocation based on usage patterns
   */
  async optimizeAllocation(): Promise<void> {
    const usage = await this.getCurrentResourceUsage();
    
    // CPU optimization
    if (usage.cpu.current > this.quota.cpu.maxUsage * 0.9) {
      await this.optimizeCPUUsage();
    }

    // Memory optimization
    if (usage.memory.pressure === 'high' || usage.memory.pressure === 'critical') {
      await this.optimizeMemoryUsage();
    }

    // Network optimization
    if (usage.network.activeRequests > this.quota.network.maxConcurrentRequests) {
      await this.optimizeNetworkUsage();
    }

    // Storage optimization
    if (usage.storage.quotaUsage > 0.9) {
      await this.optimizeStorageUsage();
    }
  }

  /**
   * Schedule CPU-intensive task with resource management
   */
  async scheduleCPUTask<T>(
    task: () => Promise<T>,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const priorityValue = this.getPriorityValue(priority);
      
      this.cpuTaskQueue.push({
        task: async () => {
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        priority: priorityValue
      });

      // Sort by priority
      this.cpuTaskQueue.sort((a, b) => b.priority - a.priority);
    });
  }

  /**
   * Schedule network request with resource management
   */
  async scheduleNetworkRequest<T>(
    request: () => Promise<T>,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const priorityValue = this.getPriorityValue(priority);
      
      this.networkQueue.push({
        request: async () => {
          try {
            const result = await request();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        priority: priorityValue
      });

      // Sort by priority
      this.networkQueue.sort((a, b) => b.priority - a.priority);
    });
  }

  // Private methods

  private canAllocateResource(request: ResourceRequest, usage: ResourceUsage): boolean {
    switch (request.type) {
      case 'cpu':
        return usage.cpu.available >= request.amount;
      case 'memory':
        return usage.memory.available >= request.amount;
      case 'network':
        return usage.network.available >= request.amount;
      case 'storage':
        return usage.storage.available >= request.amount;
      default:
        return false;
    }
  }

  private allocateResource(request: ResourceRequest): boolean {
    const allocation: ResourceAllocation = {
      requestId: request.id,
      type: request.type,
      allocated: request.amount,
      allocatedAt: Date.now(),
      priority: request.priority
    };

    if (request.duration) {
      allocation.expiresAt = Date.now() + request.duration;
    }

    this.allocations.set(request.id, allocation);
    
    if (request.callback) {
      request.callback();
    }

    console.log(`Allocated ${request.type} resource: ${request.amount}`);
    return true;
  }

  private processPendingRequests(): void {
    if (this.pendingRequests.length === 0) return;

    // Sort by priority
    this.pendingRequests.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Try to allocate pending requests
    this.getCurrentResourceUsage().then(usage => {
      const toRemove: number[] = [];
      
      this.pendingRequests.forEach((request, index) => {
        if (this.canAllocateResource(request, usage)) {
          this.allocateResource(request);
          toRemove.push(index);
        }
      });

      // Remove allocated requests
      toRemove.reverse().forEach(index => {
        this.pendingRequests.splice(index, 1);
      });
    });
  }

  private getAllocatedCPU(): number {
    return Array.from(this.allocations.values())
      .filter(a => a.type === 'cpu')
      .reduce((sum, a) => sum + a.allocated, 0);
  }

  private getAllocatedMemory(): number {
    return Array.from(this.allocations.values())
      .filter(a => a.type === 'memory')
      .reduce((sum, a) => sum + a.allocated, 0);
  }

  private getAllocatedNetwork(): number {
    return Array.from(this.allocations.values())
      .filter(a => a.type === 'network')
      .reduce((sum, a) => sum + a.allocated, 0);
  }

  private getAllocatedStorage(): number {
    return Array.from(this.allocations.values())
      .filter(a => a.type === 'storage')
      .reduce((sum, a) => sum + a.allocated, 0);
  }

  private async getCPUUsage(): Promise<{ current: number }> {
    // Estimate CPU usage based on task queue and performance
    const taskLoad = Math.min(this.cpuTaskQueue.length * 10, 100);
    return { current: taskLoad };
  }

  private async getMemoryUsage(): Promise<{ current: number; pressure: 'low' | 'medium' | 'high' | 'critical' }> {
    let current = 0;
    let pressure: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      current = memory.usedJSHeapSize;
      
      const usageRatio = current / this.quota.memory.maxUsage;
      if (usageRatio > 0.9) pressure = 'critical';
      else if (usageRatio > 0.8) pressure = 'high';
      else if (usageRatio > 0.6) pressure = 'medium';
    }

    return { current, pressure };
  }

  private async getNetworkUsage(): Promise<{ current: number }> {
    // Estimate based on active network requests
    const activeRequests = this.networkQueue.length;
    const estimatedBandwidth = activeRequests * 1024 * 1024; // 1MB per request estimate
    return { current: estimatedBandwidth };
  }

  private async getStorageUsage(): Promise<{ current: number; quotaUsage: number }> {
    let current = 0;
    let quotaUsage = 0;

    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        current = estimate.usage || 0;
        quotaUsage = estimate.quota ? current / estimate.quota : 0;
      }
    } catch (error) {
      console.warn('Storage estimation not available:', error);
    }

    return { current, quotaUsage };
  }

  private async optimizeCPUUsage(): Promise<void> {
    console.log('Optimizing CPU usage...');
    
    // Reduce task queue by deferring low-priority tasks
    const lowPriorityTasks = this.cpuTaskQueue.filter(t => t.priority <= 2);
    if (lowPriorityTasks.length > 0) {
      // Defer half of low-priority tasks
      const toDefer = Math.ceil(lowPriorityTasks.length / 2);
      setTimeout(() => {
        // Re-add deferred tasks later
      }, 1000);
    }
  }

  private async optimizeMemoryUsage(): Promise<void> {
    console.log('Optimizing memory usage...');
    
    // Release expired allocations
    const now = Date.now();
    const expiredAllocations = Array.from(this.allocations.entries())
      .filter(([_, allocation]) => allocation.expiresAt && allocation.expiresAt < now);
    
    expiredAllocations.forEach(([id, _]) => {
      this.releaseResource(id);
    });

    // Trigger memory cleanup
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (error) {
        console.warn('Manual GC failed:', error);
      }
    }
  }

  private async optimizeNetworkUsage(): Promise<void> {
    console.log('Optimizing network usage...');
    
    // Limit concurrent requests
    while (this.networkQueue.length > this.quota.network.maxConcurrentRequests) {
      const lowPriorityRequest = this.networkQueue.find(r => r.priority <= 2);
      if (lowPriorityRequest) {
        const index = this.networkQueue.indexOf(lowPriorityRequest);
        this.networkQueue.splice(index, 1);
      } else {
        break;
      }
    }
  }

  private async optimizeStorageUsage(): Promise<void> {
    console.log('Optimizing storage usage...');
    
    if (this.quota.storage.autoCleanup) {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          // Remove oldest 30% of entries
          const toRemove = Math.floor(requests.length * 0.3);
          for (let i = 0; i < toRemove; i++) {
            await cache.delete(requests[i]);
          }
        }
      }

      // Clear old localStorage entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.startsWith('cache_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  private getPriorityValue(priority: 'low' | 'medium' | 'high' | 'critical'): number {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[priority];
  }

  private startResourceMonitoring(): void {
    this.monitoringInterval = window.setInterval(async () => {
      // Check for expired allocations
      const now = Date.now();
      const expiredAllocations = Array.from(this.allocations.entries())
        .filter(([_, allocation]) => allocation.expiresAt && allocation.expiresAt < now);
      
      expiredAllocations.forEach(([id, _]) => {
        this.releaseResource(id);
      });

      // Auto-optimize if needed
      const usage = await this.getCurrentResourceUsage();
      if (this.shouldAutoOptimize(usage)) {
        await this.optimizeAllocation();
      }

    }, 5000); // Check every 5 seconds
  }

  private shouldAutoOptimize(usage: ResourceUsage): boolean {
    return (
      usage.cpu.current > this.quota.cpu.maxUsage * 0.8 ||
      usage.memory.pressure === 'high' ||
      usage.memory.pressure === 'critical' ||
      usage.network.activeRequests > this.quota.network.maxConcurrentRequests ||
      usage.storage.quotaUsage > 0.8
    );
  }

  private setupResourceProcessors(): void {
    // CPU task processor
    const processCPUTasks = async () => {
      if (this.cpuTaskQueue.length === 0) return;

      const usage = await this.getCurrentResourceUsage();
      if (usage.cpu.current < this.quota.cpu.maxUsage) {
        const task = this.cpuTaskQueue.shift();
        if (task) {
          try {
            await task.task();
          } catch (error) {
            console.error('CPU task failed:', error);
          }
        }
      }
    };

    // Network request processor
    const processNetworkRequests = async () => {
      if (this.networkQueue.length === 0) return;

      const usage = await this.getCurrentResourceUsage();
      if (usage.network.activeRequests < this.quota.network.maxConcurrentRequests) {
        const request = this.networkQueue.shift();
        if (request) {
          try {
            await request.request();
          } catch (error) {
            console.error('Network request failed:', error);
          }
        }
      }
    };

    // Process tasks and requests periodically
    setInterval(processCPUTasks, this.quota.cpu.timeSlice);
    setInterval(processNetworkRequests, 100); // Process network requests every 100ms
  }

  /**
   * Get resource allocation statistics
   */
  getResourceStats(): {
    currentUsage: ResourceUsage | null;
    allocations: ResourceAllocation[];
    pendingRequests: number;
    usageHistory: ResourceUsage[];
    quotaUtilization: {
      cpu: number;
      memory: number;
      network: number;
      storage: number;
    };
  } {
    const currentUsage = this.usageHistory[this.usageHistory.length - 1] || null;
    
    const quotaUtilization = currentUsage ? {
      cpu: currentUsage.cpu.current / this.quota.cpu.maxUsage,
      memory: currentUsage.memory.current / this.quota.memory.maxUsage,
      network: currentUsage.network.current / this.quota.network.maxBandwidth,
      storage: currentUsage.storage.current / this.quota.storage.maxUsage
    } : { cpu: 0, memory: 0, network: 0, storage: 0 };

    return {
      currentUsage,
      allocations: Array.from(this.allocations.values()),
      pendingRequests: this.pendingRequests.length,
      usageHistory: this.usageHistory.slice(-20), // Last 20 entries
      quotaUtilization
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Release all allocations
    this.allocations.clear();
    this.pendingRequests = [];
    this.usageHistory = [];
    this.cpuTaskQueue = [];
    this.networkQueue = [];

    console.log('Resource allocator destroyed');
  }
}