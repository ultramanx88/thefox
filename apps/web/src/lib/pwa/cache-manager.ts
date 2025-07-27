// Enhanced Cache Manager for Scalable PWA
export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
  options: {
    cacheName: string;
    maxEntries: number;
    maxAgeSeconds: number;
    purgeOnQuotaError: boolean;
    priority: 'high' | 'medium' | 'low';
  };
}

export interface CacheStats {
  hitRatio: number;
  missRatio: number;
  totalRequests: number;
  cacheSize: number;
  evictionCount: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export interface BrowsingPattern {
  url: string;
  frequency: number;
  lastAccessed: Date;
  timeOfDay: number[];
  userAgent: string;
}

export class IntelligentCacheManager {
  private static instance: IntelligentCacheManager;
  private cacheStats: Map<string, CacheStats> = new Map();
  private browsingPatterns: BrowsingPattern[] = [];
  private performanceThresholds = {
    maxResponseTime: 200,
    minHitRatio: 0.85,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxCacheSize: 500 * 1024 * 1024, // 500MB
  };

  private cacheStrategies: CacheStrategy[] = [
    // Static Assets - Cache First (High Priority)
    {
      name: 'static-assets',
      pattern: /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-v1',
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
        priority: 'high'
      }
    },
    // API Responses - Network First (Medium Priority)
    {
      name: 'api-responses',
      pattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        maxEntries: 200,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true,
        priority: 'medium'
      }
    },
    // Images - Stale While Revalidate (Medium Priority)
    {
      name: 'images',
      pattern: /\.(webp|avif|png|jpg|jpeg|gif|svg)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images-v1',
        maxEntries: 150,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
        priority: 'medium'
      }
    },
    // HTML Pages - Network First (High Priority)
    {
      name: 'pages',
      pattern: /\.html$|\/$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-v1',
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: false,
        priority: 'high'
      }
    },
    // Firebase Data - Network First (High Priority)
    {
      name: 'firebase-data',
      pattern: /firestore\.googleapis\.com|firebase\.googleapis\.com/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-data-v1',
        maxEntries: 100,
        maxAgeSeconds: 2 * 60, // 2 minutes
        purgeOnQuotaError: true,
        priority: 'high'
      }
    }
  ];

  static getInstance(): IntelligentCacheManager {
    if (!IntelligentCacheManager.instance) {
      IntelligentCacheManager.instance = new IntelligentCacheManager();
    }
    return IntelligentCacheManager.instance;
  }

  // Get optimal caching strategy for a request
  getOptimalStrategy(request: Request): CacheStrategy | null {
    const url = request.url;
    
    // Analyze browsing patterns to adjust strategy
    this.updateBrowsingPattern(url);
    
    // Find matching strategy
    for (const strategy of this.cacheStrategies) {
      if (strategy.pattern.test(url)) {
        // Adjust strategy based on performance metrics
        return this.optimizeStrategy(strategy, url);
      }
    }
    
    return null;
  }

  // Optimize strategy based on current performance
  private optimizeStrategy(strategy: CacheStrategy, url: string): CacheStrategy {
    const stats = this.cacheStats.get(strategy.name);
    
    if (stats) {
      // If hit ratio is low, switch to more aggressive caching
      if (stats.hitRatio < this.performanceThresholds.minHitRatio) {
        if (strategy.handler === 'NetworkFirst') {
          return {
            ...strategy,
            handler: 'StaleWhileRevalidate',
            options: {
              ...strategy.options,
              maxAgeSeconds: strategy.options.maxAgeSeconds * 2
            }
          };
        }
      }
      
      // If response time is high, prioritize cache
      if (stats.averageResponseTime > this.performanceThresholds.maxResponseTime) {
        return {
          ...strategy,
          options: {
            ...strategy.options,
            priority: 'high'
          }
        };
      }
    }
    
    return strategy;
  }

  // Update browsing patterns for predictive caching
  private updateBrowsingPattern(url: string): void {
    const now = new Date();
    const hour = now.getHours();
    
    const existingPattern = this.browsingPatterns.find(p => p.url === url);
    
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastAccessed = now;
      existingPattern.timeOfDay[hour]++;
    } else {
      const timeOfDay = new Array(24).fill(0);
      timeOfDay[hour] = 1;
      
      this.browsingPatterns.push({
        url,
        frequency: 1,
        lastAccessed: now,
        timeOfDay,
        userAgent: navigator.userAgent
      });
    }
    
    // Keep only recent patterns (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.browsingPatterns = this.browsingPatterns.filter(
      p => p.lastAccessed > weekAgo
    );
  }

  // Predictive caching based on browsing patterns
  async prefetchPredictedResources(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find resources likely to be accessed soon
    const predictions = this.browsingPatterns
      .filter(pattern => {
        // High frequency resources
        const isFrequent = pattern.frequency > 5;
        // Resources accessed at this time of day
        const isTimeRelevant = pattern.timeOfDay[currentHour] > 0;
        // Recently accessed resources
        const isRecent = now.getTime() - pattern.lastAccessed.getTime() < 24 * 60 * 60 * 1000;
        
        return isFrequent && (isTimeRelevant || isRecent);
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 predictions
    
    // Prefetch predicted resources
    for (const prediction of predictions) {
      try {
        const cache = await caches.open('prefetch-cache-v1');
        const response = await fetch(prediction.url);
        if (response.ok) {
          await cache.put(prediction.url, response.clone());
        }
      } catch (error) {
        console.warn('Prefetch failed for:', prediction.url, error);
      }
    }
  }

  // Intelligent cache eviction
  async evictLeastUsed(): Promise<void> {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Sort by last access time (if available in headers)
      const requestsWithTime = await Promise.all(
        requests.map(async (request) => {
          const response = await cache.match(request);
          const lastAccessed = response?.headers.get('x-last-accessed');
          return {
            request,
            lastAccessed: lastAccessed ? new Date(lastAccessed) : new Date(0)
          };
        })
      );
      
      // Remove oldest 20% of entries
      requestsWithTime
        .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime())
        .slice(0, Math.floor(requestsWithTime.length * 0.2))
        .forEach(({ request }) => cache.delete(request));
    }
  }

  // Evict expired cache entries
  async evictExpired(): Promise<void> {
    const now = Date.now();
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
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
            }
          }
        }
      }
    }
  }

  // Get cache statistics
  async getCacheUsageStats(): Promise<Map<string, CacheStats>> {
    const stats = new Map<string, CacheStats>();
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      let totalSize = 0;
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
      
      const existingStats = this.cacheStats.get(cacheName) || {
        hitRatio: 0,
        missRatio: 0,
        totalRequests: 0,
        cacheSize: 0,
        evictionCount: 0,
        averageResponseTime: 0,
        lastUpdated: new Date()
      };
      
      stats.set(cacheName, {
        ...existingStats,
        cacheSize: totalSize,
        lastUpdated: new Date()
      });
    }
    
    return stats;
  }

  // Update cache statistics
  updateCacheStats(cacheName: string, hit: boolean, responseTime: number): void {
    const stats = this.cacheStats.get(cacheName) || {
      hitRatio: 0,
      missRatio: 0,
      totalRequests: 0,
      cacheSize: 0,
      evictionCount: 0,
      averageResponseTime: 0,
      lastUpdated: new Date()
    };
    
    stats.totalRequests++;
    if (hit) {
      stats.hitRatio = (stats.hitRatio * (stats.totalRequests - 1) + 1) / stats.totalRequests;
    } else {
      stats.missRatio = (stats.missRatio * (stats.totalRequests - 1) + 1) / stats.totalRequests;
    }
    
    stats.averageResponseTime = (stats.averageResponseTime * (stats.totalRequests - 1) + responseTime) / stats.totalRequests;
    stats.lastUpdated = new Date();
    
    this.cacheStats.set(cacheName, stats);
  }

  // Memory optimization
  async optimizeMemoryUsage(): Promise<void> {
    // Check current memory usage
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMemory = memInfo.usedJSHeapSize;
      
      if (usedMemory > this.performanceThresholds.maxMemoryUsage) {
        // Aggressive cleanup
        await this.evictLeastUsed();
        await this.evictExpired();
        
        // Force garbage collection if available
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    }
  }

  // Get browsing patterns for analysis
  getBrowsingPatterns(): BrowsingPattern[] {
    return [...this.browsingPatterns];
  }

  // Clear all caches (for testing/debugging)
  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    this.cacheStats.clear();
    this.browsingPatterns = [];
  }
}