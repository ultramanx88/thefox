/**
 * CDN Optimizer
 * Implements CDN optimization strategies for global content delivery
 */

export interface CDNConfig {
  primaryCDN: string;
  fallbackCDNs: string[];
  enableGeoRouting: boolean;
  enableEdgeCaching: boolean;
  enableImageOptimization: boolean;
  enableCompressionOptimization: boolean;
  cacheHeaders: Record<string, string>;
  optimizationRules: OptimizationRule[];
}

export interface OptimizationRule {
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  maxAge: number;
  compression: boolean;
  imageOptimization?: ImageOptimizationConfig;
}

export interface ImageOptimizationConfig {
  formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
  qualities: Record<string, number>;
  sizes: number[];
  lazyLoading: boolean;
}

export interface CDNMetrics {
  hitRatio: number;
  missRatio: number;
  averageResponseTime: number;
  bandwidthSaved: number;
  costSavings: number;
  globalDistribution: Record<string, number>;
  errorRate: number;
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export class CDNOptimizer {
  private config: CDNConfig;
  private metrics: CDNMetrics;
  private geolocation?: GeolocationData;
  private performanceObserver?: PerformanceObserver;
  private optimizationCache: Map<string, OptimizedResource> = new Map();
  
  private metricsInterval?: NodeJS.Timeout;
  private optimizationInterval?: NodeJS.Timeout;

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = {
      primaryCDN: 'https://cdn.example.com',
      fallbackCDNs: ['https://cdn2.example.com', 'https://cdn3.example.com'],
      enableGeoRouting: true,
      enableEdgeCaching: true,
      enableImageOptimization: true,
      enableCompressionOptimization: true,
      cacheHeaders: {
        'Cache-Control': 'public, max-age=31536000',
        'Expires': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
      },
      optimizationRules: this.getDefaultOptimizationRules(),
      ...config
    };

    this.metrics = {
      hitRatio: 0,
      missRatio: 0,
      averageResponseTime: 0,
      bandwidthSaved: 0,
      costSavings: 0,
      globalDistribution: {},
      errorRate: 0
    };

    this.initialize();
  }

  /**
   * Initialize CDN optimizer
   */
  private async initialize(): Promise<void> {
    try {
      // Detect user geolocation for optimal CDN routing
      if (this.config.enableGeoRouting) {
        await this.detectGeolocation();
      }

      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start optimization tasks
      this.startOptimizationTasks();

      console.log('CDN optimizer initialized');
    } catch (error) {
      console.error('Failed to initialize CDN optimizer:', error);
    }
  }

  /**
   * Optimize resource URL for CDN delivery
   */
  optimizeResourceUrl(originalUrl: string, options: ResourceOptimizationOptions = {}): string {
    try {
      const rule = this.findMatchingRule(originalUrl);
      const optimizedUrl = this.buildOptimizedUrl(originalUrl, rule, options);
      
      // Cache optimization result
      this.cacheOptimization(originalUrl, {
        originalUrl,
        optimizedUrl,
        rule,
        options,
        timestamp: Date.now()
      });

      return optimizedUrl;
    } catch (error) {
      console.error('Error optimizing resource URL:', error);
      return originalUrl; // Fallback to original URL
    }
  }

  /**
   * Optimize image URL with format and size optimization
   */
  optimizeImageUrl(
    imageUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      lazy?: boolean;
    } = {}
  ): string {
    if (!this.config.enableImageOptimization) {
      return imageUrl;
    }

    const rule = this.findMatchingRule(imageUrl);
    const imageConfig = rule?.imageOptimization;
    
    if (!imageConfig) {
      return imageUrl;
    }

    // Determine optimal format based on browser support
    const optimalFormat = this.getOptimalImageFormat(options.format, imageConfig.formats);
    
    // Determine optimal quality
    const quality = options.quality || imageConfig.qualities[optimalFormat] || 80;
    
    // Build optimized image URL
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (quality !== 80) params.set('q', quality.toString());
    if (optimalFormat !== 'jpeg') params.set('f', optimalFormat);
    
    const cdnUrl = this.getOptimalCDNUrl();
    const separator = imageUrl.includes('?') ? '&' : '?';
    
    return `${cdnUrl}${imageUrl}${separator}${params.toString()}`;
  }

  /**
   * Preload critical resources
   */
  async preloadCriticalResources(resources: string[]): Promise<void> {
    const preloadPromises = resources.map(async (resource) => {
      try {
        const optimizedUrl = this.optimizeResourceUrl(resource, { priority: 'high' });
        
        // Create preload link
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = optimizedUrl;
        link.as = this.getResourceType(resource);
        
        if (this.config.enableCompressionOptimization) {
          link.setAttribute('crossorigin', 'anonymous');
        }
        
        document.head.appendChild(link);
        
        console.log(`Preloaded critical resource: ${resource}`);
      } catch (error) {
        console.error(`Failed to preload resource ${resource}:`, error);
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Implement intelligent prefetching
   */
  async prefetchResources(resources: string[], priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    // Only prefetch if network conditions are good
    if (!this.shouldPrefetch()) {
      return;
    }

    const prefetchPromises = resources.map(async (resource) => {
      try {
        const optimizedUrl = this.optimizeResourceUrl(resource, { priority });
        
        // Use different prefetch strategies based on priority
        if (priority === 'high') {
          await this.prefetchWithFetch(optimizedUrl);
        } else {
          this.prefetchWithLink(optimizedUrl);
        }
        
      } catch (error) {
        console.error(`Failed to prefetch resource ${resource}:`, error);
      }
    });

    await Promise.all(prefetchPromises);
  }

  /**
   * Get CDN performance metrics
   */
  getMetrics(): CDNMetrics {
    return { ...this.metrics };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.hitRatio < 0.8) {
      recommendations.push('Consider increasing cache TTL for static assets');
    }
    
    if (this.metrics.averageResponseTime > 200) {
      recommendations.push('Consider using a CDN closer to your users');
    }
    
    if (this.metrics.errorRate > 0.05) {
      recommendations.push('Check CDN configuration and fallback mechanisms');
    }
    
    const imageOptimizationSavings = this.calculateImageOptimizationSavings();
    if (imageOptimizationSavings > 30) {
      recommendations.push(`Enable image optimization to save ~${imageOptimizationSavings}% bandwidth`);
    }
    
    return recommendations;
  }

  /**
   * Test CDN performance across different regions
   */
  async testCDNPerformance(): Promise<CDNPerformanceReport> {
    const testUrls = [
      `${this.config.primaryCDN}/test-image.jpg`,
      `${this.config.primaryCDN}/test-script.js`,
      `${this.config.primaryCDN}/test-style.css`
    ];

    const results: CDNTestResult[] = [];

    for (const url of testUrls) {
      try {
        const startTime = performance.now();
        const response = await fetch(url, { method: 'HEAD' });
        const endTime = performance.now();
        
        results.push({
          url,
          responseTime: endTime - startTime,
          status: response.status,
          cacheHit: response.headers.get('x-cache-status') === 'HIT',
          region: response.headers.get('x-served-by') || 'unknown'
        });
      } catch (error) {
        results.push({
          url,
          responseTime: -1,
          status: 0,
          cacheHit: false,
          region: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      timestamp: Date.now(),
      results,
      averageResponseTime: results.reduce((sum, r) => sum + Math.max(0, r.responseTime), 0) / results.length,
      cacheHitRatio: results.filter(r => r.cacheHit).length / results.length,
      errorRate: results.filter(r => r.status === 0).length / results.length
    };
  }

  // Private methods

  private getDefaultOptimizationRules(): OptimizationRule[] {
    return [
      {
        pattern: /\.(jpg|jpeg|png|gif|webp|avif)$/i,
        strategy: 'cache-first',
        maxAge: 31536000, // 1 year
        compression: true,
        imageOptimization: {
          formats: ['avif', 'webp', 'jpeg'],
          qualities: { avif: 75, webp: 80, jpeg: 85 },
          sizes: [320, 640, 1024, 1920],
          lazyLoading: true
        }
      },
      {
        pattern: /\.(js|css)$/i,
        strategy: 'cache-first',
        maxAge: 31536000, // 1 year
        compression: true
      },
      {
        pattern: /\.(woff|woff2|ttf|eot)$/i,
        strategy: 'cache-first',
        maxAge: 31536000, // 1 year
        compression: false
      },
      {
        pattern: /\/api\//i,
        strategy: 'network-first',
        maxAge: 300, // 5 minutes
        compression: true
      },
      {
        pattern: /.*/,
        strategy: 'stale-while-revalidate',
        maxAge: 86400, // 1 day
        compression: true
      }
    ];
  }

  private findMatchingRule(url: string): OptimizationRule | undefined {
    return this.config.optimizationRules.find(rule => rule.pattern.test(url));
  }

  private buildOptimizedUrl(
    originalUrl: string,
    rule?: OptimizationRule,
    options: ResourceOptimizationOptions = {}
  ): string {
    const cdnUrl = this.getOptimalCDNUrl();
    
    // Handle absolute URLs
    if (originalUrl.startsWith('http')) {
      const url = new URL(originalUrl);
      return `${cdnUrl}${url.pathname}${url.search}`;
    }
    
    // Handle relative URLs
    let optimizedUrl = `${cdnUrl}${originalUrl}`;
    
    // Add optimization parameters
    const params = new URLSearchParams();
    
    if (rule?.compression && this.config.enableCompressionOptimization) {
      params.set('compress', 'true');
    }
    
    if (options.priority) {
      params.set('priority', options.priority);
    }
    
    if (params.toString()) {
      const separator = originalUrl.includes('?') ? '&' : '?';
      optimizedUrl += `${separator}${params.toString()}`;
    }
    
    return optimizedUrl;
  }

  private getOptimalCDNUrl(): string {
    if (!this.config.enableGeoRouting || !this.geolocation) {
      return this.config.primaryCDN;
    }

    // Simple geo-routing logic (in practice, this would be more sophisticated)
    const region = this.geolocation.region.toLowerCase();
    
    if (region.includes('asia') && this.config.fallbackCDNs[0]) {
      return this.config.fallbackCDNs[0];
    } else if (region.includes('europe') && this.config.fallbackCDNs[1]) {
      return this.config.fallbackCDNs[1];
    }
    
    return this.config.primaryCDN;
  }

  private getOptimalImageFormat(
    requestedFormat?: string,
    supportedFormats: string[] = ['webp', 'jpeg']
  ): string {
    if (requestedFormat && supportedFormats.includes(requestedFormat)) {
      return requestedFormat;
    }

    // Check browser support for modern formats
    if (supportedFormats.includes('avif') && this.supportsImageFormat('avif')) {
      return 'avif';
    } else if (supportedFormats.includes('webp') && this.supportsImageFormat('webp')) {
      return 'webp';
    }
    
    return 'jpeg'; // Fallback
  }

  private supportsImageFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      return canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
    } catch {
      return false;
    }
  }

  private getResourceType(url: string): string {
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) return 'image';
    if (/\.(js)$/i.test(url)) return 'script';
    if (/\.(css)$/i.test(url)) return 'style';
    if (/\.(woff|woff2|ttf|eot)$/i.test(url)) return 'font';
    return 'fetch';
  }

  private shouldPrefetch(): boolean {
    // Check network conditions
    const connection = (navigator as any).connection;
    if (connection) {
      // Don't prefetch on slow connections or data saver mode
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' || connection.saveData) {
        return false;
      }
    }

    // Check if page is visible
    if (document.hidden) {
      return false;
    }

    return true;
  }

  private async prefetchWithFetch(url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'force-cache'
      });
      
      if (response.ok) {
        console.log(`High-priority prefetch completed: ${url}`);
      }
    } catch (error) {
      console.error(`High-priority prefetch failed: ${url}`, error);
    }
  }

  private prefetchWithLink(url: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  }

  private async detectGeolocation(): Promise<void> {
    try {
      // Try to get geolocation from IP (using a service)
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        this.geolocation = {
          country: data.country_name,
          region: data.region,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone
        };
        
        console.log('Geolocation detected:', this.geolocation);
      }
    } catch (error) {
      console.warn('Failed to detect geolocation:', error);
    }
  }

  private setupPerformanceMonitoring(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.updateResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });
      
      this.performanceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private updateResourceMetrics(entry: PerformanceResourceTiming): void {
    // Check if this is a CDN resource
    const isCDNResource = this.config.fallbackCDNs.some(cdn => entry.name.includes(cdn)) ||
                         entry.name.includes(this.config.primaryCDN);
    
    if (!isCDNResource) return;

    // Update metrics
    const responseTime = entry.responseEnd - entry.responseStart;
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime + responseTime) / 2;
    
    // Check if resource was served from cache
    const fromCache = entry.transferSize === 0 && entry.decodedBodySize > 0;
    if (fromCache) {
      this.metrics.hitRatio = (this.metrics.hitRatio + 1) / 2;
    } else {
      this.metrics.missRatio = (this.metrics.missRatio + 1) / 2;
    }
    
    // Calculate bandwidth saved
    if (fromCache) {
      this.metrics.bandwidthSaved += entry.decodedBodySize;
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateCostSavings();
      this.updateGlobalDistribution();
    }, 60000); // Every minute
  }

  private startOptimizationTasks(): void {
    this.optimizationInterval = setInterval(() => {
      this.cleanupOptimizationCache();
      this.optimizeBasedOnMetrics();
    }, 300000); // Every 5 minutes
  }

  private updateCostSavings(): void {
    // Calculate cost savings based on bandwidth saved and cache hit ratio
    const bandwidthCostPerGB = 0.05; // $0.05 per GB (example)
    const bandwidthSavedGB = this.metrics.bandwidthSaved / (1024 * 1024 * 1024);
    this.metrics.costSavings = bandwidthSavedGB * bandwidthCostPerGB;
  }

  private updateGlobalDistribution(): void {
    // Update global distribution metrics
    if (this.geolocation) {
      const region = this.geolocation.region;
      this.metrics.globalDistribution[region] = (this.metrics.globalDistribution[region] || 0) + 1;
    }
  }

  private cleanupOptimizationCache(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    for (const [key, optimization] of this.optimizationCache.entries()) {
      if (now - optimization.timestamp > maxAge) {
        this.optimizationCache.delete(key);
      }
    }
  }

  private optimizeBasedOnMetrics(): void {
    // Adjust optimization rules based on performance metrics
    if (this.metrics.averageResponseTime > 500) {
      console.log('High response time detected, enabling more aggressive caching');
      // Increase cache TTL for static assets
    }
    
    if (this.metrics.hitRatio < 0.7) {
      console.log('Low cache hit ratio detected, reviewing cache strategy');
      // Review and adjust cache strategies
    }
  }

  private calculateImageOptimizationSavings(): number {
    // Estimate potential savings from image optimization
    // This is a simplified calculation
    const imageRequests = Array.from(this.optimizationCache.values())
      .filter(opt => /\.(jpg|jpeg|png|gif)$/i.test(opt.originalUrl));
    
    if (imageRequests.length === 0) return 0;
    
    // Assume 40% savings on average with modern formats and compression
    return 40;
  }

  private cacheOptimization(key: string, optimization: OptimizedResource): void {
    this.optimizationCache.set(key, optimization);
    
    // Keep cache size manageable
    if (this.optimizationCache.size > 1000) {
      const oldestKey = this.optimizationCache.keys().next().value;
      this.optimizationCache.delete(oldestKey);
    }
  }

  /**
   * Destroy CDN optimizer
   */
  destroy(): void {
    // Clear intervals
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Clear cache
    this.optimizationCache.clear();

    console.log('CDN optimizer destroyed');
  }
}

// Supporting interfaces

interface ResourceOptimizationOptions {
  priority?: 'high' | 'medium' | 'low';
  format?: string;
  quality?: number;
  width?: number;
  height?: number;
}

interface OptimizedResource {
  originalUrl: string;
  optimizedUrl: string;
  rule?: OptimizationRule;
  options: ResourceOptimizationOptions;
  timestamp: number;
}

interface CDNTestResult {
  url: string;
  responseTime: number;
  status: number;
  cacheHit: boolean;
  region: string;
  error?: string;
}

interface CDNPerformanceReport {
  timestamp: number;
  results: CDNTestResult[];
  averageResponseTime: number;
  cacheHitRatio: number;
  errorRate: number;
}