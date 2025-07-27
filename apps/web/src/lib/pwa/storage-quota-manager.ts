/**
 * Storage Quota Manager
 * Manages storage quota with automatic cleanup and intelligent allocation
 */

export interface StorageQuota {
  quota: number;
  usage: number;
  available: number;
  usagePercentage: number;
}

export interface StorageBreakdown {
  caches: number;
  indexedDB: number;
  localStorage: number;
  sessionStorage: number;
  webSQL: number;
  other: number;
}

export interface QuotaConfig {
  warningThreshold: number; // 80%
  criticalThreshold: number; // 90%
  emergencyThreshold: number; // 95%
  cleanupStrategies: {
    lru: boolean; // Least Recently Used
    size: boolean; // Largest items first
    age: boolean; // Oldest items first
    priority: boolean; // Priority-based cleanup
  };
  reservedSpace: number; // Bytes to keep free
  autoCleanup: boolean;
  persistentStorage: boolean;
}

export interface StorageItem {
  key: string;
  size: number;
  lastAccessed: number;
  created: number;
  priority: 'high' | 'medium' | 'low';
  type: 'cache' | 'indexeddb' | 'localstorage' | 'sessionstorage';
  metadata?: any;
}

export class StorageQuotaManager {
  private config: QuotaConfig;
  private storageItems: Map<string, StorageItem> = new Map();
  private cleanupCallbacks: Map<string, () => Promise<void>> = new Map();
  private quotaObservers: ((quota: StorageQuota) => void)[] = [];

  constructor(config: Partial<QuotaConfig> = {}) {
    this.config = {
      warningThreshold: 0.8,
      criticalThreshold: 0.9,
      emergencyThreshold: 0.95,
      cleanupStrategies: {
        lru: true,
        size: true,
        age: true,
        priority: true
      },
      reservedSpace: 50 * 1024 * 1024, // 50MB
      autoCleanup: true,
      persistentStorage: true,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize storage quota manager
   */
  private async initialize(): Promise<void> {
    try {
      // Request persistent storage if configured
      if (this.config.persistentStorage && 'storage' in navigator && 'persist' in navigator.storage) {
        const persistent = await navigator.storage.persist();
        console.log(`Persistent storage: ${persistent ? 'granted' : 'denied'}`);
      }

      // Start monitoring
      await this.startQuotaMonitoring();
      
      // Initial cleanup if needed
      if (this.config.autoCleanup) {
        await this.checkAndCleanup();
      }

      console.log('Storage quota manager initialized');
    } catch (error) {
      console.error('Failed to initialize storage quota manager:', error);
    }
  }

  /**
   * Get current storage quota information
   */
  async getStorageQuota(): Promise<StorageQuota> {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const usagePercentage = quota > 0 ? usage / quota : 0;

      return {
        quota,
        usage,
        available,
        usagePercentage
      };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return {
        quota: 0,
        usage: 0,
        available: 0,
        usagePercentage: 0
      };
    }
  }

  /**
   * Get detailed storage breakdown
   */
  async getStorageBreakdown(): Promise<StorageBreakdown> {
    const breakdown: StorageBreakdown = {
      caches: 0,
      indexedDB: 0,
      localStorage: 0,
      sessionStorage: 0,
      webSQL: 0,
      other: 0
    };

    try {
      // Calculate cache storage
      breakdown.caches = await this.calculateCacheStorage();
      
      // Calculate localStorage size
      breakdown.localStorage = this.calculateLocalStorageSize();
      
      // Calculate sessionStorage size
      breakdown.sessionStorage = this.calculateSessionStorageSize();
      
      // IndexedDB and WebSQL are harder to calculate precisely
      // We'll estimate based on the remaining usage
      const totalCalculated = breakdown.caches + breakdown.localStorage + breakdown.sessionStorage;
      const quota = await this.getStorageQuota();
      const remaining = quota.usage - totalCalculated;
      
      // Estimate IndexedDB takes most of the remaining space
      breakdown.indexedDB = Math.max(0, remaining * 0.8);
      breakdown.other = Math.max(0, remaining * 0.2);

    } catch (error) {
      console.error('Failed to get storage breakdown:', error);
    }

    return breakdown;
  }

  /**
   * Register cleanup callback for specific storage type
   */
  registerCleanupCallback(type: string, callback: () => Promise<void>): void {
    this.cleanupCallbacks.set(type, callback);
  }

  /**
   * Add storage item for tracking
   */
  trackStorageItem(item: StorageItem): void {
    this.storageItems.set(item.key, {
      ...item,
      lastAccessed: Date.now()
    });
  }

  /**
   * Update storage item access time
   */
  updateItemAccess(key: string): void {
    const item = this.storageItems.get(key);
    if (item) {
      item.lastAccessed = Date.now();
      this.storageItems.set(key, item);
    }
  }

  /**
   * Remove storage item from tracking
   */
  untrackStorageItem(key: string): void {
    this.storageItems.delete(key);
  }

  /**
   * Perform intelligent cleanup based on configured strategies
   */
  async performCleanup(targetBytes?: number): Promise<number> {
    console.log('Starting intelligent storage cleanup');
    
    const quota = await this.getStorageQuota();
    const targetReduction = targetBytes || (quota.usage * 0.2); // Clean 20% by default
    
    let cleanedBytes = 0;
    const strategies = this.config.cleanupStrategies;

    // Strategy 1: Priority-based cleanup
    if (strategies.priority) {
      cleanedBytes += await this.cleanupByPriority(targetReduction - cleanedBytes);
    }

    // Strategy 2: LRU cleanup
    if (strategies.lru && cleanedBytes < targetReduction) {
      cleanedBytes += await this.cleanupLRU(targetReduction - cleanedBytes);
    }

    // Strategy 3: Size-based cleanup
    if (strategies.size && cleanedBytes < targetReduction) {
      cleanedBytes += await this.cleanupBySize(targetReduction - cleanedBytes);
    }

    // Strategy 4: Age-based cleanup
    if (strategies.age && cleanedBytes < targetReduction) {
      cleanedBytes += await this.cleanupByAge(targetReduction - cleanedBytes);
    }

    // Emergency cleanup if still not enough space
    if (cleanedBytes < targetReduction) {
      cleanedBytes += await this.emergencyCleanup(targetReduction - cleanedBytes);
    }

    console.log(`Cleanup completed: ${cleanedBytes} bytes freed`);
    
    // Notify observers
    const newQuota = await this.getStorageQuota();
    this.notifyQuotaObservers(newQuota);
    
    return cleanedBytes;
  }

  /**
   * Check quota and perform cleanup if needed
   */
  async checkAndCleanup(): Promise<void> {
    const quota = await this.getStorageQuota();
    
    if (quota.usagePercentage >= this.config.emergencyThreshold) {
      console.warn('Emergency storage cleanup triggered');
      await this.performCleanup(quota.usage * 0.3); // Clean 30%
      
    } else if (quota.usagePercentage >= this.config.criticalThreshold) {
      console.warn('Critical storage cleanup triggered');
      await this.performCleanup(quota.usage * 0.2); // Clean 20%
      
    } else if (quota.usagePercentage >= this.config.warningThreshold) {
      console.log('Warning level storage cleanup triggered');
      await this.performCleanup(quota.usage * 0.1); // Clean 10%
    }
  }

  /**
   * Reserve space for critical operations
   */
  async reserveSpace(bytes: number): Promise<boolean> {
    const quota = await this.getStorageQuota();
    
    if (quota.available >= bytes + this.config.reservedSpace) {
      return true; // Enough space available
    }

    // Try to free up space
    const neededSpace = bytes + this.config.reservedSpace - quota.available;
    const freedSpace = await this.performCleanup(neededSpace);
    
    return freedSpace >= neededSpace;
  }

  /**
   * Get storage recommendations
   */
  async getStorageRecommendations(): Promise<string[]> {
    const quota = await this.getStorageQuota();
    const breakdown = await this.getStorageBreakdown();
    const recommendations: string[] = [];

    if (quota.usagePercentage > 0.9) {
      recommendations.push('Storage is critically full. Consider clearing old data.');
    }

    if (breakdown.caches > quota.quota * 0.5) {
      recommendations.push('Cache storage is using significant space. Consider reducing cache size.');
    }

    if (breakdown.localStorage > 10 * 1024 * 1024) { // 10MB
      recommendations.push('localStorage is using significant space. Consider cleaning up old data.');
    }

    if (this.storageItems.size > 1000) {
      recommendations.push('Large number of tracked items. Consider implementing more aggressive cleanup.');
    }

    const oldItems = Array.from(this.storageItems.values())
      .filter(item => Date.now() - item.lastAccessed > 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (oldItems.length > 100) {
      recommendations.push(`${oldItems.length} items haven't been accessed in over a week. Consider cleanup.`);
    }

    return recommendations;
  }

  /**
   * Add quota observer
   */
  addQuotaObserver(observer: (quota: StorageQuota) => void): void {
    this.quotaObservers.push(observer);
  }

  /**
   * Remove quota observer
   */
  removeQuotaObserver(observer: (quota: StorageQuota) => void): void {
    const index = this.quotaObservers.indexOf(observer);
    if (index > -1) {
      this.quotaObservers.splice(index, 1);
    }
  }

  // Private methods

  private async startQuotaMonitoring(): Promise<void> {
    // Monitor quota every 30 seconds
    setInterval(async () => {
      if (this.config.autoCleanup) {
        await this.checkAndCleanup();
      }
      
      const quota = await this.getStorageQuota();
      this.notifyQuotaObservers(quota);
    }, 30000);
  }

  private notifyQuotaObservers(quota: StorageQuota): void {
    this.quotaObservers.forEach(observer => {
      try {
        observer(quota);
      } catch (error) {
        console.error('Error in quota observer:', error);
      }
    });
  }

  private async calculateCacheStorage(): Promise<number> {
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
      console.error('Failed to calculate cache storage:', error);
      return 0;
    }
  }

  private calculateLocalStorageSize(): number {
    let totalSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate localStorage size:', error);
    }

    return totalSize * 2; // Rough estimate (UTF-16)
  }

  private calculateSessionStorageSize(): number {
    let totalSize = 0;
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate sessionStorage size:', error);
    }

    return totalSize * 2; // Rough estimate (UTF-16)
  }

  private async cleanupByPriority(targetBytes: number): Promise<number> {
    const lowPriorityItems = Array.from(this.storageItems.values())
      .filter(item => item.priority === 'low')
      .sort((a, b) => b.size - a.size); // Largest first

    let cleanedBytes = 0;
    
    for (const item of lowPriorityItems) {
      if (cleanedBytes >= targetBytes) break;
      
      const callback = this.cleanupCallbacks.get(item.type);
      if (callback) {
        try {
          await callback();
          cleanedBytes += item.size;
          this.storageItems.delete(item.key);
        } catch (error) {
          console.error(`Failed to cleanup item ${item.key}:`, error);
        }
      }
    }

    return cleanedBytes;
  }

  private async cleanupLRU(targetBytes: number): Promise<number> {
    const lruItems = Array.from(this.storageItems.values())
      .sort((a, b) => a.lastAccessed - b.lastAccessed); // Oldest access first

    let cleanedBytes = 0;
    
    for (const item of lruItems) {
      if (cleanedBytes >= targetBytes) break;
      if (item.priority === 'high') continue; // Skip high priority items
      
      const callback = this.cleanupCallbacks.get(item.type);
      if (callback) {
        try {
          await callback();
          cleanedBytes += item.size;
          this.storageItems.delete(item.key);
        } catch (error) {
          console.error(`Failed to cleanup LRU item ${item.key}:`, error);
        }
      }
    }

    return cleanedBytes;
  }

  private async cleanupBySize(targetBytes: number): Promise<number> {
    const largeItems = Array.from(this.storageItems.values())
      .filter(item => item.priority !== 'high')
      .sort((a, b) => b.size - a.size); // Largest first

    let cleanedBytes = 0;
    
    for (const item of largeItems) {
      if (cleanedBytes >= targetBytes) break;
      
      const callback = this.cleanupCallbacks.get(item.type);
      if (callback) {
        try {
          await callback();
          cleanedBytes += item.size;
          this.storageItems.delete(item.key);
        } catch (error) {
          console.error(`Failed to cleanup large item ${item.key}:`, error);
        }
      }
    }

    return cleanedBytes;
  }

  private async cleanupByAge(targetBytes: number): Promise<number> {
    const oldItems = Array.from(this.storageItems.values())
      .filter(item => item.priority !== 'high')
      .sort((a, b) => a.created - b.created); // Oldest first

    let cleanedBytes = 0;
    
    for (const item of oldItems) {
      if (cleanedBytes >= targetBytes) break;
      
      // Only clean items older than 7 days
      if (Date.now() - item.created < 7 * 24 * 60 * 60 * 1000) continue;
      
      const callback = this.cleanupCallbacks.get(item.type);
      if (callback) {
        try {
          await callback();
          cleanedBytes += item.size;
          this.storageItems.delete(item.key);
        } catch (error) {
          console.error(`Failed to cleanup old item ${item.key}:`, error);
        }
      }
    }

    return cleanedBytes;
  }

  private async emergencyCleanup(targetBytes: number): Promise<number> {
    console.warn('Performing emergency storage cleanup');
    
    let cleanedBytes = 0;

    // Clear all non-essential caches
    try {
      const cacheNames = await caches.keys();
      const nonEssentialCaches = cacheNames.filter(name => 
        !name.includes('essential') && !name.includes('critical')
      );

      for (const cacheName of nonEssentialCaches) {
        await caches.delete(cacheName);
        cleanedBytes += 10 * 1024 * 1024; // Estimate 10MB per cache
        
        if (cleanedBytes >= targetBytes) break;
      }
    } catch (error) {
      console.error('Emergency cache cleanup failed:', error);
    }

    // Clear temporary localStorage items
    if (cleanedBytes < targetBytes) {
      try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('temp_') || key.startsWith('cache_'))) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            cleanedBytes += (key.length + value.length) * 2;
          }
          localStorage.removeItem(key);
        });
      } catch (error) {
        console.error('Emergency localStorage cleanup failed:', error);
      }
    }

    return cleanedBytes;
  }

  /**
   * Destroy quota manager
   */
  destroy(): void {
    this.storageItems.clear();
    this.cleanupCallbacks.clear();
    this.quotaObservers = [];
    console.log('Storage quota manager destroyed');
  }
}