/**
 * Cost Monitoring System
 * Automated cost monitoring and optimization alerts for scalable applications
 */

export interface CostMonitoringConfig {
  budgetLimits: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  alertThresholds: {
    warning: number; // 70%
    critical: number; // 85%
    emergency: number; // 95%
  };
  services: {
    firebase: boolean;
    cdn: boolean;
    storage: boolean;
    bandwidth: boolean;
    compute: boolean;
  };
  enablePredictiveAlerts: boolean;
  enableAutomaticOptimization: boolean;
  reportingInterval: number; // milliseconds
}

export interface CostBreakdown {
  firebase: {
    firestore: number;
    storage: number;
    functions: number;
    hosting: number;
    authentication: number;
  };
  cdn: {
    requests: number;
    bandwidth: number;
    storage: number;
  };
  infrastructure: {
    compute: number;
    storage: number;
    network: number;
  };
  total: number;
}

export interface CostAlert {
  id: string;
  type: 'budget' | 'spike' | 'prediction' | 'optimization';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  service: string;
  message: string;
  currentCost: number;
  budgetLimit?: number;
  utilizationPercentage?: number;
  projectedCost?: number;
  recommendations: string[];
  timestamp: number;
  acknowledged: boolean;
}

export interface CostTrend {
  period: 'hour' | 'day' | 'week' | 'month';
  data: Array<{
    timestamp: number;
    cost: number;
    breakdown: Partial<CostBreakdown>;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  growthRate: number; // percentage
}

export interface OptimizationOpportunity {
  id: string;
  service: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementation: () => Promise<void>;
  estimatedTimeToImplement: number; // hours
}

export class CostMonitoringSystem {
  private config: CostMonitoringConfig;
  private currentCosts: CostBreakdown;
  private costHistory: Array<{ timestamp: number; costs: CostBreakdown }> = [];
  private alerts: Map<string, CostAlert> = new Map();
  private optimizationOpportunities: Map<string, OptimizationOpportunity> = new Map();
  
  private alertCallbacks: ((alert: CostAlert) => void)[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private reportingInterval?: NodeJS.Timeout;
  private predictionModel?: CostPredictionModel;

  constructor(config: Partial<CostMonitoringConfig> = {}) {
    this.config = {
      budgetLimits: {
        daily: 100,
        weekly: 500,
        monthly: 2000
      },
      alertThresholds: {
        warning: 0.7,
        critical: 0.85,
        emergency: 0.95
      },
      services: {
        firebase: true,
        cdn: true,
        storage: true,
        bandwidth: true,
        compute: true
      },
      enablePredictiveAlerts: true,
      enableAutomaticOptimization: false,
      reportingInterval: 3600000, // 1 hour
      ...config
    };

    this.currentCosts = {
      firebase: {
        firestore: 0,
        storage: 0,
        functions: 0,
        hosting: 0,
        authentication: 0
      },
      cdn: {
        requests: 0,
        bandwidth: 0,
        storage: 0
      },
      infrastructure: {
        compute: 0,
        storage: 0,
        network: 0
      },
      total: 0
    };

    this.initialize();
  }

  /**
   * Initialize cost monitoring system
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize prediction model if enabled
      if (this.config.enablePredictiveAlerts) {
        this.predictionModel = new CostPredictionModel();
      }

      // Setup optimization opportunities
      this.setupOptimizationOpportunities();
      
      // Start monitoring
      this.startCostMonitoring();
      
      // Start reporting
      this.startCostReporting();

      console.log('Cost monitoring system initialized');
    } catch (error) {
      console.error('Failed to initialize cost monitoring system:', error);
    }
  }

  /**
   * Update cost for a specific service
   */
  updateServiceCost(
    service: keyof CostBreakdown,
    subService: string,
    cost: number,
    operation: 'add' | 'set' = 'add'
  ): void {
    if (!this.config.services[service as keyof typeof this.config.services]) {
      return; // Service monitoring disabled
    }

    const serviceObj = this.currentCosts[service] as any;
    if (serviceObj && typeof serviceObj === 'object') {
      if (operation === 'add') {
        serviceObj[subService] = (serviceObj[subService] || 0) + cost;
      } else {
        serviceObj[subService] = cost;
      }
    }

    this.updateTotalCost();
    this.checkBudgetAlerts();
    this.detectCostSpikes();
  }

  /**
   * Get current cost breakdown
   */
  getCurrentCosts(): CostBreakdown {
    return { ...this.currentCosts };
  }

  /**
   * Get cost trends for specified period
   */
  getCostTrends(period: 'hour' | 'day' | 'week' | 'month'): CostTrend {
    const now = Date.now();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - periodMs[period];
    const relevantHistory = this.costHistory.filter(entry => entry.timestamp > cutoff);

    if (relevantHistory.length < 2) {
      return {
        period,
        data: [],
        trend: 'stable',
        growthRate: 0
      };
    }

    // Calculate trend
    const firstCost = relevantHistory[0].costs.total;
    const lastCost = relevantHistory[relevantHistory.length - 1].costs.total;
    const growthRate = ((lastCost - firstCost) / firstCost) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (growthRate > 5) trend = 'increasing';
    else if (growthRate < -5) trend = 'decreasing';

    return {
      period,
      data: relevantHistory.map(entry => ({
        timestamp: entry.timestamp,
        cost: entry.costs.total,
        breakdown: entry.costs
      })),
      trend,
      growthRate
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CostAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`Alert acknowledged: ${alertId}`);
    }
  }

  /**
   * Get optimization opportunities
   */
  getOptimizationOpportunities(): OptimizationOpportunity[] {
    return Array.from(this.optimizationOpportunities.values())
      .sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Implement optimization opportunity
   */
  async implementOptimization(opportunityId: string): Promise<void> {
    const opportunity = this.optimizationOpportunities.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Optimization opportunity not found: ${opportunityId}`);
    }

    try {
      await opportunity.implementation();
      
      // Create success alert
      this.createAlert({
        type: 'optimization',
        severity: 'info',
        service: opportunity.service,
        message: `Optimization implemented: ${opportunity.description}`,
        currentCost: this.currentCosts.total,
        recommendations: [`Estimated savings: $${opportunity.potentialSavings.toFixed(2)}`]
      });

      console.log(`Optimization implemented: ${opportunity.description}`);
    } catch (error) {
      console.error(`Failed to implement optimization ${opportunityId}:`, error);
      throw error;
    }
  }

  /**
   * Predict future costs
   */
  async predictFutureCosts(days: number = 30): Promise<CostPrediction> {
    if (!this.predictionModel) {
      throw new Error('Predictive alerts not enabled');
    }

    const prediction = await this.predictionModel.predict(this.costHistory, days);
    
    // Check if prediction exceeds budget
    const dailyBudget = this.config.budgetLimits.daily;
    const monthlyBudget = this.config.budgetLimits.monthly;
    
    if (prediction.projectedMonthlyCost > monthlyBudget) {
      this.createAlert({
        type: 'prediction',
        severity: 'warning',
        service: 'overall',
        message: `Projected monthly cost ($${prediction.projectedMonthlyCost.toFixed(2)}) exceeds budget ($${monthlyBudget})`,
        currentCost: this.currentCosts.total,
        projectedCost: prediction.projectedMonthlyCost,
        recommendations: [
          'Review current usage patterns',
          'Consider implementing cost optimization strategies',
          'Monitor high-cost services more closely'
        ]
      });
    }

    return prediction;
  }

  /**
   * Add cost alert callback
   */
  onCostAlert(callback: (alert: CostAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Generate cost report
   */
  generateCostReport(period: 'day' | 'week' | 'month' = 'month'): CostReport {
    const trends = this.getCostTrends(period);
    const opportunities = this.getOptimizationOpportunities();
    const alerts = this.getActiveAlerts();

    const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
    
    return {
      period,
      currentCosts: this.currentCosts,
      trends,
      budgetUtilization: {
        daily: this.currentCosts.total / this.config.budgetLimits.daily,
        weekly: this.calculateWeeklyCost() / this.config.budgetLimits.weekly,
        monthly: this.calculateMonthlyCost() / this.config.budgetLimits.monthly
      },
      alerts: alerts.length,
      optimizationOpportunities: opportunities.length,
      potentialSavings: totalPotentialSavings,
      recommendations: this.generateRecommendations(),
      timestamp: Date.now()
    };
  }

  // Private methods

  private updateTotalCost(): void {
    this.currentCosts.total = 
      Object.values(this.currentCosts.firebase).reduce((sum, cost) => sum + cost, 0) +
      Object.values(this.currentCosts.cdn).reduce((sum, cost) => sum + cost, 0) +
      Object.values(this.currentCosts.infrastructure).reduce((sum, cost) => sum + cost, 0);
  }

  private checkBudgetAlerts(): void {
    const dailyCost = this.currentCosts.total;
    const weeklyCost = this.calculateWeeklyCost();
    const monthlyCost = this.calculateMonthlyCost();

    // Check daily budget
    this.checkBudgetThreshold('daily', dailyCost, this.config.budgetLimits.daily);
    
    // Check weekly budget
    this.checkBudgetThreshold('weekly', weeklyCost, this.config.budgetLimits.weekly);
    
    // Check monthly budget
    this.checkBudgetThreshold('monthly', monthlyCost, this.config.budgetLimits.monthly);
  }

  private checkBudgetThreshold(period: string, currentCost: number, budgetLimit: number): void {
    const utilization = currentCost / budgetLimit;
    
    let severity: 'warning' | 'critical' | 'emergency' | null = null;
    if (utilization >= this.config.alertThresholds.emergency) {
      severity = 'emergency';
    } else if (utilization >= this.config.alertThresholds.critical) {
      severity = 'critical';
    } else if (utilization >= this.config.alertThresholds.warning) {
      severity = 'warning';
    }

    if (severity) {
      this.createAlert({
        type: 'budget',
        severity,
        service: 'overall',
        message: `${period.charAt(0).toUpperCase() + period.slice(1)} budget utilization at ${(utilization * 100).toFixed(1)}%`,
        currentCost,
        budgetLimit,
        utilizationPercentage: utilization * 100,
        recommendations: this.getBudgetRecommendations(period, utilization)
      });
    }
  }

  private detectCostSpikes(): void {
    if (this.costHistory.length < 2) return;

    const currentCost = this.currentCosts.total;
    const previousCost = this.costHistory[this.costHistory.length - 1]?.costs.total || 0;
    
    if (previousCost === 0) return;

    const spikeThreshold = 1.5; // 50% increase
    const spikeRatio = currentCost / previousCost;

    if (spikeRatio > spikeThreshold) {
      this.createAlert({
        type: 'spike',
        severity: 'warning',
        service: 'overall',
        message: `Cost spike detected: ${((spikeRatio - 1) * 100).toFixed(1)}% increase`,
        currentCost,
        recommendations: [
          'Review recent usage patterns',
          'Check for unusual activity',
          'Consider implementing rate limiting'
        ]
      });
    }
  }

  private createAlert(alertData: Omit<CostAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: CostAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);
    
    // Trigger callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in cost alert callback:', error);
      }
    });

    console.warn(`Cost alert: ${alert.message}`);
  }

  private setupOptimizationOpportunities(): void {
    // Firebase optimization opportunities
    this.optimizationOpportunities.set('firestore-caching', {
      id: 'firestore-caching',
      service: 'firebase',
      description: 'Implement Firestore read caching to reduce read operations',
      potentialSavings: 50,
      effort: 'medium',
      impact: 'high',
      implementation: async () => {
        // Implementation would enable caching
        console.log('Firestore caching optimization implemented');
      },
      estimatedTimeToImplement: 4
    });

    this.optimizationOpportunities.set('image-optimization', {
      id: 'image-optimization',
      service: 'cdn',
      description: 'Enable image compression and modern format conversion',
      potentialSavings: 75,
      effort: 'low',
      impact: 'high',
      implementation: async () => {
        // Implementation would enable image optimization
        console.log('Image optimization implemented');
      },
      estimatedTimeToImplement: 2
    });

    this.optimizationOpportunities.set('function-caching', {
      id: 'function-caching',
      service: 'firebase',
      description: 'Cache Cloud Function results to reduce invocations',
      potentialSavings: 30,
      effort: 'medium',
      impact: 'medium',
      implementation: async () => {
        // Implementation would enable function caching
        console.log('Function caching optimization implemented');
      },
      estimatedTimeToImplement: 6
    });
  }

  private startCostMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      // Record current costs in history
      this.costHistory.push({
        timestamp: Date.now(),
        costs: { ...this.currentCosts }
      });

      // Keep history manageable (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      this.costHistory = this.costHistory.filter(entry => entry.timestamp > thirtyDaysAgo);

      // Run predictive analysis if enabled
      if (this.config.enablePredictiveAlerts && this.predictionModel) {
        this.runPredictiveAnalysis();
      }

      // Auto-implement optimizations if enabled
      if (this.config.enableAutomaticOptimization) {
        this.runAutomaticOptimizations();
      }

    }, 60000); // Every minute
  }

  private startCostReporting(): void {
    this.reportingInterval = setInterval(() => {
      const report = this.generateCostReport();
      console.log('Cost Report:', report);
      
      // You could send this report to external systems
      this.sendCostReport(report);
    }, this.config.reportingInterval);
  }

  private async runPredictiveAnalysis(): Promise<void> {
    try {
      const prediction = await this.predictFutureCosts();
      // Prediction alerts are created within predictFutureCosts method
    } catch (error) {
      console.error('Predictive analysis failed:', error);
    }
  }

  private async runAutomaticOptimizations(): Promise<void> {
    const opportunities = this.getOptimizationOpportunities();
    
    // Auto-implement low-effort, high-impact optimizations
    const autoOptimizations = opportunities.filter(opp => 
      opp.effort === 'low' && opp.impact === 'high' && opp.potentialSavings > 20
    );

    for (const optimization of autoOptimizations) {
      try {
        await this.implementOptimization(optimization.id);
      } catch (error) {
        console.error(`Auto-optimization failed: ${optimization.id}`, error);
      }
    }
  }

  private calculateWeeklyCost(): number {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyHistory = this.costHistory.filter(entry => entry.timestamp > weekAgo);
    
    if (weeklyHistory.length === 0) return this.currentCosts.total;
    
    return weeklyHistory.reduce((sum, entry) => sum + entry.costs.total, 0) / weeklyHistory.length;
  }

  private calculateMonthlyCost(): number {
    const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const monthlyHistory = this.costHistory.filter(entry => entry.timestamp > monthAgo);
    
    if (monthlyHistory.length === 0) return this.currentCosts.total;
    
    return monthlyHistory.reduce((sum, entry) => sum + entry.costs.total, 0) / monthlyHistory.length;
  }

  private getBudgetRecommendations(period: string, utilization: number): string[] {
    const recommendations: string[] = [];
    
    if (utilization > 0.9) {
      recommendations.push(`Immediate action required for ${period} budget`);
      recommendations.push('Consider pausing non-essential services');
    } else if (utilization > 0.8) {
      recommendations.push(`Review ${period} usage patterns`);
      recommendations.push('Implement cost optimization strategies');
    } else {
      recommendations.push(`Monitor ${period} spending closely`);
      recommendations.push('Consider preventive optimizations');
    }
    
    return recommendations;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const trends = this.getCostTrends('week');
    
    if (trends.trend === 'increasing' && trends.growthRate > 20) {
      recommendations.push('Cost growth rate is concerning, review usage patterns');
    }
    
    const opportunities = this.getOptimizationOpportunities();
    const highImpactOpportunities = opportunities.filter(opp => opp.impact === 'high');
    
    if (highImpactOpportunities.length > 0) {
      recommendations.push(`${highImpactOpportunities.length} high-impact optimization opportunities available`);
    }
    
    return recommendations;
  }

  private sendCostReport(report: CostReport): void {
    // Implementation would send report to external systems
    // For now, just log it
    console.log('Cost report generated:', {
      period: report.period,
      totalCost: report.currentCosts.total,
      budgetUtilization: report.budgetUtilization,
      alerts: report.alerts,
      potentialSavings: report.potentialSavings
    });
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy cost monitoring system
   */
  destroy(): void {
    // Clear intervals
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.reportingInterval) clearInterval(this.reportingInterval);

    // Clear data
    this.costHistory = [];
    this.alerts.clear();
    this.optimizationOpportunities.clear();
    this.alertCallbacks = [];

    console.log('Cost monitoring system destroyed');
  }
}

// Supporting classes and interfaces

class CostPredictionModel {
  async predict(history: Array<{ timestamp: number; costs: CostBreakdown }>, days: number): Promise<CostPrediction> {
    // Simplified prediction model
    if (history.length < 7) {
      return {
        projectedDailyCost: 0,
        projectedWeeklyCost: 0,
        projectedMonthlyCost: 0,
        confidence: 0
      };
    }

    // Calculate average daily growth rate
    const recentHistory = history.slice(-7); // Last 7 days
    const dailyGrowthRates = [];
    
    for (let i = 1; i < recentHistory.length; i++) {
      const current = recentHistory[i].costs.total;
      const previous = recentHistory[i - 1].costs.total;
      
      if (previous > 0) {
        dailyGrowthRates.push((current - previous) / previous);
      }
    }

    const averageGrowthRate = dailyGrowthRates.reduce((sum, rate) => sum + rate, 0) / dailyGrowthRates.length;
    const currentDailyCost = recentHistory[recentHistory.length - 1].costs.total;

    // Project future costs
    const projectedDailyCost = currentDailyCost * (1 + averageGrowthRate);
    const projectedWeeklyCost = projectedDailyCost * 7;
    const projectedMonthlyCost = projectedDailyCost * 30;

    return {
      projectedDailyCost,
      projectedWeeklyCost,
      projectedMonthlyCost,
      confidence: Math.min(0.9, dailyGrowthRates.length / 7) // Higher confidence with more data
    };
  }
}

interface CostPrediction {
  projectedDailyCost: number;
  projectedWeeklyCost: number;
  projectedMonthlyCost: number;
  confidence: number;
}

interface CostReport {
  period: 'day' | 'week' | 'month';
  currentCosts: CostBreakdown;
  trends: CostTrend;
  budgetUtilization: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  alerts: number;
  optimizationOpportunities: number;
  potentialSavings: number;
  recommendations: string[];
  timestamp: number;
}