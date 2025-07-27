// PWA Cache Utilities for Client-side Cache Management

export interface CacheInfo {
  name: string;
  size: number;
  entries: number;
  lastModified: Date;
}

export class PWACacheUtils {
  // Get all cache information
  static async getAllCacheInfo(): Promise<CacheInfo[]> {
    if (!('caches' in window)) {
      return [];
    }

    const cacheNames = await caches.keys();
    const cacheInfos: CacheInfo[] = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      
      let totalSize = 0;
      let lastModified = new Date(0);

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
          
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const responseDate = new Date(dateHeader);
            if (responseDate > lastModified) {
              lastModified = responseDate;
            }
          }
        }
      }

      cacheInfos.push({
        name,
        size: totalSize,
        entries: requests.length,
        lastModified
      });
    }

    return cacheInfos;
  }

  // Clear specific cache
  static async clearCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const deleted = await caches.delete(cacheName);
      return deleted;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Clear all caches
  static async clearAllCaches(): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    const cacheNames = await caches.keys();
    let clearedCount = 0;

    for (const name of cacheNames) {
      try {
        const deleted = await caches.delete(name);
        if (deleted) clearedCount++;
      } catch (error) {
        console.error(`Error clearing cache ${name}:`, error);
      }
    }

    return clearedCount;
  }

  // Get total cache size
  static async getTotalCacheSize(): Promise<number> {
    const cacheInfos = await this.getAllCacheInfo();
    return cacheInfos.reduce((total, cache) => total + cache.size, 0);
  }

  // Check if resource is cached
  static async isResourceCached(url: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    const cacheNames = await caches.keys();
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const response = await cache.match(url);
      if (response) {
        return true;
      }
    }

    return false;
  }

  // Manually cache a resource
  static async cacheResource(url: string, cacheName: string = 'manual-cache'): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      const response = await fetch(url);
      
      if (response.ok) {
        await cache.put(url, response);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error caching resource:', error);
      return false;
    }
  }

  // Remove specific resource from cache
  static async removeFromCache(url: string, cacheName?: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        return await cache.delete(url);
      } else {
        // Search all caches
        const cacheNames = await caches.keys();
        let removed = false;
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const deleted = await cache.delete(url);
          if (deleted) removed = true;
        }
        
        return removed;
      }
    } catch (error) {
      console.error('Error removing from cache:', error);
      return false;
    }
  }

  // Get cache hit ratio (requires service worker support)
  static async getCacheHitRatio(): Promise<number> {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          const { cacheStats } = event.data.payload || {};
          if (cacheStats) {
            const totalRequests = Object.values(cacheStats).reduce(
              (sum: number, stats: any) => sum + stats.totalRequests, 0
            );
            const totalHits = Object.values(cacheStats).reduce(
              (sum: number, stats: any) => sum + (stats.hitRatio * stats.totalRequests), 0
            );
            
            resolve(totalRequests > 0 ? totalHits / totalRequests : 0);
          } else {
            resolve(0);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATS' },
          [messageChannel.port2]
        );
      } else {
        resolve(0);
      }
    });
  }

  // Preload critical resources
  static async preloadCriticalResources(urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    const cache = await caches.open('critical-preload');
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Check storage quota
  static async getStorageQuota(): Promise<{
    quota: number;
    usage: number;
    available: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { quota, usage, available, percentage };
    }

    return { quota: 0, usage: 0, available: 0, percentage: 0 };
  }

  // Clean up expired cache entries
  static async cleanupExpiredEntries(): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    const cacheNames = await caches.keys();
    let cleanedCount = 0;
    const now = Date.now();

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const cachedTime = response.headers.get('x-cached-time');
          const maxAge = response.headers.get('x-max-age');
          
          if (cachedTime && maxAge) {
            const age = now - parseInt(cachedTime);
            if (age > parseInt(maxAge) * 1000) {
              await cache.delete(request);
              cleanedCount++;
            }
          }
        }
      }
    }

    return cleanedCount;
  }

  // Export cache data for debugging
  static async exportCacheData(): Promise<any> {
    const cacheInfos = await this.getAllCacheInfo();
    const storageQuota = await this.getStorageQuota();
    const hitRatio = await this.getCacheHitRatio();

    return {
      timestamp: new Date().toISOString(),
      caches: cacheInfos,
      storage: storageQuota,
      performance: {
        hitRatio,
        totalSize: cacheInfos.reduce((sum, cache) => sum + cache.size, 0),
        totalEntries: cacheInfos.reduce((sum, cache) => sum + cache.entries, 0)
      }
    };
  }

  // Format bytes for display
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if PWA is installed
  static isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Check if service worker is active
  static isServiceWorkerActive(): boolean {
    return 'serviceWorker' in navigator && 
           navigator.serviceWorker.controller !== null;
  }

  // Update service worker
  static async updateServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.error('Error updating service worker:', error);
      return false;
    }
  }

  // Skip waiting for service worker update
  static skipWaiting(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}