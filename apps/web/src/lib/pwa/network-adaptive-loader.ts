/**
 * Network Adaptive Loader
 * Implements adaptive loading strategies based on network conditions
 */

export interface NetworkConditions {
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // milliseconds
  saveData: boolean;
  online: boolean;
  stability: number; // 0-1, connection stability score
}

export interface LoadingStrategy {
  name: string;
  priority: number;
  conditions: (network: NetworkConditions) => boolean;
  imageQuality: number; // 0-1
  videoQuality: 'low' | 'medium' | 'high' | 'auto';
  enableLazyLoading: boolean;
  enablePrefetching: boolean;
  maxConcurrentRequests: number;
  chunkSize: number; // bytes
  enableCompression: boolean;
  enableCaching: boolean;
  timeoutMs: number;
}

export interface AdaptiveLoadingConfig {
  enableNetworkDetection: boolean;
  enableAdaptiveImages: boolean;
  enableAdaptiveVideos: boolean;
  enableProgressiveLoading: boolean;
  enableOfflineSupport: boolean;
  strategies: LoadingStrategy[];
  fallbackStrategy: LoadingStrategy;
  monitoringInterval: number;
}

export interface LoadingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLoadTime: number;
  bandwidthSaved: number;
  cacheHitRatio: number;
  adaptationCount: number;
  currentStrategy: string;
}

export interface LoadingRequest {
  id: string;
  url: string;
  type: 'image' | 'video' | 'script' | 'style' | 'font' | 'data';
  priority: 'high' | 'medium' | 'low';
  size?: number;
  quality?: number;
  progressive?: boolean;
  retries: number;
  maxRetries: number;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'loading' | 'completed' | 'failed' | 'cancelled';
}

export class NetworkAdaptiveLoader {
  private config: AdaptiveLoadingConfig;
  private currentNetwork: NetworkConditions;
  private currentStrategy: LoadingStrategy;
  private metrics: LoadingMetrics;
  private loadingQueue: Map<string, LoadingRequest> = new Map();
  private activeRequests: Map<string, AbortController> = new Map();
  private networkHistory: NetworkConditions[] = [];
  
  private networkObserver?: any;
  private monitoringInterval?: NodeJS.Timeout;
  private strategyCallbacks: ((strategy: LoadingStrategy) => void)[] = [];

  constructor(config: Partial<AdaptiveLoadingConfig> = {}) {
    this.config = {
      enableNetworkDetection: true,
      enableAdaptiveImages: true,
      enableAdaptiveVideos: true,
      enableProgressiveLoading: true,
      enableOfflineSupport: true,
      strategies: this.createDefaultStrategies(),
      fallbackStrategy: this.createFallbackStrategy(),
      monitoringInterval: 5000,
      ...config
    };

    this.currentNetwork = this.detectNetworkConditions();
    this.currentStrategy = this.selectOptimalStrategy();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLoadTime: 0,
      bandwidthSaved: 0,
      cacheHitRatio: 0,
      adaptationCount: 0,
      currentStrategy: this.currentStrategy.name
    };

    this.initialize();
  }

  /**
   * Initialize network adaptive loader
   */
  private initialize(): void {
    if (this.config.enableNetworkDetection) {
      this.setupNetworkMonitoring();
    }

    this.startAdaptiveLoading();
    console.log('Network adaptive loader initialized', {
      strategy: this.currentStrategy.name,
      network: this.currentNetwork.effectiveType
    });
  }

  /**
   * Load resource with adaptive strategy
   */
  async loadResource(
    url: string,
    options: {
      type?: LoadingRequest['type'];
      priority?: LoadingRequest['priority'];
      quality?: number;
      progressive?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<Response> {
    const request: LoadingRequest = {
      id: this.generateRequestId(),
      url,
      type: options.type || 'data',
      priority: options.priority || 'medium',
      quality: options.quality,
      progressive: options.progressive || false,
      retries: 0,
      maxRetries: options.maxRetries || 3,
      startTime: Date.now(),
      status: 'pending'
    };

    this.loadingQueue.set(request.id, request);
    this.metrics.totalRequests++;

    try {
      const response = await this.executeLoadingRequest(request);
      request.status = 'completed';
      request.endTime = Date.now();
      
      this.updateMetrics(request, true);
      return response;
      
    } catch (error) {
      request.status = 'failed';
      request.endTime = Date.now();
      
      this.updateMetrics(request, false);
      
      // Retry with fallback strategy if needed
      if (request.retries < request.maxRetries) {
        return this.retryWithFallback(request);
      }
      
      throw error;
    } finally {
      this.loadingQueue.delete(request.id);
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Load image with adaptive quality
   */
  async loadAdaptiveImage(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      lazy?: boolean;
    } = {}
  ): Promise<HTMLImageElement> {
    if (!this.config.enableAdaptiveImages) {
      return this.loadStandardImage(url);
    }

    const adaptedUrl = this.adaptImageUrl(url, options);
    const response = await this.loadResource(adaptedUrl, {
      type: 'image',
      priority: options.lazy ? 'low' : 'medium'
    });

    return this.createImageFromResponse(response);
  }

  /**
   * Load video with adaptive quality
   */
  async loadAdaptiveVideo(
    url: string,
    options: {
      quality?: 'low' | 'medium' | 'high' | 'auto';
      preload?: 'none' | 'metadata' | 'auto';
    } = {}
  ): Promise<HTMLVideoElement> {
    if (!this.config.enableAdaptiveVideos) {
      return this.loadStandardVideo(url);
    }

    const adaptedUrl = this.adaptVideoUrl(url, options);
    const response = await this.loadResource(adaptedUrl, {
      type: 'video',
      priority: 'medium'
    });

    return this.createVideoFromResponse(response, options);
  }

  /**
   * Prefetch resources based on network conditions
   */
  async prefetchResources(urls: string[], priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    if (!this.currentStrategy.enablePrefetching) {
      console.log('Prefetching disabled for current network conditions');
      return;
    }

    const prefetchPromises = urls.map(url => 
      this.loadResource(url, { priority, type: 'data' })
        .catch(error => console.warn(`Prefetch failed for ${url}:`, error))
    );

    await Promise.all(prefetchPromises);
  }

  /**
   * Get current network conditions
   */
  getCurrentNetwork(): NetworkConditions {
    return { ...this.currentNetwork };
  }

  /**
   * Get current loading strategy
   */
  getCurrentStrategy(): LoadingStrategy {
    return { ...this.currentStrategy };
  }

  /**
   * Get loading metrics
   */
  getMetrics(): LoadingMetrics {
    return { ...this.metrics };
  }

  /**
   * Add strategy change callback
   */
  onStrategyChange(callback: (strategy: LoadingStrategy) => void): void {
    this.strategyCallbacks.push(callback);
  }

  /**
   * Cancel loading request
   */
  cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }

    const request = this.loadingQueue.get(requestId);
    if (request) {
      request.status = 'cancelled';
      this.loadingQueue.delete(requestId);
    }
  }

  /**
   * Get network recommendations
   */
  getNetworkRecommendations(): string[] {
    const recommendations: string[] = [];
    const network = this.currentNetwork;

    if (network.saveData) {
      recommendations.push('Data saver mode is enabled - using optimized loading');
    }

    if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
      recommendations.push('Slow network detected - enabling aggressive optimization');
    }

    if (network.rtt > 500) {
      recommendations.push('High latency detected - reducing concurrent requests');
    }

    if (network.downlink < 1) {
      recommendations.push('Low bandwidth detected - compressing resources');
    }

    if (!network.online) {
      recommendations.push('Offline mode - serving cached content only');
    }

    return recommendations;
  }

  // Private methods

  private async executeLoadingRequest(request: LoadingRequest): Promise<Response> {
    request.status = 'loading';
    
    // Create abort controller for this request
    const controller = new AbortController();
    this.activeRequests.set(request.id, controller);

    // Apply current strategy settings
    const fetchOptions: RequestInit = {
      signal: controller.signal,
      cache: this.currentStrategy.enableCaching ? 'default' : 'no-cache'
    };

    // Add compression headers if enabled
    if (this.currentStrategy.enableCompression) {
      fetchOptions.headers = {
        'Accept-Encoding': 'gzip, deflate, br'
      };
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.currentStrategy.timeoutMs);

    try {
      let url = request.url;
      
      // Apply quality adaptations based on request type
      if (request.type === 'image' && this.config.enableAdaptiveImages) {
        url = this.adaptImageUrl(url, { quality: request.quality });
      } else if (request.type === 'video' && this.config.enableAdaptiveVideos) {
        url = this.adaptVideoUrl(url, { quality: this.currentStrategy.videoQuality });
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout or cancelled');
      }
      
      throw error;
    }
  }

  private async retryWithFallback(request: LoadingRequest): Promise<Response> {
    request.retries++;
    console.log(`Retrying request ${request.id} with fallback strategy (attempt ${request.retries})`);

    // Temporarily use fallback strategy
    const originalStrategy = this.currentStrategy;
    this.currentStrategy = this.config.fallbackStrategy;

    try {
      const response = await this.executeLoadingRequest(request);
      this.currentStrategy = originalStrategy;
      return response;
    } catch (error) {
      this.currentStrategy = originalStrategy;
      throw error;
    }
  }

  private adaptImageUrl(url: string, options: any = {}): string {
    const strategy = this.currentStrategy;
    const network = this.currentNetwork;
    
    // Don't modify external URLs
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      return url;
    }

    const params = new URLSearchParams();
    
    // Apply quality based on network conditions
    let quality = options.quality || strategy.imageQuality;
    if (network.saveData || network.effectiveType === '2g') {
      quality = Math.min(quality, 0.4);
    }
    
    if (quality < 1) {
      params.set('q', Math.round(quality * 100).toString());
    }

    // Apply format optimization
    if (this.supportsWebP() && !options.format) {
      params.set('f', 'webp');
    } else if (options.format) {
      params.set('f', options.format);
    }

    // Apply size constraints
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());

    // Add progressive loading for slow networks
    if (network.effectiveType === '2g' || network.effectiveType === '3g') {
      params.set('progressive', 'true');
    }

    const separator = url.includes('?') ? '&' : '?';
    return params.toString() ? `${url}${separator}${params.toString()}` : url;
  }

  private adaptVideoUrl(url: string, options: any = {}): string {
    const strategy = this.currentStrategy;
    const network = this.currentNetwork;
    
    // Don't modify external URLs
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      return url;
    }

    const params = new URLSearchParams();
    
    // Determine quality based on network conditions
    let quality = options.quality || strategy.videoQuality;
    if (quality === 'auto') {
      if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
        quality = 'low';
      } else if (network.effectiveType === '3g') {
        quality = 'medium';
      } else {
        quality = 'high';
      }
    }
    
    params.set('quality', quality);

    // Add adaptive bitrate for slow networks
    if (network.downlink < 2) {
      params.set('abr', 'true');
    }

    const separator = url.includes('?') ? '&' : '?';
    return params.toString() ? `${url}${separator}${params.toString()}` : url;
  }

  private async loadStandardImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private async loadStandardVideo(url: string): Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.src = url;
    return video;
  }

  private async createImageFromResponse(response: Response): Promise<HTMLImageElement> {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  private async createVideoFromResponse(response: Response, options: any = {}): Promise<HTMLVideoElement> {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const video = document.createElement('video');
    video.src = url;
    video.preload = options.preload || 'metadata';
    
    return video;
  }

  private detectNetworkConditions(): NetworkConditions {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    let conditions: NetworkConditions = {
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 1,
      rtt: 100,
      saveData: false,
      online: navigator.onLine,
      stability: 1
    };

    if (connection) {
      conditions = {
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 1,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false,
        online: navigator.onLine,
        stability: this.calculateNetworkStability()
      };
    }

    return conditions;
  }

  private calculateNetworkStability(): number {
    if (this.networkHistory.length < 3) return 1;

    // Calculate stability based on recent network changes
    const recent = this.networkHistory.slice(-5);
    const variations = recent.reduce((acc, curr, index) => {
      if (index === 0) return acc;
      const prev = recent[index - 1];
      const downlinkChange = Math.abs(curr.downlink - prev.downlink) / prev.downlink;
      const rttChange = Math.abs(curr.rtt - prev.rtt) / prev.rtt;
      return acc + downlinkChange + rttChange;
    }, 0);

    return Math.max(0, 1 - (variations / recent.length));
  }

  private selectOptimalStrategy(): LoadingStrategy {
    const network = this.currentNetwork;
    
    // Find strategy that matches current network conditions
    const matchingStrategy = this.config.strategies.find(strategy => 
      strategy.conditions(network)
    );

    return matchingStrategy || this.config.fallbackStrategy;
  }

  private setupNetworkMonitoring(): void {
    // Monitor network changes
    window.addEventListener('online', () => {
      this.currentNetwork.online = true;
      this.adaptToNetworkChange();
    });

    window.addEventListener('offline', () => {
      this.currentNetwork.online = false;
      this.adaptToNetworkChange();
    });

    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.currentNetwork = this.detectNetworkConditions();
        this.adaptToNetworkChange();
      });
    }

    // Periodic network monitoring
    this.monitoringInterval = setInterval(() => {
      const newConditions = this.detectNetworkConditions();
      
      // Store in history
      this.networkHistory.push(newConditions);
      if (this.networkHistory.length > 10) {
        this.networkHistory = this.networkHistory.slice(-10);
      }

      // Check if significant change occurred
      if (this.hasSignificantNetworkChange(this.currentNetwork, newConditions)) {
        this.currentNetwork = newConditions;
        this.adaptToNetworkChange();
      }
    }, this.config.monitoringInterval);
  }

  private hasSignificantNetworkChange(old: NetworkConditions, new_: NetworkConditions): boolean {
    return (
      old.effectiveType !== new_.effectiveType ||
      Math.abs(old.downlink - new_.downlink) > 0.5 ||
      Math.abs(old.rtt - new_.rtt) > 50 ||
      old.saveData !== new_.saveData
    );
  }

  private adaptToNetworkChange(): void {
    const newStrategy = this.selectOptimalStrategy();
    
    if (newStrategy.name !== this.currentStrategy.name) {
      console.log(`Network strategy changed: ${this.currentStrategy.name} → ${newStrategy.name}`);
      
      this.currentStrategy = newStrategy;
      this.metrics.adaptationCount++;
      this.metrics.currentStrategy = newStrategy.name;
      
      // Notify callbacks
      this.notifyStrategyCallbacks(newStrategy);
    }
  }

  private startAdaptiveLoading(): void {
    // Initial strategy application
    this.notifyStrategyCallbacks(this.currentStrategy);
  }

  private notifyStrategyCallbacks(strategy: LoadingStrategy): void {
    this.strategyCallbacks.forEach(callback => {
      try {
        callback(strategy);
      } catch (error) {
        console.error('Error in strategy callback:', error);
      }
    });
  }

  private updateMetrics(request: LoadingRequest, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average load time
    if (request.endTime) {
      const loadTime = request.endTime - request.startTime;
      this.metrics.averageLoadTime = 
        (this.metrics.averageLoadTime * (this.metrics.totalRequests - 1) + loadTime) / 
        this.metrics.totalRequests;
    }

    // Update cache hit ratio (simplified)
    // This would integrate with actual cache monitoring
    this.metrics.cacheHitRatio = this.metrics.successfulRequests / this.metrics.totalRequests;
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createDefaultStrategies(): LoadingStrategy[] {
    return [
      // High-speed network strategy
      {
        name: 'High-Speed Network',
        priority: 1,
        conditions: (network) => 
          network.effectiveType === '4g' || network.effectiveType === '5g' && 
          network.downlink > 5 && !network.saveData,
        imageQuality: 0.9,
        videoQuality: 'high',
        enableLazyLoading: false,
        enablePrefetching: true,
        maxConcurrentRequests: 8,
        chunkSize: 1024 * 1024, // 1MB
        enableCompression: true,
        enableCaching: true,
        timeoutMs: 10000
      },
      
      // Medium-speed network strategy
      {
        name: 'Medium-Speed Network',
        priority: 2,
        conditions: (network) => 
          network.effectiveType === '3g' || 
          (network.effectiveType === '4g' && network.downlink <= 5),
        imageQuality: 0.7,
        videoQuality: 'medium',
        enableLazyLoading: true,
        enablePrefetching: false,
        maxConcurrentRequests: 4,
        chunkSize: 512 * 1024, // 512KB
        enableCompression: true,
        enableCaching: true,
        timeoutMs: 15000
      },
      
      // Slow network strategy
      {
        name: 'Slow Network',
        priority: 3,
        conditions: (network) => 
          network.effectiveType === '2g' || network.effectiveType === 'slow-2g' ||
          network.saveData || network.downlink < 1,
        imageQuality: 0.4,
        videoQuality: 'low',
        enableLazyLoading: true,
        enablePrefetching: false,
        maxConcurrentRequests: 2,
        chunkSize: 128 * 1024, // 128KB
        enableCompression: true,
        enableCaching: true,
        timeoutMs: 30000
      }
    ];
  }

  private createFallbackStrategy(): LoadingStrategy {
    return {
      name: 'Fallback Strategy',
      priority: 999,
      conditions: () => true,
      imageQuality: 0.5,
      videoQuality: 'medium',
      enableLazyLoading: true,
      enablePrefetching: false,
      maxConcurrentRequests: 3,
      chunkSize: 256 * 1024, // 256KB
      enableCompression: true,
      enableCaching: true,
      timeoutMs: 20000
    };
  }

  /**
   * Destroy network adaptive loader
   */
  destroy(): void {
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Cancel all active requests
    this.activeRequests.forEach(controller => {
      controller.abort();
    });

    // Clear data
    this.loadingQueue.clear();
    this.activeRequests.clear();
    this.networkHistory = [];
    this.strategyCallbacks = [];

    console.log('Network adaptive loader destroyed');
  }
}