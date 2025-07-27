// Resource Loading Manager for PWA Performance Optimization
export interface ResourceLoadingConfig {
  enablePreloading: boolean;
  enablePrefetching: boolean;
  enablePriorityHints: boolean;
  enableResourceHints: boolean;
  criticalResourceTimeout: number;
  maxConcurrentLoads: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ResourcePriority {
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'script' | 'style' | 'image' | 'font' | 'fetch';
  preload?: boolean;
  prefetch?: boolean;
  crossorigin?: string;
}

export interface LoadingMetrics {
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  fromCache: boolean;
  priority: string;
  success: boolean;
  error?: string;
}

export interface LoadingQueue {
  critical: ResourcePriority[];
  high: ResourcePriority[];
  medium: ResourcePriority[];
  low: ResourcePriority[];
}

export class ResourceLoadingManager {
  private static instance: ResourceLoadingManager;
  private config: ResourceLoadingConfig;
  private loadingQueue: LoadingQueue;
  private activeLoads: Set<string> = new Set();
  private loadingMetrics: Map<string, LoadingMetrics> = new Map();
  private resourceCache: Map<string, Response> = new Map();
  private criticalResources: Set<string> = new Set();
  private networkObserver?: PerformanceObserver;

  private constructor() {
    this.config = {
      enablePreloading: true,
      enablePrefetching: true,
      enablePriorityHints: true,
      enableResourceHints: true,
      criticalResourceTimeout: 3000,
      maxConcurrentLoads: 6,
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.loadingQueue = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    this.initializeManager();
  }

  static getInstance(): ResourceLoadingManager {
    if (!ResourceLoadingManager.instance) {
      ResourceLoadingManager.instance = new ResourceLoadingManager();
    }
    return ResourceLoadingManager.instance;
  }

  private initializeManager(): void {
    if (typeof window === 'undefined') return;

    this.setupNetworkObserver();
    this.setupResourceHints();
    this.startLoadingProcessor();
    this.detectCriticalResources();
  }

  private setupNetworkObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    this.networkObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      entries.forEach(entry => this.recordResourceMetrics(entry));
    });

    this.networkObserver.observe({ entryTypes: ['resource'] });
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const metrics: LoadingMetrics = {
      url: entry.name,
      startTime: entry.startTime,
      endTime: entry.responseEnd,
      duration: entry.responseEnd - entry.startTime,
      size: entry.transferSize || entry.decodedBodySize || 0,
      fromCache: entry.transferSize === 0 && entry.decodedBodySize > 0,
      priority: this.getResourcePriority(entry.name),
      success: entry.responseEnd > 0,
      error: entry.responseEnd === 0 ? 'Failed to load' : undefined
    };

    this.loadingMetrics.set(entry.name, metrics);
    this.analyzeLoadingPerformance(metrics);
  }

  private analyzeLoadingPerformance(metrics: LoadingMetrics): void {
    // Alert on slow critical resources
    if (this.criticalResources.has(metrics.url) && metrics.duration > this.config.criticalResourceTimeout) {
      console.warn(`🐌 Critical resource loading slowly: ${metrics.url} (${metrics.duration}ms)`);
      this.optimizeResourceLoading(metrics.url);
    }

    // Alert on failed resources
    if (!metrics.success) {
      console.error(`❌ Resource failed to load: ${metrics.url}`);
      this.retryResourceLoad(metrics.url);
    }

    // Track cache performance
    if (metrics.fromCache) {
      console.log(`💾 Cache hit: ${metrics.url} (${metrics.duration}ms)`);
    }
  }

  private optimizeResourceLoading(url: string): void {
    // Add to high priority queue for future loads
    const resource: ResourcePriority = {
      url,
      priority: 'high',
      type: this.getResourceType(url),
      preload: true
    };

    this.addToQueue(resource);
  }

  private retryResourceLoad(url: string, attempt: number = 1): void {
    if (attempt > this.config.retryAttempts) {
      console.error(`❌ Max retry attempts reached for: ${url}`);
      return;
    }

    setTimeout(() => {
      this.loadResource(url)
        .catch(() => this.retryResourceLoad(url, attempt + 1));
    }, this.config.retryDelay * attempt);
  }

  private setupResourceHints(): void {
    if (!this.config.enableResourceHints) return;

    // Add common resource hints
    this.addResourceHint('dns-prefetch', '//fonts.googleapis.com');
    this.addResourceHint('dns-prefetch', '//fonts.gstatic.com');
    this.addResourceHint('preconnect', 'https://fonts.googleapis.com', { crossorigin: 'anonymous' });
  }

  private addResourceHint(rel: string, href: string, options?: { crossorigin?: string; as?: string }): void {
    if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;

    if (options?.crossorigin) link.crossOrigin = options.crossorigin;
    if (options?.as) link.as = options.as;

    document.head.appendChild(link);
  }

  private startLoadingProcessor(): void {
    // Process loading queue every 100ms
    setInterval(() => {
      this.processLoadingQueue();
    }, 100);
  }

  private processLoadingQueue(): void {
    const availableSlots = this.config.maxConcurrentLoads - this.activeLoads.size;
    if (availableSlots <= 0) return;

    // Process in priority order
    const priorities: (keyof LoadingQueue)[] = ['critical', 'high', 'medium', 'low'];
    let processed = 0;

    for (const priority of priorities) {
      const queue = this.loadingQueue[priority];
      
      while (queue.length > 0 && processed < availableSlots) {
        const resource = queue.shift()!;
        this.processResource(resource);
        processed++;
      }

      if (processed >= availableSlots) break;
    }
  }

  private async processResource(resource: ResourcePriority): Promise<void> {
    if (this.activeLoads.has(resource.url)) return;

    this.activeLoads.add(resource.url);

    try {
      if (resource.preload) {
        await this.preloadResource(resource);
      } else if (resource.prefetch) {
        await this.prefetchResource(resource);
      } else {
        await this.loadResource(resource.url);
      }
    } catch (error) {
      console.error(`Failed to process resource: ${resource.url}`, error);
    } finally {
      this.activeLoads.delete(resource.url);
    }
  }

  private async preloadResource(resource: ResourcePriority): Promise<void> {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.type === 'script' ? 'script' : 
              resource.type === 'style' ? 'style' :
              resource.type === 'font' ? 'font' :
              resource.type === 'image' ? 'image' : 'fetch';

    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }

    if (this.config.enablePriorityHints && 'fetchPriority' in link) {
      (link as any).fetchPriority = resource.priority === 'critical' ? 'high' : resource.priority;
    }

    document.head.appendChild(link);

    // Wait for preload to complete
    return new Promise((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Preload failed: ${resource.url}`));
      
      // Timeout for critical resources
      if (resource.priority === 'critical') {
        setTimeout(() => reject(new Error('Preload timeout')), this.config.criticalResourceTimeout);
      }
    });
  }

  private async prefetchResource(resource: ResourcePriority): Promise<void> {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource.url;

    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }

    document.head.appendChild(link);
  }

  private async loadResource(url: string): Promise<Response> {
    // Check cache first
    if (this.resourceCache.has(url)) {
      return this.resourceCache.get(url)!;
    }

    const response = await fetch(url);
    
    if (response.ok) {
      // Cache successful responses
      this.resourceCache.set(url, response.clone());
    }

    return response;
  }

  private detectCriticalResources(): void {
    // Detect critical resources based on common patterns
    const criticalPatterns = [
      /main\.[a-f0-9]+\.js$/,
      /runtime\.[a-f0-9]+\.js$/,
      /vendor\.[a-f0-9]+\.js$/,
      /app\.[a-f0-9]+\.css$/,
      /critical\.css$/
    ];

    // Monitor script and link tags
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLScriptElement || node instanceof HTMLLinkElement) {
            const src = node instanceof HTMLScriptElement ? node.src : node.href;
            
            if (src && criticalPatterns.some(pattern => pattern.test(src))) {
              this.criticalResources.add(src);
            }
          }
        });
      });
    });

    observer.observe(document.head, { childList: true });
  }

  private getResourceType(url: string): ResourcePriority['type'] {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(woff2?|ttf|eot)$/)) return 'font';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) return 'image';
    return 'fetch';
  }

  private getResourcePriority(url: string): string {
    if (this.criticalResources.has(url)) return 'critical';
    if (url.includes('main') || url.includes('runtime')) return 'high';
    if (url.includes('chunk') || url.includes('async')) return 'low';
    return 'medium';
  }

  private addToQueue(resource: ResourcePriority): void {
    // Avoid duplicates
    const queue = this.loadingQueue[resource.priority];
    if (queue.some(r => r.url === resource.url)) return;

    queue.push(resource);
  }

  // Public API methods
  public preload(url: string, options?: {
    priority?: ResourcePriority['priority'];
    type?: ResourcePriority['type'];
    crossorigin?: string;
  }): void {
    const resource: ResourcePriority = {
      url,
      priority: options?.priority || 'medium',
      type: options?.type || this.getResourceType(url),
      preload: true,
      crossorigin: options?.crossorigin
    };

    this.addToQueue(resource);
  }

  public prefetch(url: string, options?: {
    priority?: ResourcePriority['priority'];
    crossorigin?: string;
  }): void {
    const resource: ResourcePriority = {
      url,
      priority: options?.priority || 'low',
      type: this.getResourceType(url),
      prefetch: true,
      crossorigin: options?.crossorigin
    };

    this.addToQueue(resource);
  }

  public setCriticalResources(urls: string[]): void {
    urls.forEach(url => this.criticalResources.add(url));
  }

  public preloadCriticalPath(resources: string[]): Promise<void[]> {
    const promises = resources.map(url => {
      const resource: ResourcePriority = {
        url,
        priority: 'critical',
        type: this.getResourceType(url),
        preload: true
      };

      this.addToQueue(resource);
      return this.waitForResource(url);
    });

    return Promise.all(promises);
  }

  private waitForResource(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkResource = () => {
        const metrics = this.loadingMetrics.get(url);
        if (metrics) {
          if (metrics.success) {
            resolve();
          } else {
            reject(new Error(metrics.error || 'Resource failed to load'));
          }
        } else {
          setTimeout(checkResource, 100);
        }
      };

      checkResource();
      
      // Timeout
      setTimeout(() => reject(new Error('Resource load timeout')), this.config.criticalResourceTimeout);
    });
  }

  public getLoadingMetrics(): Map<string, LoadingMetrics> {
    return new Map(this.loadingMetrics);
  }

  public getQueueStatus(): {
    critical: number;
    high: number;
    medium: number;
    low: number;
    active: number;
  } {
    return {
      critical: this.loadingQueue.critical.length,
      high: this.loadingQueue.high.length,
      medium: this.loadingQueue.medium.length,
      low: this.loadingQueue.low.length,
      active: this.activeLoads.size
    };
  }

  public generateLoadingReport(): {
    totalResources: number;
    averageLoadTime: number;
    cacheHitRatio: number;
    failedResources: number;
    criticalResourcesCount: number;
    slowResources: LoadingMetrics[];
    recommendations: string[];
  } {
    const metrics = Array.from(this.loadingMetrics.values());
    const totalResources = metrics.length;
    const averageLoadTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalResources || 0;
    const cacheHits = metrics.filter(m => m.fromCache).length;
    const cacheHitRatio = totalResources > 0 ? cacheHits / totalResources : 0;
    const failedResources = metrics.filter(m => !m.success).length;
    const criticalResourcesCount = this.criticalResources.size;
    const slowResources = metrics.filter(m => m.duration > 1000).sort((a, b) => b.duration - a.duration);

    const recommendations = this.generateLoadingRecommendations(metrics);

    return {
      totalResources,
      averageLoadTime,
      cacheHitRatio,
      failedResources,
      criticalResourcesCount,
      slowResources,
      recommendations
    };
  }

  private generateLoadingRecommendations(metrics: LoadingMetrics[]): string[] {
    const recommendations: string[] = [];

    const slowResources = metrics.filter(m => m.duration > 1000).length;
    if (slowResources > 0) {
      recommendations.push(`${slowResources} resources are loading slowly (>1s)`);
    }

    const failedResources = metrics.filter(m => !m.success).length;
    if (failedResources > 0) {
      recommendations.push(`${failedResources} resources failed to load`);
    }

    const cacheHits = metrics.filter(m => m.fromCache).length;
    const cacheHitRatio = metrics.length > 0 ? cacheHits / metrics.length : 0;
    if (cacheHitRatio < 0.5) {
      recommendations.push('Low cache hit ratio - consider improving caching strategy');
    }

    const largeResources = metrics.filter(m => m.size > 500 * 1024).length;
    if (largeResources > 0) {
      recommendations.push(`${largeResources} resources are larger than 500KB`);
    }

    if (this.activeLoads.size >= this.config.maxConcurrentLoads) {
      recommendations.push('Consider increasing max concurrent loads or optimizing resource priorities');
    }

    return recommendations;
  }

  public updateConfig(newConfig: Partial<ResourceLoadingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ResourceLoadingConfig {
    return { ...this.config };
  }

  public clearCache(): void {
    this.resourceCache.clear();
  }

  public clearMetrics(): void {
    this.loadingMetrics.clear();
  }

  public cleanup(): void {
    this.networkObserver?.disconnect();
    this.resourceCache.clear();
    this.loadingMetrics.clear();
    this.activeLoads.clear();
    this.criticalResources.clear();
    
    // Clear queues
    Object.keys(this.loadingQueue).forEach(key => {
      (this.loadingQueue as any)[key] = [];
    });
  }
}