// Enhanced Service Worker with Intelligent Caching
import { IntelligentCacheManager } from './cache-manager';

declare const self: ServiceWorkerGlobalScope;

class EnhancedServiceWorker {
  private cacheManager: IntelligentCacheManager;
  private performanceMetrics: Map<string, number[]> = new Map();
  private isOnline = true;
  private syncQueue: any[] = [];

  constructor() {
    this.cacheManager = IntelligentCacheManager.getInstance();
    this.setupEventListeners();
    this.initializePerformanceMonitoring();
  }

  private setupEventListeners(): void {
    // Install event
    self.addEventListener('install', (event) => {
      console.log('Enhanced Service Worker installing...');
      event.waitUntil(this.handleInstall());
    });

    // Activate event
    self.addEventListener('activate', (event) => {
      console.log('Enhanced Service Worker activating...');
      event.waitUntil(this.handleActivate());
    });

    // Fetch event with intelligent caching
    self.addEventListener('fetch', (event) => {
      event.respondWith(this.handleFetch(event.request));
    });

    // Background sync
    self.addEventListener('sync', (event) => {
      if (event.tag === 'background-sync') {
        event.waitUntil(this.handleBackgroundSync());
      }
    });

    // Message handling
    self.addEventListener('message', (event) => {
      this.handleMessage(event);
    });

    // Online/offline detection
    self.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange();
    });

    self.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange();
    });
  }

  private async handleInstall(): Promise<void> {
    // Pre-cache critical resources
    const criticalResources = [
      '/',
      '/offline',
      '/manifest.json',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ];

    const cache = await caches.open('critical-v1');
    await cache.addAll(criticalResources);

    // Skip waiting to activate immediately
    self.skipWaiting();
  }

  private async handleActivate(): Promise<void> {
    // Clean up old caches
    const cacheWhitelist = [
      'critical-v1',
      'static-assets-v1',
      'api-cache-v1',
      'images-v1',
      'pages-v1',
      'firebase-data-v1',
      'prefetch-cache-v1'
    ];

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );

    // Claim all clients
    self.clients.claim();

    // Start predictive caching
    this.startPredictiveCaching();
  }

  private async handleFetch(request: Request): Promise<Response> {
    const startTime = performance.now();
    
    try {
      // Get optimal caching strategy
      const strategy = this.cacheManager.getOptimalStrategy(request);
      
      if (!strategy) {
        // No strategy found, use network only
        return await this.networkOnly(request, startTime);
      }

      // Apply the determined strategy
      let response: Response;
      switch (strategy.handler) {
        case 'CacheFirst':
          response = await this.cacheFirst(request, strategy, startTime);
          break;
        case 'NetworkFirst':
          response = await this.networkFirst(request, strategy, startTime);
          break;
        case 'StaleWhileRevalidate':
          response = await this.staleWhileRevalidate(request, strategy, startTime);
          break;
        case 'NetworkOnly':
          response = await this.networkOnly(request, startTime);
          break;
        case 'CacheOnly':
          response = await this.cacheOnly(request, strategy, startTime);
          break;
        default:
          response = await this.networkFirst(request, strategy, startTime);
      }

      // Add performance headers
      const responseTime = performance.now() - startTime;
      this.recordPerformanceMetric(request.url, responseTime);
      
      return this.addPerformanceHeaders(response, responseTime);
      
    } catch (error) {
      console.error('Fetch error:', error);
      return this.handleFetchError(request, error);
    }
  }

  private async cacheFirst(request: Request, strategy: any, startTime: number): Promise<Response> {
    const cache = await caches.open(strategy.options.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update last accessed time
      const responseWithHeaders = this.addCacheHeaders(cachedResponse, true);
      this.cacheManager.updateCacheStats(strategy.name, true, performance.now() - startTime);
      
      // Background update if stale
      this.backgroundUpdate(request, cache, strategy);
      
      return responseWithHeaders;
    }

    // Cache miss - fetch from network
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.cacheResponse(cache, request, networkResponse.clone(), strategy);
      }
      this.cacheManager.updateCacheStats(strategy.name, false, performance.now() - startTime);
      return networkResponse;
    } catch (error) {
      return this.createErrorResponse('Network error in cache-first strategy');
    }
  }

  private async networkFirst(request: Request, strategy: any, startTime: number): Promise<Response> {
    const cache = await caches.open(strategy.options.cacheName);
    
    try {
      // Try network first
      const networkResponse = await Promise.race([
        fetch(request),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 3000)
        )
      ]);
      
      if (networkResponse.ok) {
        await this.cacheResponse(cache, request, networkResponse.clone(), strategy);
        this.cacheManager.updateCacheStats(strategy.name, false, performance.now() - startTime);
        return networkResponse;
      }
    } catch (error) {
      console.warn('Network failed, trying cache:', error);
    }

    // Network failed - try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      this.cacheManager.updateCacheStats(strategy.name, true, performance.now() - startTime);
      return this.addCacheHeaders(cachedResponse, true);
    }

    return this.createErrorResponse('Both network and cache failed');
  }

  private async staleWhileRevalidate(request: Request, strategy: any, startTime: number): Promise<Response> {
    const cache = await caches.open(strategy.options.cacheName);
    const cachedResponse = await cache.match(request);
    
    // Always try to update in background
    const networkUpdate = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await this.cacheResponse(cache, request, networkResponse.clone(), strategy);
      }
    }).catch(error => {
      console.warn('Background update failed:', error);
    });

    if (cachedResponse) {
      // Return cached response immediately
      this.cacheManager.updateCacheStats(strategy.name, true, performance.now() - startTime);
      
      // Don't wait for network update
      networkUpdate;
      
      return this.addCacheHeaders(cachedResponse, true);
    }

    // No cache - wait for network
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.cacheResponse(cache, request, networkResponse.clone(), strategy);
      }
      this.cacheManager.updateCacheStats(strategy.name, false, performance.now() - startTime);
      return networkResponse;
    } catch (error) {
      return this.createErrorResponse('Network error and no cache available');
    }
  }

  private async networkOnly(request: Request, startTime: number): Promise<Response> {
    try {
      const response = await fetch(request);
      this.recordPerformanceMetric(request.url, performance.now() - startTime);
      return response;
    } catch (error) {
      return this.createErrorResponse('Network-only request failed');
    }
  }

  private async cacheOnly(request: Request, strategy: any, startTime: number): Promise<Response> {
    const cache = await caches.open(strategy.options.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      this.cacheManager.updateCacheStats(strategy.name, true, performance.now() - startTime);
      return this.addCacheHeaders(cachedResponse, true);
    }

    return this.createErrorResponse('Cache-only request failed - no cached response');
  }

  private async cacheResponse(cache: Cache, request: Request, response: Response, strategy: any): Promise<void> {
    // Add cache metadata headers
    const responseWithHeaders = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'x-cached-time': Date.now().toString(),
        'x-max-age': strategy.options.maxAgeSeconds.toString(),
        'x-cache-strategy': strategy.name
      }
    });

    await cache.put(request, responseWithHeaders);

    // Manage cache size
    await this.manageCacheSize(cache, strategy.options.maxEntries);
  }

  private async manageCacheSize(cache: Cache, maxEntries: number): Promise<void> {
    const requests = await cache.keys();
    
    if (requests.length > maxEntries) {
      // Remove oldest entries
      const entriesToRemove = requests.length - maxEntries;
      const oldestRequests = requests.slice(0, entriesToRemove);
      
      await Promise.all(
        oldestRequests.map(request => cache.delete(request))
      );
    }
  }

  private async backgroundUpdate(request: Request, cache: Cache, strategy: any): Promise<void> {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.cacheResponse(cache, request, networkResponse, strategy);
      }
    } catch (error) {
      console.warn('Background update failed:', error);
    }
  }

  private addCacheHeaders(response: Response, fromCache: boolean): Response {
    const headers = new Headers(response.headers);
    headers.set('x-served-from', fromCache ? 'cache' : 'network');
    headers.set('x-last-accessed', Date.now().toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  private addPerformanceHeaders(response: Response, responseTime: number): Response {
    const headers = new Headers(response.headers);
    headers.set('x-response-time', responseTime.toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  private createErrorResponse(message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private recordPerformanceMetric(url: string, responseTime: number): void {
    if (!this.performanceMetrics.has(url)) {
      this.performanceMetrics.set(url, []);
    }
    
    const metrics = this.performanceMetrics.get(url)!;
    metrics.push(responseTime);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  private async handleBackgroundSync(): Promise<void> {
    // Process queued sync operations
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift();
      try {
        await this.processSyncOperation(operation);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Re-queue for retry
        this.syncQueue.push(operation);
        break;
      }
    }
  }

  private async processSyncOperation(operation: any): Promise<void> {
    // Implementation depends on your sync requirements
    console.log('Processing sync operation:', operation);
  }

  private handleMessage(event: ExtendableMessageEvent): void {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_CACHE_STATS':
        this.sendCacheStats(event.source as Client);
        break;
      case 'CLEAR_CACHE':
        this.cacheManager.clearAllCaches();
        break;
      case 'PREFETCH_RESOURCES':
        this.cacheManager.prefetchPredictedResources();
        break;
    }
  }

  private async sendCacheStats(client: Client): Promise<void> {
    const stats = await this.cacheManager.getCacheUsageStats();
    client.postMessage({
      type: 'CACHE_STATS',
      payload: Object.fromEntries(stats)
    });
  }

  private handleOnlineStatusChange(): void {
    if (this.isOnline && this.syncQueue.length > 0) {
      // Trigger background sync when coming online
      self.registration.sync.register('background-sync');
    }
  }

  private async handleFetchError(request: Request, error: any): Promise<Response> {
    // Try to serve from cache as fallback
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return this.addCacheHeaders(cachedResponse, true);
      }
    }

    // Serve offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open('critical-v1');
      const offlinePage = await cache.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return this.createErrorResponse('Request failed and no fallback available');
  }

  private startPredictiveCaching(): void {
    // Run predictive caching every 5 minutes
    setInterval(() => {
      this.cacheManager.prefetchPredictedResources();
    }, 5 * 60 * 1000);

    // Run cache optimization every hour
    setInterval(() => {
      this.cacheManager.optimizeMemoryUsage();
      this.cacheManager.evictExpired();
    }, 60 * 60 * 1000);
  }

  private initializePerformanceMonitoring(): void {
    // Send performance metrics to main thread every 30 seconds
    setInterval(async () => {
      const clients = await self.clients.matchAll();
      const stats = await this.cacheManager.getCacheUsageStats();
      
      clients.forEach(client => {
        client.postMessage({
          type: 'PERFORMANCE_METRICS',
          payload: {
            cacheStats: Object.fromEntries(stats),
            performanceMetrics: Object.fromEntries(this.performanceMetrics)
          }
        });
      });
    }, 30 * 1000);
  }
}

// Initialize the enhanced service worker
new EnhancedServiceWorker();