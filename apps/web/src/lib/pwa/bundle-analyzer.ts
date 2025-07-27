// Bundle Analyzer for PWA Performance Optimization
export interface BundleInfo {
  name: string;
  size: number;
  compressedSize: number;
  loadTime: number;
  isAsync: boolean;
  isCritical: boolean;
  dependencies: string[];
  duplicates: string[];
}

export interface BundleAnalysis {
  totalSize: number;
  totalCompressedSize: number;
  bundleCount: number;
  largestBundle: BundleInfo;
  duplicateModules: string[];
  unusedCode: string[];
  recommendations: BundleRecommendation[];
  compressionRatio: number;
}

export interface BundleRecommendation {
  type: 'split' | 'lazy' | 'remove' | 'compress' | 'dedupe';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
}

export interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  modules: string[];
  parents: string[];
  children: string[];
  isEntry: boolean;
  isInitial: boolean;
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private bundles: Map<string, BundleInfo> = new Map();
  private chunks: Map<string, ChunkInfo> = new Map();
  private moduleMap: Map<string, string[]> = new Map(); // module -> bundles
  private performanceEntries: PerformanceResourceTiming[] = [];
  private sizeThresholds = {
    warning: 250 * 1024, // 250KB
    error: 500 * 1024,   // 500KB
    critical: 1024 * 1024 // 1MB
  };

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  constructor() {
    this.initializeAnalysis();
  }

  private initializeAnalysis(): void {
    if (typeof window === 'undefined') return;

    this.collectPerformanceEntries();
    this.analyzeBundles();
    this.setupContinuousMonitoring();
  }

  private collectPerformanceEntries(): void {
    if (!('performance' in window)) return;

    // Get existing entries
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.performanceEntries = entries.filter(entry => 
      entry.name.includes('.js') || entry.name.includes('.css')
    );

    // Monitor new entries
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const newEntries = list.getEntries() as PerformanceResourceTiming[];
        const relevantEntries = newEntries.filter(entry => 
          entry.name.includes('.js') || entry.name.includes('.css')
        );
        
        this.performanceEntries.push(...relevantEntries);
        relevantEntries.forEach(entry => this.analyzeResourceEntry(entry));
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private analyzeBundles(): void {
    this.performanceEntries.forEach(entry => {
      this.analyzeResourceEntry(entry);
    });
  }

  private analyzeResourceEntry(entry: PerformanceResourceTiming): void {
    const bundleName = this.extractBundleName(entry.name);
    const size = entry.transferSize || entry.decodedBodySize || 0;
    const compressedSize = entry.encodedBodySize || size;
    const loadTime = entry.responseEnd - entry.startTime;

    const bundleInfo: BundleInfo = {
      name: bundleName,
      size,
      compressedSize,
      loadTime,
      isAsync: this.isAsyncBundle(entry.name),
      isCritical: this.isCriticalBundle(entry.name),
      dependencies: this.extractDependencies(entry.name),
      duplicates: []
    };

    this.bundles.set(bundleName, bundleInfo);
    this.checkBundleSize(bundleInfo);
  }

  private extractBundleName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query parameters
  }

  private isAsyncBundle(url: string): boolean {
    // Check if bundle is loaded asynchronously
    return url.includes('chunk') || url.includes('async') || !this.isCriticalBundle(url);
  }

  private isCriticalBundle(url: string): boolean {
    // Determine if bundle is critical for initial page load
    const criticalPatterns = [
      'main',
      'runtime',
      'vendor',
      'polyfills',
      'framework'
    ];
    
    return criticalPatterns.some(pattern => url.includes(pattern));
  }

  private extractDependencies(url: string): string[] {
    // This would need to be enhanced with actual dependency analysis
    // For now, return empty array
    return [];
  }

  private checkBundleSize(bundle: BundleInfo): void {
    if (bundle.size > this.sizeThresholds.critical) {
      console.error(`🚨 Critical: Bundle ${bundle.name} is ${this.formatBytes(bundle.size)} (>${this.formatBytes(this.sizeThresholds.critical)})`);
      this.createSizeAlert(bundle, 'critical');
    } else if (bundle.size > this.sizeThresholds.error) {
      console.warn(`⚠️ Warning: Bundle ${bundle.name} is ${this.formatBytes(bundle.size)} (>${this.formatBytes(this.sizeThresholds.error)})`);
      this.createSizeAlert(bundle, 'error');
    } else if (bundle.size > this.sizeThresholds.warning) {
      console.info(`ℹ️ Info: Bundle ${bundle.name} is ${this.formatBytes(bundle.size)} (>${this.formatBytes(this.sizeThresholds.warning)})`);
      this.createSizeAlert(bundle, 'warning');
    }
  }

  private createSizeAlert(bundle: BundleInfo, level: 'warning' | 'error' | 'critical'): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'BUNDLE_SIZE_ALERT',
        payload: {
          bundle: bundle.name,
          size: bundle.size,
          level,
          timestamp: Date.now()
        }
      });
    }
  }

  private setupContinuousMonitoring(): void {
    // Monitor bundle loading patterns
    setInterval(() => {
      this.analyzeLoadingPatterns();
      this.detectDuplicates();
      this.identifyUnusedCode();
    }, 30000); // Every 30 seconds
  } 
 private analyzeLoadingPatterns(): void {
    const bundles = Array.from(this.bundles.values());
    
    // Identify slow-loading bundles
    const slowBundles = bundles.filter(bundle => bundle.loadTime > 2000);
    if (slowBundles.length > 0) {
      console.log('🐌 Slow loading bundles detected:', slowBundles.map(b => b.name));
    }

    // Identify large critical bundles
    const largeCriticalBundles = bundles.filter(bundle => 
      bundle.isCritical && bundle.size > this.sizeThresholds.warning
    );
    
    if (largeCriticalBundles.length > 0) {
      console.log('📦 Large critical bundles:', largeCriticalBundles.map(b => `${b.name} (${this.formatBytes(b.size)})`));
    }
  }

  private detectDuplicates(): void {
    // This would need enhanced implementation with actual module analysis
    // For now, detect potential duplicates based on naming patterns
    const bundleNames = Array.from(this.bundles.keys());
    const potentialDuplicates: string[] = [];

    bundleNames.forEach(name => {
      const baseName = name.replace(/\.[a-f0-9]+\./, '.'); // Remove hash
      const similar = bundleNames.filter(n => n !== name && n.includes(baseName.split('.')[0]));
      
      if (similar.length > 0) {
        potentialDuplicates.push(name);
      }
    });

    if (potentialDuplicates.length > 0) {
      console.log('🔄 Potential duplicate modules:', potentialDuplicates);
    }
  }

  private identifyUnusedCode(): void {
    // This would need integration with coverage API
    if ('coverage' in window) {
      // Placeholder for unused code detection
      console.log('🗑️ Analyzing unused code...');
    }
  }

  public generateAnalysis(): BundleAnalysis {
    const bundles = Array.from(this.bundles.values());
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const totalCompressedSize = bundles.reduce((sum, bundle) => sum + bundle.compressedSize, 0);
    const largestBundle = bundles.reduce((largest, current) => 
      current.size > largest.size ? current : largest, bundles[0]
    );

    const duplicateModules = this.findDuplicateModules();
    const unusedCode = this.findUnusedCode();
    const recommendations = this.generateRecommendations(bundles);

    return {
      totalSize,
      totalCompressedSize,
      bundleCount: bundles.length,
      largestBundle,
      duplicateModules,
      unusedCode,
      recommendations,
      compressionRatio: totalSize > 0 ? totalCompressedSize / totalSize : 1
    };
  }

  private findDuplicateModules(): string[] {
    // Enhanced duplicate detection would go here
    return [];
  }

  private findUnusedCode(): string[] {
    // Enhanced unused code detection would go here
    return [];
  }

  private generateRecommendations(bundles: BundleInfo[]): BundleRecommendation[] {
    const recommendations: BundleRecommendation[] = [];

    // Check for large bundles that should be split
    bundles.forEach(bundle => {
      if (bundle.size > this.sizeThresholds.error && !bundle.isAsync) {
        recommendations.push({
          type: 'split',
          priority: 'high',
          description: `Split large bundle ${bundle.name} (${this.formatBytes(bundle.size)}) into smaller chunks`,
          estimatedSavings: bundle.size * 0.3, // Estimated 30% improvement
          implementation: 'Use dynamic imports or code splitting techniques'
        });
      }

      if (!bundle.isCritical && !bundle.isAsync) {
        recommendations.push({
          type: 'lazy',
          priority: 'medium',
          description: `Make non-critical bundle ${bundle.name} load lazily`,
          estimatedSavings: bundle.loadTime * 0.5,
          implementation: 'Convert to dynamic import or lazy loading'
        });
      }
    });

    // Check compression ratio
    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const totalCompressed = bundles.reduce((sum, b) => sum + b.compressedSize, 0);
    const compressionRatio = totalSize > 0 ? totalCompressed / totalSize : 1;

    if (compressionRatio > 0.7) {
      recommendations.push({
        type: 'compress',
        priority: 'medium',
        description: 'Improve compression ratio for better performance',
        estimatedSavings: totalSize * 0.2,
        implementation: 'Enable gzip/brotli compression and minification'
      });
    }

    // Check for too many small bundles
    const smallBundles = bundles.filter(b => b.size < 10 * 1024); // < 10KB
    if (smallBundles.length > 5) {
      recommendations.push({
        type: 'dedupe',
        priority: 'low',
        description: `Consider combining ${smallBundles.length} small bundles`,
        estimatedSavings: smallBundles.length * 1000, // Estimated overhead reduction
        implementation: 'Combine small bundles or adjust chunk splitting strategy'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  public getBundleInfo(bundleName: string): BundleInfo | undefined {
    return this.bundles.get(bundleName);
  }

  public getAllBundles(): BundleInfo[] {
    return Array.from(this.bundles.values());
  }

  public getCriticalBundles(): BundleInfo[] {
    return Array.from(this.bundles.values()).filter(bundle => bundle.isCritical);
  }

  public getAsyncBundles(): BundleInfo[] {
    return Array.from(this.bundles.values()).filter(bundle => bundle.isAsync);
  }

  public getLargeBundles(threshold: number = this.sizeThresholds.warning): BundleInfo[] {
    return Array.from(this.bundles.values()).filter(bundle => bundle.size > threshold);
  }

  public updateThresholds(thresholds: Partial<typeof this.sizeThresholds>): void {
    this.sizeThresholds = { ...this.sizeThresholds, ...thresholds };
  }

  public getThresholds(): typeof this.sizeThresholds {
    return { ...this.sizeThresholds };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public exportAnalysis(): any {
    return {
      timestamp: new Date().toISOString(),
      analysis: this.generateAnalysis(),
      bundles: Array.from(this.bundles.values()),
      thresholds: this.sizeThresholds
    };
  }

  public clearData(): void {
    this.bundles.clear();
    this.chunks.clear();
    this.moduleMap.clear();
    this.performanceEntries = [];
  }
}