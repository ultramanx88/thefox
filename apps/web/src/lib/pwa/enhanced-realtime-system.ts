/**
 * Enhanced Real-time System
 * Integrates all real-time components for scalable real-time updates
 */

import { RealtimeManager, RealtimeConfig, ConnectionMetrics } from './realtime-manager';
import { AdaptiveFrequencyManager, FrequencyConfig, FrequencyMetrics } from './adaptive-frequency-manager';
import { RealtimeFallbackManager, FallbackConfig, FallbackMetrics } from './realtime-fallback-manager';

export interface EnhancedRealtimeConfig {
  realtime?: Partial<RealtimeConfig>;
  frequency?: Partial<FrequencyConfig>;
  fallback?: Partial<FallbackConfig>;
  enableAdaptiveFrequency: boolean;
  enableFallbackMechanisms: boolean;
  enableSelectiveBroadcast: boolean;
  enableCompressionOptimization: boolean;
  maxConcurrentConnections: number;
  connectionPooling: boolean;
}

export interface SystemMetrics {
  realtime: ConnectionMetrics;
  frequency: FrequencyMetrics;
  fallback: FallbackMetrics;
  overall: {
    totalConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    reliabilityScore: number;
    resourceUsage: number;
    scalabilityIndex: number;
  };
}

export interface SubscriptionOptions {
  priority?: 'high' | 'medium' | 'low';
  filters?: Record<string, any>;
  adaptiveFrequency?: boolean;
  fallbackEnabled?: boolean;
  compression?: boolean;
  batchingEnabled?: boolean;
}

export interface PublishOptions {
  priority?: 'high' | 'medium' | 'low';
  targetUsers?: string[];
  compress?: boolean;
  reliable?: boolean; // Ensure delivery even with fallbacks
  broadcast?: boolean; // Selective vs broadcast
}

export class EnhancedRealtimeSystem {
  private config: EnhancedRealtimeConfig;
  private realtimeManager: RealtimeManager;
  private frequencyManager?: AdaptiveFrequencyManager;
  private fallbackManager?: RealtimeFallbackManager;
  
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private connectionPool: Map<string, WebSocket> = new Map();
  private messageBuffer: Map<string, any[]> = new Map();
  
  private metricsInterval?: NodeJS.Timeout;
  private optimizationInterval?: NodeJS.Timeout;

  constructor(config: Partial<EnhancedRealtimeConfig> = {}) {
    this.config = {
      enableAdaptiveFrequency: true,
      enableFallbackMechanisms: true,
      enableSelectiveBroadcast: true,
      enableCompressionOptimization: true,
      maxConcurrentConnections: 50,
      connectionPooling: true,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize enhanced real-time system
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize core real-time manager
      this.realtimeManager = new RealtimeManager(this.config.realtime);

      // Initialize adaptive frequency manager
      if (this.config.enableAdaptiveFrequency) {
        this.frequencyManager = new AdaptiveFrequencyManager(this.config.frequency);
        this.setupFrequencyAdaptation();
      }

      // Initialize fallback manager
      if (this.config.enableFallbackMechanisms) {
        this.fallbackManager = new RealtimeFallbackManager(this.config.fallback);
      }

      // Start monitoring and optimization
      this.startMetricsCollection();
      this.startOptimization();

      console.log('Enhanced real-time system initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced real-time system:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates with enhanced options
   */
  async subscribe(
    channel: string,
    callback: (data: any) => void,
    options: SubscriptionOptions = {}
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();
    
    // Store subscription info
    const subscriptionInfo: SubscriptionInfo = {
      id: subscriptionId,
      channel,
      callback,
      options,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      fallbackActive: false
    };
    
    this.subscriptions.set(subscriptionId, subscriptionInfo);

    try {
      // Primary subscription through real-time manager
      const primaryId = await this.realtimeManager.subscribe(
        channel,
        (data) => this.handleMessage(subscriptionId, data),
        {
          priority: options.priority,
          filters: options.filters
        }
      );
      
      subscriptionInfo.primaryConnectionId = primaryId;
      
      console.log(`Enhanced subscription created for channel: ${channel} (${subscriptionId})`);
      return subscriptionId;
      
    } catch (error) {
      console.error(`Primary subscription failed for channel ${channel}:`, error);
      
      // Activate fallback if enabled
      if (this.config.enableFallbackMechanisms && this.fallbackManager) {
        try {
          const fallbackId = await this.fallbackManager.activateFallback(
            channel,
            (data) => this.handleMessage(subscriptionId, data),
            error
          );
          
          subscriptionInfo.fallbackConnectionId = fallbackId;
          subscriptionInfo.fallbackActive = true;
          
          console.log(`Fallback activated for subscription: ${subscriptionId}`);
          return subscriptionId;
          
        } catch (fallbackError) {
          console.error('Both primary and fallback subscriptions failed:', fallbackError);
          this.subscriptions.delete(subscriptionId);
          throw fallbackError;
        }
      } else {
        this.subscriptions.delete(subscriptionId);
        throw error;
      }
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      // Unsubscribe from primary connection
      if (subscription.primaryConnectionId) {
        await this.realtimeManager.unsubscribe(subscription.primaryConnectionId);
      }

      // Deactivate fallback if active
      if (subscription.fallbackActive && subscription.fallbackConnectionId && this.fallbackManager) {
        await this.fallbackManager.deactivateFallback(subscription.fallbackConnectionId);
      }

      this.subscriptions.delete(subscriptionId);
      console.log(`Enhanced subscription removed: ${subscriptionId}`);
      
    } catch (error) {
      console.error(`Error unsubscribing ${subscriptionId}:`, error);
    }
  }

  /**
   * Publish message with enhanced options
   */
  async publish(
    channel: string,
    data: any,
    options: PublishOptions = {}
  ): Promise<void> {
    try {
      // Publish through primary real-time manager
      await this.realtimeManager.publish(channel, data, {
        priority: options.priority,
        targetUsers: options.targetUsers,
        compress: options.compress
      });

      // If reliable delivery is requested and fallback is available
      if (options.reliable && this.fallbackManager) {
        // Store message for potential fallback delivery
        this.bufferMessage(channel, data, options);
      }

    } catch (error) {
      console.error(`Failed to publish to channel ${channel}:`, error);
      
      // Try fallback delivery if reliable delivery is requested
      if (options.reliable && this.fallbackManager) {
        await this.attemptFallbackDelivery(channel, data, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const realtimeMetrics = this.realtimeManager.getMetrics();
    const frequencyMetrics = this.frequencyManager?.getMetrics() || this.getDefaultFrequencyMetrics();
    const fallbackMetrics = this.fallbackManager?.getMetrics() || this.getDefaultFallbackMetrics();

    const overallMetrics = this.calculateOverallMetrics(realtimeMetrics, frequencyMetrics, fallbackMetrics);

    return {
      realtime: realtimeMetrics,
      frequency: frequencyMetrics,
      fallback: fallbackMetrics,
      overall: overallMetrics
    };
  }

  /**
   * Optimize system performance
   */
  async optimizeSystem(): Promise<void> {
    console.log('Optimizing enhanced real-time system');

    try {
      // Optimize real-time connections
      await this.realtimeManager.optimizeConnections();

      // Optimize frequency if adaptive frequency is enabled
      if (this.frequencyManager) {
        // Frequency optimization is handled automatically by the frequency manager
      }

      // Test and optimize fallback strategies
      if (this.fallbackManager) {
        const fallbackResults = await this.fallbackManager.testFallbackStrategies();
        console.log('Fallback strategy test results:', fallbackResults);
      }

      // Optimize subscriptions
      await this.optimizeSubscriptions();

      // Clean up resources
      await this.cleanupResources();

      console.log('System optimization completed');
    } catch (error) {
      console.error('System optimization failed:', error);
    }
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): SubscriptionInfo[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<SystemHealthReport> {
    const metrics = await this.getSystemMetrics();
    
    const health: SystemHealthReport = {
      overall: 'healthy',
      components: {
        realtime: this.assessRealtimeHealth(metrics.realtime),
        frequency: this.assessFrequencyHealth(metrics.frequency),
        fallback: this.assessFallbackHealth(metrics.fallback)
      },
      recommendations: [],
      timestamp: Date.now()
    };

    // Generate recommendations based on health assessment
    if (health.components.realtime === 'unhealthy') {
      health.recommendations.push('Consider reducing real-time connection load');
    }
    
    if (health.components.frequency === 'degraded') {
      health.recommendations.push('Review frequency adaptation settings');
    }
    
    if (health.components.fallback === 'unhealthy') {
      health.recommendations.push('Check fallback mechanism configuration');
    }

    // Determine overall health
    const componentHealths = Object.values(health.components);
    if (componentHealths.includes('unhealthy')) {
      health.overall = 'unhealthy';
    } else if (componentHealths.includes('degraded')) {
      health.overall = 'degraded';
    }

    return health;
  }

  // Private methods

  private handleMessage(subscriptionId: string, data: any): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    try {
      // Update subscription activity
      subscription.lastActivity = Date.now();
      subscription.messageCount++;

      // Apply compression optimization if enabled
      let processedData = data;
      if (this.config.enableCompressionOptimization && subscription.options.compression) {
        processedData = this.decompressData(data);
      }

      // Apply selective broadcast if enabled
      if (this.config.enableSelectiveBroadcast && subscription.options.filters) {
        if (!this.matchesFilters(processedData, subscription.options.filters)) {
          return; // Skip message that doesn't match filters
        }
      }

      // Deliver message to callback
      subscription.callback(processedData);

    } catch (error) {
      console.error(`Error handling message for subscription ${subscriptionId}:`, error);
    }
  }

  private setupFrequencyAdaptation(): void {
    if (!this.frequencyManager) return;

    this.frequencyManager.onFrequencyChange('realtime-system', (frequency) => {
      console.log(`Adaptive frequency changed to: ${frequency}ms`);
      
      // Apply frequency changes to real-time manager
      // This would involve updating heartbeat intervals, polling frequencies, etc.
      this.applyFrequencyChanges(frequency);
    });
  }

  private applyFrequencyChanges(frequency: number): void {
    // Apply frequency changes to various components
    // This is a simplified implementation
    console.log(`Applying frequency changes: ${frequency}ms`);
  }

  private bufferMessage(channel: string, data: any, options: PublishOptions): void {
    const buffer = this.messageBuffer.get(channel) || [];
    buffer.push({ data, options, timestamp: Date.now() });
    
    // Keep buffer size manageable
    if (buffer.length > 100) {
      buffer.shift();
    }
    
    this.messageBuffer.set(channel, buffer);
  }

  private async attemptFallbackDelivery(channel: string, data: any, options: PublishOptions): Promise<void> {
    if (!this.fallbackManager) {
      throw new Error('Fallback manager not available');
    }

    console.log(`Attempting fallback delivery for channel: ${channel}`);
    
    // This would implement fallback publishing mechanisms
    // For now, we'll just log the attempt
    console.log('Fallback delivery attempted (implementation needed)');
  }

  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    return Object.entries(filters).every(([key, value]) => {
      return data[key] === value;
    });
  }

  private decompressData(data: any): any {
    // Implement data decompression
    // This is a placeholder implementation
    return data;
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getSystemMetrics();
        this.analyzeMetrics(metrics);
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private startOptimization(): void {
    this.optimizationInterval = setInterval(async () => {
      try {
        await this.optimizeSystem();
      } catch (error) {
        console.error('Automatic optimization error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  private analyzeMetrics(metrics: SystemMetrics): void {
    // Analyze metrics and trigger optimizations if needed
    if (metrics.overall.reliabilityScore < 0.8) {
      console.warn('Low reliability score detected, triggering optimization');
      this.optimizeSystem();
    }

    if (metrics.overall.averageLatency > 1000) {
      console.warn('High latency detected, optimizing connections');
      this.realtimeManager.optimizeConnections();
    }
  }

  private async optimizeSubscriptions(): Promise<void> {
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    
    const inactiveSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([_, sub]) => now - sub.lastActivity > inactiveThreshold);

    for (const [id, _] of inactiveSubscriptions) {
      console.log(`Removing inactive subscription: ${id}`);
      await this.unsubscribe(id);
    }
  }

  private async cleanupResources(): Promise<void> {
    // Clean up message buffers
    const bufferThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    this.messageBuffer.forEach((buffer, channel) => {
      const filtered = buffer.filter(msg => now - msg.timestamp < bufferThreshold);
      if (filtered.length !== buffer.length) {
        this.messageBuffer.set(channel, filtered);
      }
    });

    // Clean up connection pool if enabled
    if (this.config.connectionPooling) {
      // Implementation for connection pool cleanup
    }
  }

  private calculateOverallMetrics(
    realtime: ConnectionMetrics,
    frequency: FrequencyMetrics,
    fallback: FallbackMetrics
  ): SystemMetrics['overall'] {
    return {
      totalConnections: realtime.activeConnections + fallback.activeConnections,
      messagesPerSecond: realtime.messagesPerSecond,
      averageLatency: realtime.averageLatency,
      reliabilityScore: (realtime.errors === 0 ? 1 : 0.8) * fallback.reliabilityScore,
      resourceUsage: this.calculateResourceUsage(),
      scalabilityIndex: this.calculateScalabilityIndex(realtime, frequency, fallback)
    };
  }

  private calculateResourceUsage(): number {
    // Calculate resource usage based on active connections and message throughput
    const connectionWeight = this.subscriptions.size * 0.1;
    const messageWeight = Array.from(this.subscriptions.values())
      .reduce((sum, sub) => sum + sub.messageCount, 0) * 0.001;
    
    return Math.min(1, connectionWeight + messageWeight);
  }

  private calculateScalabilityIndex(
    realtime: ConnectionMetrics,
    frequency: FrequencyMetrics,
    fallback: FallbackMetrics
  ): number {
    // Calculate scalability index based on various factors
    const connectionEfficiency = realtime.activeConnections > 0 ? 
      realtime.messagesPerSecond / realtime.activeConnections : 1;
    
    const frequencyEfficiency = frequency.networkEfficiency || 1;
    const fallbackReliability = fallback.reliabilityScore;
    
    return Math.min(1, (connectionEfficiency * frequencyEfficiency * fallbackReliability) / 10);
  }

  private assessRealtimeHealth(metrics: ConnectionMetrics): HealthStatus {
    if (metrics.errors > 10 || metrics.averageLatency > 2000) {
      return 'unhealthy';
    } else if (metrics.errors > 5 || metrics.averageLatency > 1000) {
      return 'degraded';
    }
    return 'healthy';
  }

  private assessFrequencyHealth(metrics: FrequencyMetrics): HealthStatus {
    if (metrics.userSatisfaction < 0.5 || metrics.networkEfficiency < 0.5) {
      return 'unhealthy';
    } else if (metrics.userSatisfaction < 0.7 || metrics.networkEfficiency < 0.7) {
      return 'degraded';
    }
    return 'healthy';
  }

  private assessFallbackHealth(metrics: FallbackMetrics): HealthStatus {
    if (metrics.reliabilityScore < 0.5) {
      return 'unhealthy';
    } else if (metrics.reliabilityScore < 0.8) {
      return 'degraded';
    }
    return 'healthy';
  }

  private getDefaultFrequencyMetrics(): FrequencyMetrics {
    return {
      currentFrequency: 5000,
      targetFrequency: 5000,
      adaptationHistory: [],
      performanceImpact: 0,
      userSatisfaction: 1,
      networkEfficiency: 1
    };
  }

  private getDefaultFallbackMetrics(): FallbackMetrics {
    return {
      activeConnections: 0,
      fallbacksActivated: 0,
      successfulRecoveries: 0,
      totalMessages: 0,
      averageLatency: 0,
      reliabilityScore: 1
    };
  }

  private generateSubscriptionId(): string {
    return `enhanced_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy enhanced real-time system
   */
  destroy(): void {
    // Clear intervals
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);

    // Destroy components
    this.realtimeManager.destroy();
    if (this.frequencyManager) this.frequencyManager.destroy();
    if (this.fallbackManager) this.fallbackManager.destroy();

    // Clear data
    this.subscriptions.clear();
    this.connectionPool.clear();
    this.messageBuffer.clear();

    console.log('Enhanced real-time system destroyed');
  }
}

// Supporting interfaces

interface SubscriptionInfo {
  id: string;
  channel: string;
  callback: (data: any) => void;
  options: SubscriptionOptions;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  fallbackActive: boolean;
  primaryConnectionId?: string;
  fallbackConnectionId?: string;
}

interface SystemHealthReport {
  overall: HealthStatus;
  components: {
    realtime: HealthStatus;
    frequency: HealthStatus;
    fallback: HealthStatus;
  };
  recommendations: string[];
  timestamp: number;
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';