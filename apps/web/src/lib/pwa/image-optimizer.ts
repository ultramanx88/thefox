// Advanced Image Optimizer for PWA Performance
export interface ImageOptimizationConfig {
  enableWebP: boolean;
  enableAVIF: boolean;
  enableResponsive: boolean;
  enableLazyLoading: boolean;
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  compressionLevel: number; // 0-9
  enablePlaceholder: boolean;
  placeholderQuality: number;
}

export interface ImageMetrics {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  loadTime: number;
  format: string;
  dimensions: { width: number; height: number };
  isLazyLoaded: boolean;
  cacheHit: boolean;
}

export interface OptimizedImageSource {
  src: string;
  type: string;
  sizes?: string;
  media?: string;
}

export interface ImageOptimizationResult {
  originalUrl: string;
  optimizedSources: OptimizedImageSource[];
  placeholder?: string;
  metrics: ImageMetrics;
  recommendations: string[];
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private config: ImageOptimizationConfig;
  private imageMetrics: Map<string, ImageMetrics> = new Map();
  private formatSupport: Map<string, boolean> = new Map();
  private lazyLoadObserver?: IntersectionObserver;
  private placeholderCanvas?: HTMLCanvasElement;

  private constructor() {
    this.config = {
      enableWebP: true,
      enableAVIF: true,
      enableResponsive: true,
      enableLazyLoading: true,
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1080,
      compressionLevel: 6,
      enablePlaceholder: true,
      placeholderQuality: 0.1
    };

    this.initializeOptimizer();
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  private initializeOptimizer(): void {
    if (typeof window === 'undefined') return;

    this.detectFormatSupport();
    this.setupLazyLoading();
    this.createPlaceholderCanvas();
    this.optimizeExistingImages();
    this.setupImageObserver();
  }

  private detectFormatSupport(): void {
    const formats = ['webp', 'avif', 'jpeg', 'png'];
    
    formats.forEach(format => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const supported = canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
      this.formatSupport.set(format, supported);
    });
  }

  private setupLazyLoading(): void {
    if (!this.config.enableLazyLoading || !('IntersectionObserver' in window)) return;

    this.lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.lazyLoadObserver?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  private createPlaceholderCanvas(): void {
    if (!this.config.enablePlaceholder) return;

    this.placeholderCanvas = document.createElement('canvas');
    this.placeholderCanvas.width = 10;
    this.placeholderCanvas.height = 10;
  }

  private optimizeExistingImages(): void {
    const images = document.querySelectorAll('img:not([data-optimized])');
    images.forEach(img => this.optimizeImage(img as HTMLImageElement));
  }

  private setupImageObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            this.optimizeImage(node);
          } else if (node instanceof HTMLElement) {
            const images = node.querySelectorAll('img:not([data-optimized])');
            images.forEach(img => this.optimizeImage(img as HTMLImageElement));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  public optimizeImage(img: HTMLImageElement): ImageOptimizationResult {
    if (img.dataset.optimized) {
      return this.getExistingOptimization(img);
    }

    const originalUrl = img.src || img.dataset.src || '';
    if (!originalUrl) {
      throw new Error('Image source not found');
    }

    const startTime = performance.now();
    
    // Generate optimized sources
    const optimizedSources = this.generateOptimizedSources(originalUrl, img);
    
    // Create placeholder if enabled
    const placeholder = this.config.enablePlaceholder ? 
      this.generatePlaceholder(originalUrl, img) : undefined;
    
    // Apply optimizations
    this.applyOptimizations(img, optimizedSources, placeholder);
    
    // Calculate metrics
    const loadTime = performance.now() - startTime;
    const metrics = this.calculateMetrics(originalUrl, optimizedSources, loadTime, img);
    
    // Store metrics
    this.imageMetrics.set(originalUrl, metrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, img);
    
    // Mark as optimized
    img.dataset.optimized = 'true';
    
    return {
      originalUrl,
      optimizedSources,
      placeholder,
      metrics,
      recommendations
    };
  }

  private generateOptimizedSources(originalUrl: string, img: HTMLImageElement): OptimizedImageSource[] {
    const sources: OptimizedImageSource[] = [];
    const isExternal = this.isExternalImage(originalUrl);
    
    if (isExternal) {
      // For external images, we can't optimize directly
      return [{ src: originalUrl, type: this.getImageMimeType(originalUrl) }];
    }

    // Generate responsive sizes if enabled
    const sizes = this.config.enableResponsive ? this.generateResponsiveSizes(img) : undefined;
    
    // Generate AVIF version if supported
    if (this.config.enableAVIF && this.formatSupport.get('avif')) {
      sources.push({
        src: this.generateOptimizedUrl(originalUrl, 'avif'),
        type: 'image/avif',
        sizes
      });
    }
    
    // Generate WebP version if supported
    if (this.config.enableWebP && this.formatSupport.get('webp')) {
      sources.push({
        src: this.generateOptimizedUrl(originalUrl, 'webp'),
        type: 'image/webp',
        sizes
      });
    }
    
    // Original format as fallback
    sources.push({
      src: this.generateOptimizedUrl(originalUrl),
      type: this.getImageMimeType(originalUrl),
      sizes
    });
    
    return sources;
  }

  private generateResponsiveSizes(img: HTMLImageElement): string {
    const containerWidth = img.parentElement?.clientWidth || window.innerWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Generate common breakpoints
    const breakpoints = [320, 640, 768, 1024, 1280, 1920];
    const sizes = breakpoints
      .filter(bp => bp <= containerWidth * devicePixelRatio)
      .map(bp => `${bp}w`)
      .join(', ');
    
    return sizes || `${Math.min(containerWidth * devicePixelRatio, this.config.maxWidth)}w`;
  }

  private generateOptimizedUrl(originalUrl: string, format?: string): string {
    const url = new URL(originalUrl, window.location.origin);
    
    // Add optimization parameters
    if (format) {
      url.searchParams.set('format', format);
    }
    
    url.searchParams.set('quality', Math.round(this.config.quality * 100).toString());
    url.searchParams.set('compress', this.config.compressionLevel.toString());
    
    if (this.config.maxWidth) {
      url.searchParams.set('w', this.config.maxWidth.toString());
    }
    
    if (this.config.maxHeight) {
      url.searchParams.set('h', this.config.maxHeight.toString());
    }
    
    return url.toString();
  }

  private generatePlaceholder(originalUrl: string, img: HTMLImageElement): string {
    if (!this.placeholderCanvas) return '';
    
    const ctx = this.placeholderCanvas.getContext('2d');
    if (!ctx) return '';
    
    // Create a simple colored placeholder based on image dimensions
    const aspectRatio = img.naturalWidth / img.naturalHeight || 16 / 9;
    const width = 10;
    const height = Math.round(width / aspectRatio);
    
    this.placeholderCanvas.width = width;
    this.placeholderCanvas.height = height;
    
    // Fill with a gradient or solid color
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return this.placeholderCanvas.toDataURL('image/jpeg', this.config.placeholderQuality);
  }  
private applyOptimizations(
    img: HTMLImageElement, 
    sources: OptimizedImageSource[], 
    placeholder?: string
  ): void {
    // Set placeholder if available
    if (placeholder && this.config.enableLazyLoading) {
      img.src = placeholder;
      img.dataset.placeholder = 'true';
    }
    
    // Create picture element for multiple sources
    if (sources.length > 1) {
      this.createPictureElement(img, sources);
    } else {
      // Single source optimization
      if (this.config.enableLazyLoading) {
        img.dataset.src = sources[0].src;
        this.lazyLoadObserver?.observe(img);
      } else {
        img.src = sources[0].src;
      }
    }
    
    // Add loading attribute for native lazy loading
    if (this.config.enableLazyLoading && 'loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }
    
    // Add decoding attribute for better performance
    if ('decoding' in HTMLImageElement.prototype) {
      img.decoding = 'async';
    }
  }

  private createPictureElement(img: HTMLImageElement, sources: OptimizedImageSource[]): void {
    // Don't create picture if already exists
    if (img.parentElement?.tagName === 'PICTURE') return;
    
    const picture = document.createElement('picture');
    
    // Add source elements (except the last one which is the fallback)
    sources.slice(0, -1).forEach(source => {
      const sourceElement = document.createElement('source');
      
      if (this.config.enableLazyLoading) {
        sourceElement.dataset.srcset = source.src;
      } else {
        sourceElement.srcset = source.src;
      }
      
      sourceElement.type = source.type;
      
      if (source.sizes) {
        sourceElement.sizes = source.sizes;
      }
      
      if (source.media) {
        sourceElement.media = source.media;
      }
      
      picture.appendChild(sourceElement);
    });
    
    // Set up the img element with fallback source
    const fallbackSource = sources[sources.length - 1];
    if (this.config.enableLazyLoading) {
      img.dataset.src = fallbackSource.src;
      this.lazyLoadObserver?.observe(img);
    } else {
      img.src = fallbackSource.src;
    }
    
    // Replace img with picture
    img.parentNode?.insertBefore(picture, img);
    picture.appendChild(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }
    
    // Load sources in picture element
    const picture = img.parentElement;
    if (picture?.tagName === 'PICTURE') {
      const sources = picture.querySelectorAll('source[data-srcset]');
      sources.forEach(source => {
        const srcset = source.getAttribute('data-srcset');
        if (srcset) {
          source.setAttribute('srcset', srcset);
          source.removeAttribute('data-srcset');
        }
      });
    }
    
    // Remove placeholder
    if (img.dataset.placeholder) {
      img.addEventListener('load', () => {
        img.removeAttribute('data-placeholder');
        img.classList.add('loaded');
      }, { once: true });
    }
  }

  private calculateMetrics(
    originalUrl: string, 
    sources: OptimizedImageSource[], 
    loadTime: number, 
    img: HTMLImageElement
  ): ImageMetrics {
    // This would need actual size measurements in a real implementation
    const estimatedOriginalSize = this.estimateImageSize(originalUrl, img);
    const estimatedOptimizedSize = estimatedOriginalSize * this.config.quality;
    
    return {
      originalSize: estimatedOriginalSize,
      optimizedSize: estimatedOptimizedSize,
      compressionRatio: estimatedOptimizedSize / estimatedOriginalSize,
      loadTime,
      format: sources[0].type,
      dimensions: {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      },
      isLazyLoaded: this.config.enableLazyLoading,
      cacheHit: loadTime < 50 // Assume cache hit if very fast
    };
  }

  private estimateImageSize(url: string, img: HTMLImageElement): number {
    // Rough estimation based on dimensions and format
    const width = img.naturalWidth || img.width || 800;
    const height = img.naturalHeight || img.height || 600;
    const pixels = width * height;
    
    // Rough bytes per pixel estimates
    const bytesPerPixel = {
      'image/jpeg': 0.5,
      'image/png': 2,
      'image/webp': 0.4,
      'image/avif': 0.3
    };
    
    const mimeType = this.getImageMimeType(url);
    const bpp = bytesPerPixel[mimeType as keyof typeof bytesPerPixel] || 0.5;
    
    return pixels * bpp;
  }

  private generateRecommendations(metrics: ImageMetrics, img: HTMLImageElement): string[] {
    const recommendations: string[] = [];
    
    if (metrics.originalSize > 500 * 1024) { // > 500KB
      recommendations.push('Consider reducing image dimensions or quality for better performance');
    }
    
    if (metrics.compressionRatio > 0.8) {
      recommendations.push('Image compression could be improved');
    }
    
    if (metrics.loadTime > 1000) {
      recommendations.push('Image loading time is slow, consider optimization or CDN');
    }
    
    if (!metrics.isLazyLoaded && !this.isAboveFold(img)) {
      recommendations.push('Enable lazy loading for below-the-fold images');
    }
    
    if (metrics.format === 'image/jpeg' && this.formatSupport.get('webp')) {
      recommendations.push('Consider using WebP format for better compression');
    }
    
    if (metrics.format === 'image/webp' && this.formatSupport.get('avif')) {
      recommendations.push('Consider using AVIF format for even better compression');
    }
    
    return recommendations;
  }

  private isAboveFold(img: HTMLImageElement): boolean {
    const rect = img.getBoundingClientRect();
    return rect.top < window.innerHeight;
  }

  private isExternalImage(url: string): boolean {
    try {
      const imageUrl = new URL(url, window.location.origin);
      return imageUrl.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }

  private getImageMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'avif':
        return 'image/avif';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg';
    }
  }

  private getExistingOptimization(img: HTMLImageElement): ImageOptimizationResult {
    const originalUrl = img.src || img.dataset.src || '';
    const metrics = this.imageMetrics.get(originalUrl);
    
    if (!metrics) {
      throw new Error('No optimization data found for image');
    }
    
    return {
      originalUrl,
      optimizedSources: [{ src: img.src, type: this.getImageMimeType(img.src) }],
      metrics,
      recommendations: []
    };
  }

  // Public API methods
  public optimizeAllImages(container?: HTMLElement): ImageOptimizationResult[] {
    const root = container || document;
    const images = root.querySelectorAll('img:not([data-optimized])') as NodeListOf<HTMLImageElement>;
    
    return Array.from(images).map(img => this.optimizeImage(img));
  }

  public getImageMetrics(url: string): ImageMetrics | undefined {
    return this.imageMetrics.get(url);
  }

  public getAllMetrics(): Map<string, ImageMetrics> {
    return new Map(this.imageMetrics);
  }

  public generateOptimizationReport(): {
    totalImages: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: number;
    averageLoadTime: number;
    formatDistribution: Record<string, number>;
    recommendations: string[];
  } {
    const metrics = Array.from(this.imageMetrics.values());
    
    const totalOriginalSize = metrics.reduce((sum, m) => sum + m.originalSize, 0);
    const totalOptimizedSize = metrics.reduce((sum, m) => sum + m.optimizedSize, 0);
    const averageCompressionRatio = metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / metrics.length || 0;
    const averageLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length || 0;
    
    const formatDistribution: Record<string, number> = {};
    metrics.forEach(m => {
      formatDistribution[m.format] = (formatDistribution[m.format] || 0) + 1;
    });
    
    const recommendations = this.generateGlobalRecommendations(metrics);
    
    return {
      totalImages: metrics.length,
      totalOriginalSize,
      totalOptimizedSize,
      averageCompressionRatio,
      averageLoadTime,
      formatDistribution,
      recommendations
    };
  }

  private generateGlobalRecommendations(metrics: ImageMetrics[]): string[] {
    const recommendations: string[] = [];
    
    const largeImages = metrics.filter(m => m.originalSize > 500 * 1024).length;
    if (largeImages > 0) {
      recommendations.push(`${largeImages} images are larger than 500KB and should be optimized`);
    }
    
    const slowImages = metrics.filter(m => m.loadTime > 1000).length;
    if (slowImages > 0) {
      recommendations.push(`${slowImages} images have slow loading times`);
    }
    
    const jpegImages = metrics.filter(m => m.format === 'image/jpeg').length;
    if (jpegImages > 0 && this.formatSupport.get('webp')) {
      recommendations.push(`Consider converting ${jpegImages} JPEG images to WebP format`);
    }
    
    const nonLazyImages = metrics.filter(m => !m.isLazyLoaded).length;
    if (nonLazyImages > 0) {
      recommendations.push(`${nonLazyImages} images could benefit from lazy loading`);
    }
    
    return recommendations;
  }

  public updateConfig(newConfig: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if lazy loading setting changed
    if (newConfig.enableLazyLoading !== undefined) {
      if (newConfig.enableLazyLoading) {
        this.setupLazyLoading();
      } else {
        this.lazyLoadObserver?.disconnect();
      }
    }
  }

  public getConfig(): ImageOptimizationConfig {
    return { ...this.config };
  }

  public getFormatSupport(): Map<string, boolean> {
    return new Map(this.formatSupport);
  }

  public clearMetrics(): void {
    this.imageMetrics.clear();
  }

  public cleanup(): void {
    this.lazyLoadObserver?.disconnect();
    this.imageMetrics.clear();
  }

  // Static utility methods
  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static calculateSavings(original: number, optimized: number): {
    bytes: number;
    percentage: number;
  } {
    const bytes = original - optimized;
    const percentage = original > 0 ? (bytes / original) * 100 : 0;
    return { bytes, percentage };
  }
}