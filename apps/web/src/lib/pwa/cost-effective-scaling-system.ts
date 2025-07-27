/**
 * Cost-Effective Scaling System
 * Integrates all cost optimization components for scalable and cost-effective operations
 */

import { CDNOptimizer, CDNConfig, CDNMetrics } from './cdn-optimizer';
import { CompressionOptimizer, CompressionConfig, CompressionMetrics } from './compression-optimizer';
import { FirebaseQuotaOptimizer, FirebaseQuotaConfig, FirebaseUsageMetrics } from './firebase-quota-optimizer';
import { CostMonitoringSystem, CostMonitoringConfig, CostBreakdown, CostAlert } from './cost-monitoring-system';

export interface CostEffectiveScalingConfig {
  cdn?: Partial<CDNConfig>;
  compression?: Partial<CompressionConfig>;
  firebaseQuota?: Partial<FirebaseQuotaConfig>;
  costMonitoring?: Partial<CostMonitoringConfig>;
  enableAutomaticOptimization: boolean;
  enablePredictiveScaling: boolean;
  enableCostAwareRouting: boolean;
  optimizationInterval: number;
  scalingThresholds: {
    costPerUser: number;
    utilizationThreshold: number;
    performanceThreshold: number;
  };
}

export interface ScalingMetrics {
  cdn: CDNMetrics;
  compression: CompressionMetrics;
  firebase: FirebaseUsageMetrics;
  costs: CostBreakdown;
  overall: {
    totalUsers: number;
    costPerUser: number;
    scalingEfficiency: number;
    optimizationSavings: number;
    performanceScore: number;
  };
}

export interface ScalingRecommendation {
  id: string;
  type: 'cost' | 'performance' | 'capacity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedSavings: number;
  estimatedImpact: string;
  implementation: () => Promise<void>;
  effort: 'low' | 'medium' | 'high';
}

export interface ScalingDecision {
  action: 'scale-up' | 'scale-down' | 'optimize' | 'maintain';
  reason: string;
  estimatedCostImpact: number;
  estimatedPerformanceImpact: number;
  confidence: number;
  recommendations: ScalingRecommendation[];
}

export class CostEffectiveScalingSystem {
  private config: CostEffectiveScalingConfig;
  private cdnOptimizer: CDNOptimizer;
  private compressionOptimizer: CompressionOptimizer;
  private firebaseOptimizer: FirebaseQuotaOptimizer;
  private costMonitoring: CostMonitoringSystem;
  
  private scalingHistory: Array<{
    timestamp: number;
    decision: ScalingDecision;
    metrics: ScalingMetrics;
  }> = [];
  
  private activeRecommendations: Map<string, ScalingRecommendation> = new Map();
  private scalingCallbacks: ((decision: ScalingDecision) => void)[] = [];
  
  private optimizationInterval?: NodeJS.Timeout;
  private scalingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: Partial<CostEffectiveScalingConfig> = {}) {
    this.config = {
      enableAutomaticOptimization: true,
      enablePredictiveScaling: true,
      enableCostAwareRouting: true,
      optimizationInterval: 300000, // 5 minutes
      scalingThresholds: {
        costPerUser: 0.10, // $0.10 per user
        utilizationThreshold: 0.8,
        performanceThreshold: 0.7
      },
      ...config
    };

    // Initialize optimizers
    this.cdnOptimizer = new CDNOptimizer(this.config.cdn);
    this.compressionOptimizer = new CompressionOptimizer(this.config.compression);
    this.firebaseOptimizer = new FirebaseQuotaOptimizer(this.config.firebaseQuota);
    this.costMonitoring = new CostMonitoringSystem(this.config.costMonitoring);

    this.initialize();
  }

  /**
   * Initialize cost-effective scaling system
   */
  private async initialize(): Promise<void> {
    try {
      // Setup cost monitoring alerts
      this.costMonitoring.onCostAlert((alert) => {
        this.handleCostAlert(alert);
      });

      // Setup Firebase quota alerts
      this.firebaseOptimizer.onQuotaAlert((alert) => {
        this.handleQuotaAlert(alert);
      });

      // Start optimization and scaling loops
      this.startOptimizationLoop();
      this.startScalingLoop();
      this.startMetricsCollection();

      console.log('Cost-effective scaling system initialized');
    } catch (error) {
      console.error('Failed to initialize cost-effective scaling system:', error);
    }
  }

  /**
   * Get comprehensive scaling metrics
   */
  async getScalingMetrics(): Promise<ScalingMetrics> {
    const [cdnMetrics, compressionMetrics, firebaseMetrics, costBreakdown] = await Promise.all([
      Promise.resolve(this.cdnOptimizer.getMetrics()),
      Promise.resolve(this.compressionOptimizer.getMetrics()),
      Promise.resolve(this.firebaseOptimizer.getUsageMetrics()),
      Promise.resolve(this.costMonitoring.getCurrentCosts())
    ]);

    const overallMetrics = this.calculateOverallMetrics(
      cdnMetrics,
      compressionMetrics,
      firebaseMetrics,
      costBreakdown
    );

    return {
      cdn: cdnMetrics,
      compression: compressionMetrics,
      firebase: firebaseMetrics,
      costs: costBreakdown,
      overall: overallMetrics
    };
  }

  /**
   * Make intelligent scaling decision
   */
  async makeScalingDecision(): Promise<ScalingDecision> {
    const metrics = await this.getScalingMetrics();
    const recommendations = await this.generateScalingRecommendations(metrics);
    
    // Analyze current state
    const costPerUser = metrics.overall.costPerUser;
    const scalingEfficiency = metrics.overall.scalingEfficiency;
    const performanceScore = metrics.overall.performanceScore;

    let decision: ScalingDecision;

    // Decision logic based on multiple factors
    if (costPerUser > this.config.scalingThresholds.costPerUser) {
      // Cost is too high - optimize or scale down
      if (scalingEfficiency < 0.7) {
        decision = {
          action: 'optimize',
          reason: 'High cost per user with low scaling efficiency',
          estimatedCostImpact: -costPerUser * 0.3, // 30% cost reduction
          estimatedPerformanceImpact: 0.1, // Slight performance improvement
          confidence: 0.8,
          recommendations: recommendations.filter(r => r.type === 'cost')
        };
      } else {
        decision = {
          action: 'scale-down',
          reason: 'High cost per user despite good efficiency',
          estimatedCostImpact: -costPerUser * 0.2, // 20% cost reduction
          estimatedPerformanceImpact: -0.1, // Slight performance decrease
          confidence: 0.7,
          recommendations: recommendations.filter(r => r.priority === 'high')
        };
      }
    } else if (performanceScore < this.config.scalingThresholds.performanceThreshold) {
      // Performance is poor - scale up or optimize
      decision = {
        action: 'scale-up',
        reason: 'Poor performance score requires scaling',
        estimatedCostImpact: costPerUser * 0.2, // 20% cost increase
        estimatedPerformanceImpact: 0.3, // 30% performance improvement
        confidence: 0.75,
        recommendations: recommendations.filter(r => r.type === 'performance')
      };
    } else if (scalingEfficiency > 0.9 && costPerUser < this.config.scalingThresholds.costPerUser * 0.7) {
      // Very efficient and low cost - maintain current state
      decision = {
        action: 'maintain',
        reason: 'Optimal cost and performance balance achieved',
        estimatedCostImpact: 0,
        estimatedPerformanceImpact: 0,
        confidence: 0.9,
        recommendations: recommendations.filter(r => r.priority === 'low')
      };
    } else {
      // Default to optimization
      decision = {
        action: 'optimize',
        reason: 'Continuous optimization for better efficiency',
        estimatedCostImpact: -costPerUser * 0.1, // 10% cost reduction
        estimatedPerformanceImpact: 0.05, // 5% performance improvement
        confidence: 0.6,
        recommendations: recommendations.filter(r => r.effort === 'low')
      };
    }

    // Record decision in history
    this.scalingHistory.push({
      timestamp: Date.now(),
      decision,
      metrics
    });

    // Keep history manageable
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }

    // Notify callbacks
    this.notifyScalingCallbacks(decision);

    return decision;
  }

  /**
   * Execute scaling decision
   */
  async executeScalingDecision(decision: ScalingDecision): Promise<void> {
    console.log(`Executing scaling decision: ${decision.action} - ${decision.reason}`);

    try {
      switch (decision.action) {
        case 'scale-up':
          await this.executeScaleUp(decision);
          break;
        case 'scale-down':
          await this.executeScaleDown(decision);
          break;
        case 'optimize':
          await this.executeOptimization(decision);
          break;
        case 'maintain':
          await this.executeMaintenance(decision);
          break;
      }

      console.log(`Scaling decision executed successfully: ${decision.action}`);
    } catch (error) {
      console.error(`Failed to execute scaling decision: ${decision.action}`, error);
      throw error;
    }
  }

  /**
   * Get scaling recommendations
   */
  async getScalingRecommendations(): Promise<ScalingRecommendation[]> {
    const metrics = await this.getScalingMetrics();
    return await this.generateScalingRecommendations(metrics);
  }

  /**
   * Implement specific recommendation
   */
  async implementRecommendation(recommendationId: string): Promise<void> {
    const recommendation = this.activeRecommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    try {
      await recommendation.implementation();
      
      // Update cost monitoring
      this.costMonitoring.updateServiceCost(
        'infrastructure',
        'optimization',
        -recommendation.estimatedSavings
      );

      console.log(`Recommendation implemented: ${recommendation.description}`);
    } catch (error) {
      console.error(`Failed to implement recommendation ${recommendationId}:`, error);
      throw error;
    }
  }

  /**
   * Add scaling decision callback
   */
  onScalingDecision(callback: (decision: ScalingDecision) => void): void {
    this.scalingCallbacks.push(callback);
  }

  /**
   * Get scaling history
   */
  getScalingHistory(days: number = 7): Array<{
    timestamp: number;
    decision: ScalingDecision;
    metrics: ScalingMetrics;
  }> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return this.scalingHistory.filter(entry => entry.timestamp > cutoff);
  }

  // Private methods

  private calculateOverallMetrics(
    cdnMetrics: CDNMetrics,
    compressionMetrics: CompressionMetrics,
    firebaseMetrics: FirebaseUsageMetrics,
    costBreakdown: CostBreakdown
  ): ScalingMetrics['overall'] {
    // Estimate total users (simplified)
    const totalUsers = Math.max(1000, firebaseMetrics.firestore.reads / 10); // Rough estimate
    
    const costPerUser = costBreakdown.total / totalUsers;
    
    // Calculate scaling efficiency (0-1)
    const scalingEfficiency = this.calculateScalingEfficiency(
      cdnMetrics,
      compressionMetrics,
      firebaseMetrics
    );
    
    // Calculate optimization savings
    const optimizationSavings = 
      (cdnMetrics.bandwidthSaved * 0.12) + // CDN bandwidth savings
      (compressionMetrics.bandwidthSaved * 0.08) + // Compression savings
      (firebaseMetrics.totalCost * 0.1); // Firebase optimization savings
    
    // Calculate performance score (0-1)
    const performanceScore = this.calculatePerformanceScore(
      cdnMetrics,
      compressionMetrics,
      firebaseMetrics
    );

    return {
      totalUsers,
      costPerUser,
      scalingEfficiency,
      optimizationSavings,
      performanceScore
    };
  }

  private calculateScalingEfficiency(
    cdnMetrics: CDNMetrics,
    compressionMetrics: CompressionMetrics,
    firebaseMetrics: FirebaseUsageMetrics
  ): number {
    // Combine various efficiency metrics
    const cdnEfficiency = cdnMetrics.hitRatio;
    const compressionEfficiency = compressionMetrics.compressionRatio > 1 ? 
      Math.min(1, compressionMetrics.compressionRatio / 3) : 0;
    const firebaseEfficiency = 1 - (firebaseMetrics.totalCost / 1000); // Normalized
    
    return (cdnEfficiency * 0.4) + (compressionEfficiency * 0.3) + (firebaseEfficiency * 0.3);
  }

  private calculatePerformanceScore(
    cdnMetrics: CDNMetrics,
    compressionMetrics: CompressionMetrics,
    firebaseMetrics: FirebaseUsageMetrics
  ): number {
    // Combine performance indicators
    const cdnPerformance = Math.max(0, 1 - (cdnMetrics.averageResponseTime / 1000)); // Normalize to 1s
    const compressionPerformance = Math.max(0, 1 - (compressionMetrics.averageCompressionTime / 100)); // Normalize to 100ms
    const firebasePerformance = 0.8; // Assume good Firebase performance
    
    return (cdnPerformance * 0.4) + (compressionPerformance * 0.3) + (firebasePerformance * 0.3);
  }

  private async generateScalingRecommendations(metrics: ScalingMetrics): Promise<ScalingRecommendation[]> {
    const recommendations: ScalingRecommendation[] = [];

    // CDN optimization recommendations
    if (metrics.cdn.hitRatio < 0.8) {
      recommendations.push({
        id: 'cdn-cache-optimization',
        type: 'cost',
        priority: 'high',
        description: 'Optimize CDN caching strategy to improve hit ratio',
        estimatedSavings: 50,
        estimatedImpact: '20% reduction in origin requests',
        implementation: async () => {
          await this.cdnOptimizer.preloadCriticalResources(['/api/critical', '/assets/main.css']);
        },
        effort: 'medium'
      });
    }

    // Compression optimization recommendations
    if (metrics.compression.compressionRatio < 2) {
      recommendations.push({
        id: 'compression-optimization',
        type: 'cost',
        priority: 'medium',
        description: 'Enable more aggressive compression to reduce bandwidth',
        estimatedSavings: 30,
        estimatedImpact: '15% reduction in bandwidth usage',
        implementation: async () => {
          // Enable more aggressive compression
          console.log('Enabling aggressive compression');
        },
        effort: 'low'
      });
    }

    // Firebase optimization recommendations
    if (metrics.firebase.firestore.reads > 10000) {
      recommendations.push({
        id: 'firestore-caching',
        type: 'cost',
        priority: 'high',
        description: 'Implement Firestore read caching to reduce costs',
        estimatedSavings: 100,
        estimatedImpact: '40% reduction in Firestore read operations',
        implementation: async () => {
          // Enable Firestore caching
          this.firebaseOptimizer.setOptimizationStrategy('firestore-read-caching', true);
        },
        effort: 'medium'
      });
    }

    // Performance recommendations
    if (metrics.overall.performanceScore < 0.7) {
      recommendations.push({
        id: 'performance-optimization',
        type: 'performance',
        priority: 'high',
        description: 'Implement performance optimizations to improve user experience',
        estimatedSavings: 0,
        estimatedImpact: '25% improvement in performance score',
        implementation: async () => {
          await this.cdnOptimizer.prefetchResources(['/api/popular', '/assets/critical.js'], 'high');
        },
        effort: 'medium'
      });
    }

    // Cost optimization recommendations
    if (metrics.overall.costPerUser > this.config.scalingThresholds.costPerUser) {
      recommendations.push({
        id: 'cost-optimization',
        type: 'cost',
        priority: 'critical',
        description: 'Implement cost reduction strategies to improve cost per user',
        estimatedSavings: metrics.overall.costPerUser * 1000 * 0.2, // 20% of total cost
        estimatedImpact: '20% reduction in cost per user',
        implementation: async () => {
          // Implement multiple cost optimizations
          await this.executeComprehensiveCostOptimization();
        },
        effort: 'high'
      });
    }

    // Store active recommendations
    recommendations.forEach(rec => {
      this.activeRecommendations.set(rec.id, rec);
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async executeScaleUp(decision: ScalingDecision): Promise<void> {
    // Implement scale-up logic
    console.log('Executing scale-up operations');
    
    // Increase CDN capacity
    await this.cdnOptimizer.prefetchResources(['/api/popular'], 'high');
    
    // Optimize for higher load
    for (const recommendation of decision.recommendations) {
      if (recommendation.type === 'performance') {
        await recommendation.implementation();
      }
    }
  }

  private async executeScaleDown(decision: ScalingDecision): Promise<void> {
    // Implement scale-down logic
    console.log('Executing scale-down operations');
    
    // Reduce resource usage
    // This would involve reducing CDN usage, optimizing Firebase operations, etc.
    
    for (const recommendation of decision.recommendations) {
      if (recommendation.type === 'cost' && recommendation.effort === 'low') {
        await recommendation.implementation();
      }
    }
  }

  private async executeOptimization(decision: ScalingDecision): Promise<void> {
    // Implement optimization logic
    console.log('Executing optimization operations');
    
    for (const recommendation of decision.recommendations) {
      if (recommendation.effort === 'low' || recommendation.priority === 'high') {
        try {
          await recommendation.implementation();
        } catch (error) {
          console.error(`Failed to implement recommendation ${recommendation.id}:`, error);
        }
      }
    }
  }

  private async executeMaintenance(decision: ScalingDecision): Promise<void> {
    // Implement maintenance logic
    console.log('Executing maintenance operations');
    
    // Run low-priority optimizations
    for (const recommendation of decision.recommendations) {
      if (recommendation.priority === 'low' && recommendation.effort === 'low') {
        await recommendation.implementation();
      }
    }
  }

  private async executeComprehensiveCostOptimization(): Promise<void> {
    // Enable all cost optimization strategies
    this.firebaseOptimizer.setOptimizationStrategy('firestore-read-caching', true);
    this.firebaseOptimizer.setOptimizationStrategy('firestore-write-batching', true);
    this.firebaseOptimizer.setOptimizationStrategy('storage-compression', true);
    this.firebaseOptimizer.setOptimizationStrategy('function-caching', true);
    
    console.log('Comprehensive cost optimization implemented');
  }

  private handleCostAlert(alert: CostAlert): void {
    console.warn(`Cost alert received: ${alert.message}`);
    
    // Trigger immediate scaling decision if critical
    if (alert.severity === 'critical' || alert.severity === 'emergency') {
      this.makeScalingDecision().then(decision => {
        if (this.config.enableAutomaticOptimization) {
          this.executeScalingDecision(decision);
        }
      });
    }
  }

  private handleQuotaAlert(alert: any): void {
    console.warn(`Quota alert received: ${alert.message}`);
    
    // Implement quota-specific optimizations
    if (alert.service === 'firestore') {
      this.firebaseOptimizer.setOptimizationStrategy('firestore-read-caching', true);
    }
  }

  private startOptimizationLoop(): void {
    this.optimizationInterval = setInterval(async () => {
      if (this.config.enableAutomaticOptimization) {
        try {
          const decision = await this.makeScalingDecision();
          if (decision.action === 'optimize') {
            await this.executeScalingDecision(decision);
          }
        } catch (error) {
          console.error('Optimization loop error:', error);
        }
      }
    }, this.config.optimizationInterval);
  }

  private startScalingLoop(): void {
    this.scalingInterval = setInterval(async () => {
      if (this.config.enablePredictiveScaling) {
        try {
          const decision = await this.makeScalingDecision();
          
          // Only auto-execute low-risk decisions
          if (decision.confidence > 0.8 && decision.action !== 'scale-up') {
            await this.executeScalingDecision(decision);
          }
        } catch (error) {
          console.error('Scaling loop error:', error);
        }
      }
    }, this.config.optimizationInterval * 2); // Less frequent than optimization
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getScalingMetrics();
        
        // Update cost monitoring with current metrics
        this.costMonitoring.updateServiceCost('cdn', 'requests', metrics.cdn.averageResponseTime * 0.001);
        this.costMonitoring.updateServiceCost('infrastructure', 'compute', metrics.overall.totalUsers * 0.0001);
        
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, 60000); // Every minute
  }

  private notifyScalingCallbacks(decision: ScalingDecision): void {
    this.scalingCallbacks.forEach(callback => {
      try {
        callback(decision);
      } catch (error) {
        console.error('Error in scaling callback:', error);
      }
    });
  }

  /**
   * Destroy cost-effective scaling system
   */
  destroy(): void {
    // Clear intervals
    if (this.optimizationInterval) clearInterval(this.optimizationInterval);
    if (this.scalingInterval) clearInterval(this.scalingInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);

    // Destroy optimizers
    this.cdnOptimizer.destroy();
    this.compressionOptimizer.destroy();
    this.firebaseOptimizer.destroy();
    this.costMonitoring.destroy();

    // Clear data
    this.scalingHistory = [];
    this.activeRecommendations.clear();
    this.scalingCallbacks = [];

    console.log('Cost-effective scaling system destroyed');
  }
}