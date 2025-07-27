// Resource Optimizer for PWA Scalability
export interface ResourceOptimizationConfig {
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableImageOptimization: boolean;
  enableResourceHints: boolean;
  enableCompression: boolean;
  bundleSizeThreshold: number; // KB
  imageQuality: number; // 0-1
  webpFallback: boolean;
  avifSupport: boolean;
}

export interface ResourceMetrics {
  totalSize: number;
  compressedSize: number;
  loadTime: number;
  cacheHitRatio: number;
  resourceCount: number;
  criticalResourcesLoaded: number;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  loadTimeImprovement: number;
  recommendations: string[];
}

export class ResourceOptimizer {
  private static instance: ResourceOptimizer;
  private config: ResourceOptimizationConfig;
  private resourceMetrics: Map<string, ResourceMetrics> = new Map();
  private criticalResources: Set<string> = new Set();
  private lazyLoadObserver?: IntersectionObserver;

  private constructor() {
    this.config = {
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableImageOptimization: true,
      enableResourceHints: true,
      enableCompression: true,
      bundleSizeThreshold: 250, // 250KB
      imageQuality: 0.85,
      webpFallback: true,
      avifSupport: true
    };
    this.initializeOptimizations();
  }

  static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  private initializeOptimizations(): void {
    if (typeof window === 'undefined') return;

    this.setupLazyLoading();
    this.setupResourceHints();
    this.setupImageOptimization();
    this.monitorBundleSize();
  }
}  
private setupLazyLoading(): void {
    if (!this.config.enableLazyLoading || !('IntersectionObserver' in window)) return;

    this.lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadResource(element);
            this.lazyLoadObserver?.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    // Observe existing lazy elements
    this.observeLazyElements();
  }

  private observeLazyElements(): void {
    const lazyElements = document.querySelectorAll('[data-lazy]');
    lazyElements.forEach((element) => {
      this.lazyLoadObserver?.observe(element);
    });
  }

  private loadResource(element: HTMLElement): void {
    const src = element.getAttribute('data-src');
    const srcset = element.getAttribute('data-srcset');
    
    if (element instanceof HTMLImageElement) {
      if (src) element.src = src;
      if (srcset) element.srcset = srcset;
    } else if (element instanceof HTMLIFrameElement) {
      if (src) element.src = src;
    }
    
    element.removeAttribute('data-lazy');
    element.classList.add('loaded');
  }

  private setupResourceHints(): void {
    if (!this.config.enableResourceHints) return;

    // Add DNS prefetch for external domains
    this.addDNSPrefetch([
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'firestore.googleapis.com',
      'firebase.googleapis.com'
    ]);

    // Preconnect to critical origins
    this.addPreconnect([
      'https://fonts.googleapis.com',
      'https://firestore.googleapis.com'
    ]);
  }

  private addDNSPrefetch(domains: string[]): void {
    domains.forEach((domain) => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="//${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain}`;
        document.head.appendChild(link);
      }
    });
  }

  private addPreconnect(origins: string[]): void {
    origins.forEach((origin) => {
      if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }  privat
e setupImageOptimization(): void {
    if (!this.config.enableImageOptimization) return;

    // Replace images with optimized versions
    this.optimizeExistingImages();
    
    // Set up mutation observer for new images
    this.observeNewImages();
  }

  private optimizeExistingImages(): void {
    const images = document.querySelectorAll('img');
    images.forEach((img) => this.optimizeImage(img));
  }

  private observeNewImages(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            this.optimizeImage(node);
          } else if (node instanceof HTMLElement) {
            const images = node.querySelectorAll('img');
            images.forEach((img) => this.optimizeImage(img));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private optimizeImage(img: HTMLImageElement): void {
    if (img.dataset.optimized) return;

    const originalSrc = img.src || img.dataset.src;
    if (!originalSrc) return;

    // Generate optimized image URLs
    const optimizedSources = this.generateOptimizedImageSources(originalSrc);
    
    // Create picture element with multiple sources
    if (optimizedSources.length > 1) {
      this.createPictureElement(img, optimizedSources);
    }

    img.dataset.optimized = 'true';
  }

  private generateOptimizedImageSources(src: string): Array<{
    src: string;
    type: string;
    media?: string;
  }> {
    const sources = [];
    const baseSrc = src.split('?')[0];
    const isExternal = src.startsWith('http') && !src.includes(window.location.hostname);

    if (isExternal) {
      // For external images, we can't optimize directly
      return [{ src, type: 'image/jpeg' }];
    }

    // Generate AVIF version if supported
    if (this.config.avifSupport && this.supportsFormat('avif')) {
      sources.push({
        src: this.addImageParams(baseSrc, { format: 'avif', quality: this.config.imageQuality }),
        type: 'image/avif'
      });
    }

    // Generate WebP version if supported
    if (this.config.webpFallback && this.supportsFormat('webp')) {
      sources.push({
        src: this.addImageParams(baseSrc, { format: 'webp', quality: this.config.imageQuality }),
        type: 'image/webp'
      });
    }

    // Original format as fallback
    sources.push({
      src: this.addImageParams(baseSrc, { quality: this.config.imageQuality }),
      type: this.getImageType(baseSrc)
    });

    return sources;
  }

  private createPictureElement(img: HTMLImageElement, sources: Array<{
    src: string;
    type: string;
    media?: string;
  }>): void {
    const picture = document.createElement('picture');
    
    // Add source elements
    sources.slice(0, -1).forEach((source) => {
      const sourceElement = document.createElement('source');
      sourceElement.srcset = source.src;
      sourceElement.type = source.type;
      if (source.media) sourceElement.media = source.media;
      picture.appendChild(sourceElement);
    });

    // Update img src to the fallback
    img.src = sources[sources.length - 1].src;
    
    // Replace img with picture
    img.parentNode?.insertBefore(picture, img);
    picture.appendChild(img);
  } 
 private supportsFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  }

  private getImageType(src: string): string {
    const extension = src.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg';
    }
  }

  private addImageParams(src: string, params: { format?: string; quality?: number }): string {
    const url = new URL(src, window.location.origin);
    
    if (params.format) {
      url.searchParams.set('format', params.format);
    }
    
    if (params.quality) {
      url.searchParams.set('quality', Math.round(params.quality * 100).toString());
    }
    
    return url.toString();
  }

  private monitorBundleSize(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.analyzeResourceSize(entry as PerformanceResourceTiming);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private analyzeResourceSize(entry: PerformanceResourceTiming): void {
    const sizeKB = (entry.transferSize || 0) / 1024;
    
    if (sizeKB > this.config.bundleSizeThreshold) {
      console.warn(`Large bundle detected: ${entry.name} (${sizeKB.toFixed(2)}KB)`);
      
      // Suggest code splitting for large bundles
      if (entry.name.includes('.js')) {
        this.suggestCodeSplitting(entry.name);
      }
    }

    // Update metrics
    this.updateResourceMetrics(entry.name, {
      totalSize: entry.transferSize || 0,
      compressedSize: entry.encodedBodySize || 0,
      loadTime: entry.responseEnd - entry.startTime,
      cacheHitRatio: entry.transferSize === 0 ? 1 : 0,
      resourceCount: 1,
      criticalResourcesLoaded: this.criticalResources.has(entry.name) ? 1 : 0
    });
  }

  private suggestCodeSplitting(bundleName: string): void {
    console.log(`💡 Optimization Suggestion: Consider code splitting for ${bundleName}`);
    
    // Send suggestion to service worker for tracking
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'OPTIMIZATION_SUGGESTION',
        payload: {
          type: 'code_splitting',
          resource: bundleName,
          timestamp: Date.now()
        }
      });
    }
  }  // Pu
blic API methods
  public preloadCriticalResources(resources: string[]): void {
    resources.forEach((resource) => {
      this.criticalResources.add(resource);
      this.preloadResource(resource);
    });
  }

  private preloadResource(href: string): void {
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    
    // Determine resource type
    if (href.endsWith('.js')) {
      link.as = 'script';
    } else if (href.endsWith('.css')) {
      link.as = 'style';
    } else if (href.match(/\.(woff2?|ttf|eot)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (href.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  }

  public enableLazyLoading(selector: string = '[data-lazy]'): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      this.lazyLoadObserver?.observe(element);
    });
  }

  public optimizeImages(container?: HTMLElement): void {
    const root = container || document;
    const images = root.querySelectorAll('img:not([data-optimized])');
    images.forEach((img) => this.optimizeImage(img as HTMLImageElement));
  }

  public addResourceHint(type: 'dns-prefetch' | 'preconnect' | 'preload', href: string, options?: {
    as?: string;
    crossorigin?: string;
  }): void {
    const link = document.createElement('link');
    link.rel = type;
    link.href = href;
    
    if (options?.as) link.as = options.as;
    if (options?.crossorigin) link.crossOrigin = options.crossorigin;
    
    document.head.appendChild(link);
  }

  public getResourceMetrics(): Map<string, ResourceMetrics> {
    return new Map(this.resourceMetrics);
  }

  public generateOptimizationReport(): OptimizationResult {
    const metrics = Array.from(this.resourceMetrics.values());
    
    const totalOriginalSize = metrics.reduce((sum, m) => sum + m.totalSize, 0);
    const totalCompressedSize = metrics.reduce((sum, m) => sum + m.compressedSize, 0);
    const averageLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    
    const compressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;
    const loadTimeImprovement = this.calculateLoadTimeImprovement();
    
    return {
      originalSize: totalOriginalSize,
      optimizedSize: totalCompressedSize,
      compressionRatio,
      loadTimeImprovement,
      recommendations: this.generateRecommendations(metrics)
    };
  }

  private calculateLoadTimeImprovement(): number {
    // Simplified calculation - would need baseline measurements
    const currentMetrics = Array.from(this.resourceMetrics.values());
    const averageLoadTime = currentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / currentMetrics.length;
    
    // Assume 30% improvement with optimizations
    return averageLoadTime * 0.3;
  }

  private generateRecommendations(metrics: ResourceMetrics[]): string[] {
    const recommendations: string[] = [];
    
    const totalSize = metrics.reduce((sum, m) => sum + m.totalSize, 0);
    const averageCacheHitRatio = metrics.reduce((sum, m) => sum + m.cacheHitRatio, 0) / metrics.length;
    const averageLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    
    if (totalSize > 1024 * 1024) { // > 1MB
      recommendations.push('Consider implementing more aggressive code splitting to reduce bundle sizes');
    }
    
    if (averageCacheHitRatio < 0.8) {
      recommendations.push('Improve caching strategies to increase cache hit ratio');
    }
    
    if (averageLoadTime > 1000) { // > 1s
      recommendations.push('Optimize resource loading with preloading and compression');
    }
    
    if (!this.config.enableImageOptimization) {
      recommendations.push('Enable image optimization to reduce image sizes');
    }
    
    if (!this.config.enableLazyLoading) {
      recommendations.push('Implement lazy loading for non-critical resources');
    }
    
    return recommendations;
  } 
 private updateResourceMetrics(resourceName: string, metrics: ResourceMetrics): void {
    const existing = this.resourceMetrics.get(resourceName);
    
    if (existing) {
      // Update existing metrics
      this.resourceMetrics.set(resourceName, {
        totalSize: existing.totalSize + metrics.totalSize,
        compressedSize: existing.compressedSize + metrics.compressedSize,
        loadTime: (existing.loadTime + metrics.loadTime) / 2, // Average
        cacheHitRatio: (existing.cacheHitRatio + metrics.cacheHitRatio) / 2,
        resourceCount: existing.resourceCount + metrics.resourceCount,
        criticalResourcesLoaded: existing.criticalResourcesLoaded + metrics.criticalResourcesLoaded
      });
    } else {
      this.resourceMetrics.set(resourceName, metrics);
    }
  }

  public updateConfig(newConfig: Partial<ResourceOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize optimizations if needed
    if (newConfig.enableLazyLoading !== undefined) {
      if (newConfig.enableLazyLoading) {
        this.setupLazyLoading();
      } else {
        this.lazyLoadObserver?.disconnect();
      }
    }
    
    if (newConfig.enableImageOptimization !== undefined) {
      if (newConfig.enableImageOptimization) {
        this.setupImageOptimization();
      }
    }
  }

  public getConfig(): ResourceOptimizationConfig {
    return { ...this.config };
  }

  public clearMetrics(): void {
    this.resourceMetrics.clear();
  }

  public cleanup(): void {
    this.lazyLoadObserver?.disconnect();
    this.resourceMetrics.clear();
    this.criticalResources.clear();
  }

  // Utility methods for external use
  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static calculateCompressionRatio(original: number, compressed: number): number {
    return original > 0 ? compressed / original : 1;
  }

  public static isImageResource(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url);
  }

  public static isScriptResource(url: string): boolean {
    return /\.js$/i.test(url);
  }

  public static isStyleResource(url: string): boolean {
    return /\.css$/i.test(url);
  }

  public static isFontResource(url: string): boolean {
    return /\.(woff2?|ttf|eot)$/i.test(url);
  }
}