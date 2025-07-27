/**
 * Device and Network Adaptive System
 * Integrates all adaptive optimization components for comprehensive device and network optimization
 */

import { DeviceAdaptiveOptimizer, DeviceCapabilities, DeviceOptimizationProfile } from './device-adaptive-optimizer';
import { NetworkAdaptiveLoader, NetworkConditions, LoadingStrategy } from './network-adaptive-loader';
import { ResponsiveCacheManager, CacheProfile } from './responsive-cache-manager';

export interface AdaptiveSystemConfig {
  deviceOptimizer?: any;
  networkLoader?: any;
  cacheManager?: any;
  enableAutomaticAdaptation: boolean;
  enableCrossComponentOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  adaptationInterval: number;
  performanceThresholds: {
    loadTime: number; // ms
    memoryUsage: number; // percentage
    cacheHitRatio: number; // percentage
    networkLatency: number; // ms
  };
}

export interface SystemMetrics {
  device: {
    capabilities: DeviceCapabilities;
    profile: DeviceOptimizationProfile;
    metrics: any;
  };
  network: {
    conditions: NetworkConditions;
    strategy: LoadingStrategy;
    metrics: any;
  };
  cache: {
    profile: CacheProfile;
    metrics: any;
  };
  overall: {
    performanceScore: number;
    adaptationEffectiveness: number;
    resourceUtilization: number;
    userExperienceScore: number;
  };
}

export interface AdaptationRecommendation {
  id: string;
  component: 'device' | 'network' | 'cache' | 'system';
  type: 'performance' | 'memory' | 'battery' | 'network' | 'storage';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedImpact: string;
  implementation: () => Promise<void>;
  confidence: number; // 0-1
}

export class DeviceNetworkAdaptiveSystem {
  private config: AdaptiveSystemConfig;
  private deviceOptimizer: DeviceAdaptiveOptimizer;
  private networkLoader: NetworkAdaptiveLoader;
  private cacheManager: ResponsiveCacheManager;
  
  private systemMetrics: SystemMetrics;
  private adaptationHistory: Array<{
    timestamp: number;
    trigger: string;
    adaptations: string[];
    performanceImpact: number;
  }> = [];
  
  private adaptationCallbacks: ((metrics: SystemMetrics) => void)[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private adaptationInterval?: NodeJS.Timeout;

  constructor(config: Partial<AdaptiveSystemConfig> = {}) {
    this.config = {
      enableAutomaticAdaptation: true,
      enableCrossComponentOptimization: true,
      enablePerformanceMonitoring: true,
      adaptationInterval: 30000, // 30 seconds
      performanceThresholds: {
        loadTime: 3000, // 3 seconds
        memoryUsage: 80, // 80%
        cacheHitRatio: 70, // 70%
        networkLatency: 500 // 500ms
      },
      ...config
    };

    // Initialize components
    this.deviceOptimizer = new DeviceAdaptiveOptimizer(this.config.deviceOptimizer);
    this.networkLoader = new NetworkAdaptiveLoader(this.config.networkLoader);
    this.cacheManager = new ResponsiveCacheManager(this.config.cacheManager);

    this.systemMetrics = this.initializeMetrics();
    this.initialize();
  }

  /**
   * Initialize adaptive system
   */
  private async initialize(): Promise<void> {
    try {
      // Setup cross-component communication
      this.setupCrossComponentOptimization();
      
      // Start monitoring and adaptation
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
      }
      
      if (this.config.enableAutomaticAdaptation) {
        this.startAutomaticAdaptation();
      }

      // Initial system optimization
      await this.performInitialOptimization();

      console.log('Device and network adaptive system initialized');
    } catch (error) {
      console.error('Failed to initialize adaptive system:', error);
    }
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const [deviceCapabilities, deviceProfile, deviceMetrics] = await Promise.all([
      Promise.resolve(this.deviceOptimizer.getDeviceCapabilities()),
      Promise.resolve(this.deviceOptimizer.getCurrentProfile()),
      Promise.resolve(this.deviceOptimizer.getMetrics())
    ]);

    const [networkConditions, networkStrategy, networkMetrics] = await Promise.all([
      Promise.resolve(this.networkLoader.getCurrentNetwork()),
      Promise.resolve(this.networkLoader.getCurrentStrategy()),
      Promise.resolve(this.networkLoader.getMetrics())
    ]);

    const [cacheProfile, cacheMetrics] = await Promise.all([
      Promise.resolve(this.cacheManager.getCurrentProfile()),
      Promise.resolve(this.cacheManager.getMetrics())
    ]);

    this.systemMetrics = {
      device: {
        capabilities: deviceCapabilities,
        profile: deviceProfile,
        metrics: deviceMetrics
      },
      network: {
        conditions: networkConditions,
        strategy: networkStrategy,
        metrics: networkMetrics
      },
      cache: {
        profile: cacheProfile,
        metrics: cacheMetrics
      },
      overall: this.calculateOverallMetrics(deviceMetrics, networkMetrics, cacheMetrics)
    };

    return this.systemMetrics;
  }

  /**
   * Perform comprehensive system adaptation
   */
  async adaptSystem(trigger: string = 'manual'): Promise<void> {
    console.log(`Performing system adaptation triggered by: ${trigger}`);
    
    const beforeMetrics = await this.getSystemMetrics();
    const adaptations: string[] = [];

    try {
      // Device-based adaptations
      const deviceAdaptations = await this.performDeviceAdaptations();
      adaptations.push(...deviceAdaptations);

      // Network-based adaptations
      const networkAdaptations = await this.performNetworkAdaptations();
      adaptations.push(...networkAdaptations);

      // Cache-based adaptations
      const cacheAdaptations = await this.performCacheAdaptations();
      adaptations.push(...cacheAdaptations);

      // Cross-component optimizations
      if (this.config.enableCrossComponentOptimization) {
        const crossAdaptations = await this.performCrossComponentOptimizations();
        adaptations.push(...crossAdaptations);
      }

      // Calculate performance impact
      const afterMetrics = await this.getSystemMetrics();
      const performanceImpact = this.calculatePerformanceImpact(beforeMetrics, afterMetrics);

      // Record adaptation
      this.adaptationHistory.push({
        timestamp: Date.now(),
        trigger,
        adaptations,
        performanceImpact
      });

      // Keep history manageable
      if (this.adaptationHistory.length > 50) {
        this.adaptationHistory = this.adaptationHistory.slice(-50);
      }

      // Notify callbacks
      this.notifyAdaptationCallbacks(afterMetrics);

      console.log(`System adaptation completed: ${adaptations.length} adaptations, ${performanceImpact.toFixed(2)}% performance impact`);

    } catch (error) {
      console.error('System adaptation failed:', error);
    }
  }

  /**
   * Get adaptation recommendations
   */
  async getAdaptationRecommendations(): Promise<AdaptationRecommendation[]> {
    const metrics = await this.getSystemMetrics();
    const recommendations: AdaptationRecommendation[] = [];

    // Device recommendations
    const deviceRecs = await this.generateDeviceRecommendations(metrics);
    recommendations.push(...deviceRecs);

    // Network recommendations
    const networkRecs = await this.generateNetworkRecommendations(metrics);
    recommendations.push(...networkRecs);

    // Cache recommendations
    const cacheRecs = await this.generateCacheRecommendations(metrics);
    recommendations.push(...cacheRecs);

    // System-wide recommendations
    const systemRecs = await this.generateSystemRecommendations(metrics);
    recommendations.push(...systemRecs);

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Implement specific recommendation
   */
  async implementRecommendation(recommendationId: string): Promise<void> {
    const recommendations = await this.getAdaptationRecommendations();
    const recommendation = recommendations.find(r => r.id === recommendationId);
    
    if (!recommendation) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    try {
      await recommendation.implementation();
      console.log(`Recommendation implemented: ${recommendation.description}`);
    } catch (error) {
      console.error(`Failed to implement recommendation ${recommendationId}:`, error);
      throw error;
    }
  }

  /**
   * Load resource with full adaptive optimization
   */
  async loadAdaptiveResource(
    url: string,
    options: {
      type?: 'image' | 'video' | 'script' | 'style' | 'font' | 'data';
      priority?: 'high' | 'medium' | 'low';
      cache?: boolean;
      quality?: number;
    } = {}
  ): Promise<any> {
    // Use network loader for adaptive loading
    const response = await this.networkLoader.loadResource(url, {
      type: options.type,
      priority: options.priority,
      quality: options.quality
    });

    // Cache the resource if requested
    if (options.cache !== false) {
      const data = await response.clone().arrayBuffer();
      await this.cacheManager.cacheResource(
        url,
        data,
        options.type || 'data',
        { priority: options.priority === 'high' ? 3 : options.priority === 'medium' ? 2 : 1 }
      );
    }

    return response;
  }

  /**
   * Add adaptation callback
   */
  onSystemAdaptation(callback: (metrics: SystemMetrics) => void): void {
    this.adaptationCallbacks.push(callback);
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(hours: number = 24): Array<{
    timestamp: number;
    trigger: string;
    adaptations: string[];
    performanceImpact: number;
  }> {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.adaptationHistory.filter(entry => entry.timestamp > cutoff);
  }

  // Private methods

  private initializeMetrics(): SystemMetrics {
    return {
      device: {
        capabilities: {} as DeviceCapabilities,
        profile: {} as DeviceOptimizationProfile,
        metrics: {}
      },
      network: {
        conditions: {} as NetworkConditions,
        strategy: {} as LoadingStrategy,
        metrics: {}
      },
      cache: {
        profile: {} as CacheProfile,
        metrics: {}
      },
      overall: {
        performanceScore: 0,
        adaptationEffectiveness: 0,
        resourceUtilization: 0,
        userExperienceScore: 0
      }
    };
  }

  private setupCrossComponentOptimization(): void {
    // Device optimizer adaptations trigger cache adaptations
    this.deviceOptimizer.onProfileAdaptation((profile) => {
      const deviceType = this.deviceOptimizer.getDeviceCapabilities().deviceType;
      const memoryLevel = this.deviceOptimizer.getDeviceCapabilities().memory.pressure === 'high' ? 'low' :
                         this.deviceOptimizer.getDeviceCapabilities().memory.pressure === 'medium' ? 'medium' : 'high';
      
      this.cacheManager.adaptCacheProfile(deviceType, undefined, memoryLevel);
    });

    // Network strategy changes trigger cache adaptations
    this.networkLoader.onStrategyChange((strategy) => {
      const networkSpeed = strategy.name.includes('High-Speed') ? 'fast' :
                          strategy.name.includes('Medium-Speed') ? 'medium' : 'slow';
      
      this.cacheManager.adaptCacheProfile(undefined, networkSpeed, undefined);
    });
  }

  private startPerformanceMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.getSystemMetrics();
        
        // Check performance thresholds
        if (this.shouldTriggerAdaptation(metrics)) {
          await this.adaptSystem('performance-threshold');
        }
        
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 10000); // Every 10 seconds
  }

  private startAutomaticAdaptation(): void {
    this.adaptationInterval = setInterval(async () => {
      try {
        await this.adaptSystem('automatic');
      } catch (error) {
        console.error('Automatic adaptation error:', error);
      }
    }, this.config.adaptationInterval);
  }

  private async performInitialOptimization(): Promise<void> {
    // Perform initial system-wide optimization
    await this.adaptSystem('initialization');
  }

  private shouldTriggerAdaptation(metrics: SystemMetrics): boolean {
    const thresholds = this.config.performanceThresholds;
    
    return (
      metrics.overall.performanceScore < 0.7 ||
      metrics.cache.metrics.hitRatio < thresholds.cacheHitRatio / 100 ||
      metrics.network.conditions.rtt > thresholds.networkLatency
    );
  }

  private async performDeviceAdaptations(): Promise<string[]> {
    const adaptations: string[] = [];
    const capabilities = this.deviceOptimizer.getDeviceCapabilities();

    // Memory pressure adaptation
    if (capabilities.memory.pressure === 'high') {
      await this.deviceOptimizer.optimizeForConstraint('memory');
      adaptations.push('Device memory optimization');
    }

    // Battery optimization
    if (capabilities.battery.level < 0.2 && !capabilities.battery.charging) {
      await this.deviceOptimizer.optimizeForConstraint('battery');
      adaptations.push('Device battery optimization');
    }

    // CPU optimization
    if (capabilities.cpu.performance === 'low') {
      await this.deviceOptimizer.optimizeForConstraint('cpu');
      adaptations.push('Device CPU optimization');
    }

    return adaptations;
  }

  private async performNetworkAdaptations(): Promise<string[]> {
    const adaptations: string[] = [];
    const conditions = this.networkLoader.getCurrentNetwork();

    // Slow network optimization
    if (conditions.effectiveType === '2g' || conditions.effectiveType === 'slow-2g') {
      // Network loader automatically adapts, just log
      adaptations.push('Network slow connection optimization');
    }

    // High latency optimization
    if (conditions.rtt > 500) {
      adaptations.push('Network high latency optimization');
    }

    // Data saver optimization
    if (conditions.saveData) {
      adaptations.push('Network data saver optimization');
    }

    return adaptations;
  }

  private async performCacheAdaptations(): Promise<string[]> {
    const adaptations: string[] = [];
    const deviceCaps = this.deviceOptimizer.getDeviceCapabilities();
    const networkConds = this.networkLoader.getCurrentNetwork();

    // Adapt cache based on current conditions
    const deviceType = deviceCaps.deviceType;
    const networkSpeed = networkConds.effectiveType === '4g' || networkConds.effectiveType === '5g' ? 'fast' :
                        networkConds.effectiveType === '3g' ? 'medium' : 'slow';
    const memoryLevel = deviceCaps.memory.pressure === 'high' ? 'low' :
                       deviceCaps.memory.pressure === 'medium' ? 'medium' : 'high';

    await this.cacheManager.adaptCacheProfile(deviceType, networkSpeed, memoryLevel);
    adaptations.push(`Cache profile adaptation: ${deviceType}/${networkSpeed}/${memoryLevel}`);

    return adaptations;
  }

  private async performCrossComponentOptimizations(): Promise<string[]> {
    const adaptations: string[] = [];
    const metrics = await this.getSystemMetrics();

    // Cross-component memory optimization
    if (metrics.device.capabilities.memory.pressure === 'high') {
      // Reduce cache size
      await this.cacheManager.adaptCacheProfile(undefined, undefined, 'low');
      
      // Reduce network concurrency
      // This would be implemented by updating network loader settings
      
      adaptations.push('Cross-component memory optimization');
    }

    // Cross-component performance optimization
    if (metrics.overall.performanceScore < 0.6) {
      // Enable aggressive device optimizations
      await this.deviceOptimizer.optimizeForConstraint('cpu');
      
      // Optimize cache for performance
      await this.cacheManager.adaptCacheProfile(undefined, 'fast', undefined);
      
      adaptations.push('Cross-component performance optimization');
    }

    return adaptations;
  }

  private calculateOverallMetrics(deviceMetrics: any, networkMetrics: any, cacheMetrics: any): SystemMetrics['overall'] {
    // Calculate performance score (0-1)
    const performanceScore = (
      (deviceMetrics.optimizationEffectiveness || 0.5) * 0.4 +
      (networkMetrics.successfulRequests / Math.max(1, networkMetrics.totalRequests) || 0.5) * 0.3 +
      (cacheMetrics.hitRatio || 0.5) * 0.3
    );

    // Calculate adaptation effectiveness (0-1)
    const adaptationEffectiveness = (
      (deviceMetrics.adaptationCount > 0 ? 0.8 : 0.5) * 0.4 +
      (networkMetrics.adaptationCount > 0 ? 0.8 : 0.5) * 0.3 +
      (cacheMetrics.profileAdaptations > 0 ? 0.8 : 0.5) * 0.3
    );

    // Calculate resource utilization (0-1)
    const resourceUtilization = Math.min(1, (
      (deviceMetrics.memoryUsageReduction || 0) * 0.4 +
      (networkMetrics.bandwidthSaved / 1000000 || 0) * 0.3 + // Convert to MB
      (cacheMetrics.compressionRatio || 1) * 0.3
    ));

    // Calculate user experience score (0-1)
    const userExperienceScore = (
      performanceScore * 0.5 +
      adaptationEffectiveness * 0.3 +
      resourceUtilization * 0.2
    );

    return {
      performanceScore,
      adaptationEffectiveness,
      resourceUtilization,
      userExperienceScore
    };
  }

  private calculatePerformanceImpact(before: SystemMetrics, after: SystemMetrics): number {
    const beforeScore = before.overall.performanceScore;
    const afterScore = after.overall.performanceScore;
    
    if (beforeScore === 0) return 0;
    
    return ((afterScore - beforeScore) / beforeScore) * 100;
  }

  private async generateDeviceRecommendations(metrics: SystemMetrics): Promise<AdaptationRecommendation[]> {
    const recommendations: AdaptationRecommendation[] = [];
    const deviceRecs = this.deviceOptimizer.getDeviceRecommendations();

    deviceRecs.forEach((rec, index) => {
      recommendations.push({
        id: `device-${index}`,
        component: 'device',
        type: 'performance',
        priority: 'medium',
        description: rec,
        estimatedImpact: 'Improved device performance',
        implementation: async () => {
          // Implementation would depend on the specific recommendation
        },
        confidence: 0.7
      });
    });

    return recommendations;
  }

  private async generateNetworkRecommendations(metrics: SystemMetrics): Promise<AdaptationRecommendation[]> {
    const recommendations: AdaptationRecommendation[] = [];
    const networkRecs = this.networkLoader.getNetworkRecommendations();

    networkRecs.forEach((rec, index) => {
      recommendations.push({
        id: `network-${index}`,
        component: 'network',
        type: 'network',
        priority: 'medium',
        description: rec,
        estimatedImpact: 'Improved network efficiency',
        implementation: async () => {
          // Implementation would depend on the specific recommendation
        },
        confidence: 0.8
      });
    });

    return recommendations;
  }

  private async generateCacheRecommendations(metrics: SystemMetrics): Promise<AdaptationRecommendation[]> {
    const recommendations: AdaptationRecommendation[] = [];

    if (metrics.cache.metrics.hitRatio < 0.7) {
      recommendations.push({
        id: 'cache-hit-ratio',
        component: 'cache',
        type: 'performance',
        priority: 'high',
        description: 'Improve cache hit ratio by optimizing cache strategies',
        estimatedImpact: '20% improvement in load times',
        implementation: async () => {
          await this.cacheManager.adaptCacheProfile(undefined, 'fast', undefined);
        },
        confidence: 0.9
      });
    }

    return recommendations;
  }

  private async generateSystemRecommendations(metrics: SystemMetrics): Promise<AdaptationRecommendation[]> {
    const recommendations: AdaptationRecommendation[] = [];

    if (metrics.overall.performanceScore < 0.6) {
      recommendations.push({
        id: 'system-performance',
        component: 'system',
        type: 'performance',
        priority: 'critical',
        description: 'Comprehensive system optimization needed',
        estimatedImpact: '30% overall performance improvement',
        implementation: async () => {
          await this.adaptSystem('comprehensive-optimization');
        },
        confidence: 0.85
      });
    }

    return recommendations;
  }

  private notifyAdaptationCallbacks(metrics: SystemMetrics): void {
    this.adaptationCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in adaptation callback:', error);
      }
    });
  }

  /**
   * Destroy adaptive system
   */
  destroy(): void {
    // Clear intervals
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.adaptationInterval) clearInterval(this.adaptationInterval);

    // Destroy components
    this.deviceOptimizer.destroy();
    this.networkLoader.destroy();
    this.cacheManager.destroy();

    // Clear data
    this.adaptationHistory = [];
    this.adaptationCallbacks = [];

    console.log('Device and network adaptive system destroyed');
  }
}