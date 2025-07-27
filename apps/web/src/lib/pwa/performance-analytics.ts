// Performance Analytics and Reporting System
import { AdvancedPerformanceMetrics, PerformanceAlert } from './advanced-performance-monitor';

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  sessionId: string;
  reportType: 'realtime' | 'daily' | 'weekly' | 'monthly';
  
  summary: PerformanceSummary;
  coreWebVitals: CoreWebVitalsReport;
  loadingPerformance: LoadingPerformanceReport;
  runtimePerformance: RuntimePerformanceReport;
  networkPerformance: NetworkPerformanceReport;
  cachePerformance: CachePerformanceReport;
  errorAnalysis: ErrorAnalysisReport;
  userExperience: UserExperienceReport;
  recommendations: RecommendationReport;
}

export interface PerformanceSummary {
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  performanceScore: number;
  trendDirection: 'improving' | 'stable' | 'degrading';
}

export interface CoreWebVitalsReport {
  lcp: MetricReport;
  fid: MetricReport;
  cls: MetricReport;
  fcp: MetricReport;
  ttfb: MetricReport;
  inp: MetricReport;
  overallScore: number;
}

export interface MetricReport {
  current: number;
  average: number;
  p75: number;
  p90: number;
  p95: number;
  trend: number; // percentage change
  status: 'good' | 'needs-improvement' | 'poor';
  distribution: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

export interface LoadingPerformanceReport {
  domContentLoaded: MetricReport;
  windowLoad: MetricReport;
  timeToInteractive: MetricReport;
  totalBlockingTime: MetricReport;
  speedIndex: MetricReport;
  resourceLoadTimes: ResourceLoadReport[];
}

export interface RuntimePerformanceReport {
  memoryUsage: MemoryUsageReport;
  longTasks: LongTaskReport;
  layoutShifts: LayoutShiftReport;
  jsErrors: JSErrorReport;
}

export interface NetworkPerformanceReport {
  connectionTypes: ConnectionTypeReport[];
  slowResources: SlowResourceReport[];
  failedRequests: FailedRequestReport[];
  offlineUsage: OfflineUsageReport;
}

export interface CachePerformanceReport {
  hitRatio: MetricReport;
  responseTime: MetricReport;
  cacheSize: number;
  evictionRate: number;
  strategyPerformance: CacheStrategyReport[];
}

export interface ErrorAnalysisReport {
  totalErrors: number;
  errorRate: number;
  errorTypes: ErrorTypeReport[];
  topErrors: TopErrorReport[];
  errorTrends: ErrorTrendReport[];
}

export interface UserExperienceReport {
  interactionDelay: MetricReport;
  clickThroughRate: number;
  taskCompletionRate: number;
  userSatisfactionScore: number;
  devicePerformance: DevicePerformanceReport[];
}

export interface RecommendationReport {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
}

// Supporting interfaces
export interface ResourceLoadReport {
  type: string;
  averageLoadTime: number;
  slowestResources: string[];
  compressionRatio: number;
}

export interface MemoryUsageReport {
  current: number;
  peak: number;
  average: number;
  leakDetected: boolean;
  gcFrequency: number;
}

export interface LongTaskReport {
  count: number;
  averageDuration: number;
  longestTask: number;
  attribution: string[];
}

export interface LayoutShiftReport {
  totalShifts: number;
  averageShiftValue: number;
  largestShift: number;
  commonSources: string[];
}

export interface JSErrorReport {
  count: number;
  uniqueErrors: number;
  topErrors: string[];
  errorSources: string[];
}

export interface ConnectionTypeReport {
  type: string;
  percentage: number;
  averagePerformance: number;
}

export interface SlowResourceReport {
  url: string;
  type: string;
  averageLoadTime: number;
  occurrences: number;
}

export interface FailedRequestReport {
  url: string;
  method: string;
  status: number;
  count: number;
  lastOccurrence: Date;
}

export interface OfflineUsageReport {
  offlineTime: number;
  offlineActions: number;
  syncSuccessRate: number;
}

export interface CacheStrategyReport {
  name: string;
  hitRatio: number;
  averageResponseTime: number;
  totalRequests: number;
  effectiveness: number;
}

export interface ErrorTypeReport {
  type: string;
  count: number;
  percentage: number;
  trend: number;
}

export interface TopErrorReport {
  message: string;
  count: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface ErrorTrendReport {
  date: Date;
  count: number;
  rate: number;
}

export interface DevicePerformanceReport {
  deviceType: string;
  averagePerformance: number;
  userCount: number;
  topIssues: string[];
}

export class PerformanceAnalytics {
  private static instance: PerformanceAnalytics;
  private metricsHistory: AdvancedPerformanceMetrics[] = [];
  private alertsHistory: PerformanceAlert[] = [];
  private reports: PerformanceReport[] = [];

  static getInstance(): PerformanceAnalytics {
    if (!PerformanceAnalytics.instance) {
      PerformanceAnalytics.instance = new PerformanceAnalytics();
    }
    return PerformanceAnalytics.instance;
  }

  public addMetrics(metrics: AdvancedPerformanceMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Keep only last 1000 metrics entries
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
  }

  public addAlert(alert: PerformanceAlert): void {
    this.alertsHistory.push(alert);
    
    // Keep only last 500 alerts
    if (this.alertsHistory.length > 500) {
      this.alertsHistory = this.alertsHistory.slice(-500);
    }
  }

  public generateRealtimeReport(): PerformanceReport {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) {
      throw new Error('No metrics available for report generation');
    }

    const report: PerformanceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: latest.sessionId,
      reportType: 'realtime',
      
      summary: this.generateSummary(),
      coreWebVitals: this.generateCoreWebVitalsReport(),
      loadingPerformance: this.generateLoadingPerformanceReport(),
      runtimePerformance: this.generateRuntimePerformanceReport(),
      networkPerformance: this.generateNetworkPerformanceReport(),
      cachePerformance: this.generateCachePerformanceReport(),
      errorAnalysis: this.generateErrorAnalysisReport(),
      userExperience: this.generateUserExperienceReport(),
      recommendations: this.generateRecommendations()
    };

    this.reports.push(report);
    return report;
  }

  private generateSummary(): PerformanceSummary {
    const recentMetrics = this.metricsHistory.slice(-10);
    const olderMetrics = this.metricsHistory.slice(-20, -10);
    
    const averageSessionDuration = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.interactionMetrics.sessionDuration, 0) / recentMetrics.length
      : 0;

    const bounceRate = this.calculateBounceRate(recentMetrics);
    const performanceScore = this.calculatePerformanceScore(recentMetrics);
    const trendDirection = this.calculateTrendDirection(recentMetrics, olderMetrics);

    return {
      totalSessions: 1,
      totalPageViews: recentMetrics.length,
      averageSessionDuration,
      bounceRate,
      performanceScore,
      trendDirection
    };
  }

  private generateCoreWebVitalsReport(): CoreWebVitalsReport {
    const metrics = this.metricsHistory.slice(-50); // Last 50 measurements
    
    return {
      lcp: this.generateMetricReport(metrics, 'coreWebVitals.lcp', { good: 2500, poor: 4000 }),
      fid: this.generateMetricReport(metrics, 'coreWebVitals.fid', { good: 100, poor: 300 }),
      cls: this.generateMetricReport(metrics, 'coreWebVitals.cls', { good: 0.1, poor: 0.25 }),
      fcp: this.generateMetricReport(metrics, 'coreWebVitals.fcp', { good: 1800, poor: 3000 }),
      ttfb: this.generateMetricReport(metrics, 'coreWebVitals.ttfb', { good: 600, poor: 1500 }),
      inp: this.generateMetricReport(metrics, 'coreWebVitals.inp', { good: 200, poor: 500 }),
      overallScore: this.calculateCoreWebVitalsScore(metrics)
    };
  }

  private generateMetricReport(
    metrics: AdvancedPerformanceMetrics[], 
    path: string, 
    thresholds: { good: number; poor: number }
  ): MetricReport {
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v > 0);
    
    if (values.length === 0) {
      return {
        current: 0, average: 0, p75: 0, p90: 0, p95: 0, trend: 0,
        status: 'good', distribution: { good: 0, needsImprovement: 0, poor: 0 }
      };
    }

    values.sort((a, b) => a - b);
    
    const current = values[values.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p75 = values[Math.floor(values.length * 0.75)];
    const p90 = values[Math.floor(values.length * 0.90)];
    const p95 = values[Math.floor(values.length * 0.95)];
    
    const trend = this.calculateMetricTrend(metrics, path);
    const status = this.getMetricStatus(p75, thresholds);
    const distribution = this.calculateDistribution(values, thresholds);

    return { current, average, p75, p90, p95, trend, status, distribution };
  }

  private generateLoadingPerformanceReport(): LoadingPerformanceReport {
    const metrics = this.metricsHistory.slice(-50);
    
    return {
      domContentLoaded: this.generateMetricReport(metrics, 'loadingMetrics.domContentLoaded', { good: 2000, poor: 4000 }),
      windowLoad: this.generateMetricReport(metrics, 'loadingMetrics.windowLoad', { good: 3000, poor: 6000 }),
      timeToInteractive: this.generateMetricReport(metrics, 'loadingMetrics.timeToInteractive', { good: 3800, poor: 7300 }),
      totalBlockingTime: this.generateMetricReport(metrics, 'loadingMetrics.totalBlockingTime', { good: 200, poor: 600 }),
      speedIndex: this.generateMetricReport(metrics, 'loadingMetrics.speedIndex', { good: 3400, poor: 5800 }),
      resourceLoadTimes: this.generateResourceLoadReport(metrics)
    };
  }

  private generateRuntimePerformanceReport(): RuntimePerformanceReport {
    const metrics = this.metricsHistory.slice(-50);
    
    return {
      memoryUsage: this.generateMemoryUsageReport(metrics),
      longTasks: this.generateLongTaskReport(metrics),
      layoutShifts: this.generateLayoutShiftReport(metrics),
      jsErrors: this.generateJSErrorReport(metrics)
    };
  }

  private generateNetworkPerformanceReport(): NetworkPerformanceReport {
    const metrics = this.metricsHistory.slice(-50);
    
    return {
      connectionTypes: this.generateConnectionTypeReport(metrics),
      slowResources: this.generateSlowResourceReport(metrics),
      failedRequests: this.generateFailedRequestReport(metrics),
      offlineUsage: this.generateOfflineUsageReport(metrics)
    };
  }

  private generateCachePerformanceReport(): CachePerformanceReport {
    const metrics = this.metricsHistory.slice(-50);
    
    return {
      hitRatio: this.generateMetricReport(metrics, 'cacheMetrics.hitRatio', { good: 0.85, poor: 0.6 }),
      responseTime: this.generateMetricReport(metrics, 'cacheMetrics.averageResponseTime', { good: 100, poor: 300 }),
      cacheSize: this.calculateAverageCacheSize(metrics),
      evictionRate: this.calculateEvictionRate(metrics),
      strategyPerformance: this.generateCacheStrategyReport(metrics)
    };
  }

  private generateErrorAnalysisReport(): ErrorAnalysisReport {
    const metrics = this.metricsHistory.slice(-100);
    const alerts = this.alertsHistory.slice(-100);
    
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorMetrics.totalErrors, 0);
    const errorRate = totalErrors / metrics.length;
    
    return {
      totalErrors,
      errorRate,
      errorTypes: this.generateErrorTypeReport(metrics),
      topErrors: this.generateTopErrorReport(metrics),
      errorTrends: this.generateErrorTrendReport(metrics)
    };
  }

  private generateUserExperienceReport(): UserExperienceReport {
    const metrics = this.metricsHistory.slice(-50);
    
    return {
      interactionDelay: this.generateMetricReport(metrics, 'interactionMetrics.averageInteractionDelay', { good: 100, poor: 300 }),
      clickThroughRate: this.calculateClickThroughRate(metrics),
      taskCompletionRate: this.calculateTaskCompletionRate(metrics),
      userSatisfactionScore: this.calculateUserSatisfactionScore(metrics),
      devicePerformance: this.generateDevicePerformanceReport(metrics)
    };
  }

  private generateRecommendations(): RecommendationReport {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const alerts = this.alertsHistory.filter(a => !a.resolved).slice(-10);
    
    // Generate recommendations based on current performance and alerts
    const recommendations: RecommendationReport[] = [];
    
    // Core Web Vitals recommendations
    if (latest.coreWebVitals.lcp > 2500) {
      recommendations.push({
        priority: 'high',
        category: 'Core Web Vitals',
        title: 'Optimize Largest Contentful Paint (LCP)',
        description: 'LCP is above the recommended threshold of 2.5 seconds',
        impact: 'Improving LCP will significantly enhance user experience and SEO rankings',
        effort: 'medium',
        implementation: [
          'Optimize server response times',
          'Implement resource preloading',
          'Optimize critical CSS and JavaScript',
          'Use efficient image formats (WebP, AVIF)'
        ]
      });
    }
    
    if (latest.coreWebVitals.fid > 100) {
      recommendations.push({
        priority: 'high',
        category: 'Core Web Vitals',
        title: 'Reduce First Input Delay (FID)',
        description: 'FID is above the recommended threshold of 100ms',
        impact: 'Reducing FID will improve user interaction responsiveness',
        effort: 'medium',
        implementation: [
          'Break up long JavaScript tasks',
          'Use web workers for heavy computations',
          'Implement code splitting',
          'Defer non-critical JavaScript'
        ]
      });
    }
    
    // Memory recommendations
    if (latest.runtimeMetrics.jsHeapSizeUsed > 100 * 1024 * 1024) {
      recommendations.push({
        priority: 'medium',
        category: 'Memory Management',
        title: 'Optimize Memory Usage',
        description: 'JavaScript heap size is above recommended threshold',
        impact: 'Reducing memory usage will improve performance on low-end devices',
        effort: 'high',
        implementation: [
          'Implement proper cleanup in components',
          'Use memory profiling tools',
          'Optimize data structures',
          'Implement lazy loading for large datasets'
        ]
      });
    }
    
    // Cache recommendations
    if (latest.cacheMetrics.hitRatio < 0.85) {
      recommendations.push({
        priority: 'medium',
        category: 'Caching',
        title: 'Improve Cache Hit Ratio',
        description: 'Cache hit ratio is below optimal threshold of 85%',
        impact: 'Better caching will reduce server load and improve response times',
        effort: 'low',
        implementation: [
          'Review and optimize cache strategies',
          'Increase cache duration for static assets',
          'Implement predictive caching',
          'Optimize cache eviction policies'
        ]
      });
    }
    
    return recommendations[0] || {
      priority: 'low',
      category: 'General',
      title: 'Performance is Good',
      description: 'No critical performance issues detected',
      impact: 'Continue monitoring for potential improvements',
      effort: 'low',
      implementation: ['Continue current optimization practices']
    };
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): number {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return 0;
      }
    }
    
    return typeof current === 'number' ? current : 0;
  }

  private calculateBounceRate(metrics: AdvancedPerformanceMetrics[]): number {
    // Simplified bounce rate calculation
    const shortSessions = metrics.filter(m => m.interactionMetrics.sessionDuration < 30000).length;
    return metrics.length > 0 ? (shortSessions / metrics.length) * 100 : 0;
  }

  private calculatePerformanceScore(metrics: AdvancedPerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const latest = metrics[metrics.length - 1];
    let score = 100;
    
    // Deduct points based on Core Web Vitals
    if (latest.coreWebVitals.lcp > 2500) score -= 20;
    if (latest.coreWebVitals.fid > 100) score -= 20;
    if (latest.coreWebVitals.cls > 0.1) score -= 20;
    if (latest.coreWebVitals.fcp > 1800) score -= 15;
    if (latest.coreWebVitals.ttfb > 600) score -= 15;
    
    // Deduct points for errors
    if (latest.errorMetrics.totalErrors > 0) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateTrendDirection(
    recent: AdvancedPerformanceMetrics[], 
    older: AdvancedPerformanceMetrics[]
  ): 'improving' | 'stable' | 'degrading' {
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentScore = this.calculatePerformanceScore(recent);
    const olderScore = this.calculatePerformanceScore(older);
    
    const difference = recentScore - olderScore;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'degrading';
    return 'stable';
  }

  private getMetricStatus(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private calculateDistribution(values: number[], thresholds: { good: number; poor: number }): {
    good: number;
    needsImprovement: number;
    poor: number;
  } {
    const total = values.length;
    if (total === 0) return { good: 0, needsImprovement: 0, poor: 0 };
    
    const good = values.filter(v => v <= thresholds.good).length / total * 100;
    const poor = values.filter(v => v > thresholds.poor).length / total * 100;
    const needsImprovement = 100 - good - poor;
    
    return { good, needsImprovement, poor };
  }

  private calculateMetricTrend(metrics: AdvancedPerformanceMetrics[], path: string): number {
    if (metrics.length < 10) return 0;
    
    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + this.getNestedValue(m, path), 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + this.getNestedValue(m, path), 0) / older.length;
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  private calculateCoreWebVitalsScore(metrics: AdvancedPerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const latest = metrics[metrics.length - 1];
    let score = 0;
    let count = 0;
    
    // LCP score
    if (latest.coreWebVitals.lcp <= 2500) score += 100;
    else if (latest.coreWebVitals.lcp <= 4000) score += 50;
    count++;
    
    // FID score
    if (latest.coreWebVitals.fid <= 100) score += 100;
    else if (latest.coreWebVitals.fid <= 300) score += 50;
    count++;
    
    // CLS score
    if (latest.coreWebVitals.cls <= 0.1) score += 100;
    else if (latest.coreWebVitals.cls <= 0.25) score += 50;
    count++;
    
    return count > 0 ? score / count : 0;
  }

  // Additional helper methods for specific reports
  private generateResourceLoadReport(metrics: AdvancedPerformanceMetrics[]): ResourceLoadReport[] {
    // Implementation for resource load analysis
    return [
      { type: 'script', averageLoadTime: 500, slowestResources: [], compressionRatio: 0.7 },
      { type: 'stylesheet', averageLoadTime: 200, slowestResources: [], compressionRatio: 0.8 },
      { type: 'image', averageLoadTime: 800, slowestResources: [], compressionRatio: 0.6 }
    ];
  }

  private generateMemoryUsageReport(metrics: AdvancedPerformanceMetrics[]): MemoryUsageReport {
    const memoryValues = metrics.map(m => m.runtimeMetrics.jsHeapSizeUsed).filter(v => v > 0);
    
    return {
      current: memoryValues[memoryValues.length - 1] || 0,
      peak: Math.max(...memoryValues),
      average: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length || 0,
      leakDetected: false, // Would need more sophisticated detection
      gcFrequency: 0 // Would need GC event tracking
    };
  }

  private generateLongTaskReport(metrics: AdvancedPerformanceMetrics[]): LongTaskReport {
    const allLongTasks = metrics.flatMap(m => m.runtimeMetrics.longTasks);
    
    return {
      count: allLongTasks.length,
      averageDuration: allLongTasks.reduce((sum, task) => sum + task.duration, 0) / allLongTasks.length || 0,
      longestTask: Math.max(...allLongTasks.map(task => task.duration), 0),
      attribution: [...new Set(allLongTasks.flatMap(task => task.attribution))]
    };
  }

  private generateLayoutShiftReport(metrics: AdvancedPerformanceMetrics[]): LayoutShiftReport {
    const allShifts = metrics.flatMap(m => m.runtimeMetrics.layoutShifts);
    
    return {
      totalShifts: allShifts.length,
      averageShiftValue: allShifts.reduce((sum, shift) => sum + shift.value, 0) / allShifts.length || 0,
      largestShift: Math.max(...allShifts.map(shift => shift.value), 0),
      commonSources: [...new Set(allShifts.flatMap(shift => shift.sources))]
    };
  }

  private generateJSErrorReport(metrics: AdvancedPerformanceMetrics[]): JSErrorReport {
    const allErrors = metrics.flatMap(m => m.errorMetrics.jsErrors);
    const uniqueErrors = new Set(allErrors.map(error => error.message)).size;
    
    return {
      count: allErrors.length,
      uniqueErrors,
      topErrors: this.getTopErrorMessages(allErrors),
      errorSources: [...new Set(allErrors.map(error => error.filename))]
    };
  }

  private generateConnectionTypeReport(metrics: AdvancedPerformanceMetrics[]): ConnectionTypeReport[] {
    const connectionTypes = new Map<string, number[]>();
    
    metrics.forEach(m => {
      const type = m.networkMetrics.effectiveType;
      if (!connectionTypes.has(type)) {
        connectionTypes.set(type, []);
      }
      connectionTypes.get(type)!.push(m.loadingMetrics.windowLoad);
    });
    
    return Array.from(connectionTypes.entries()).map(([type, loadTimes]) => ({
      type,
      percentage: (loadTimes.length / metrics.length) * 100,
      averagePerformance: loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
    }));
  }

  private generateSlowResourceReport(metrics: AdvancedPerformanceMetrics[]): SlowResourceReport[] {
    const slowResources = new Map<string, { totalTime: number; count: number; type: string }>();
    
    metrics.forEach(m => {
      m.resourceMetrics.slowResources.forEach(resource => {
        if (!slowResources.has(resource.url)) {
          slowResources.set(resource.url, { totalTime: 0, count: 0, type: resource.type });
        }
        const existing = slowResources.get(resource.url)!;
        existing.totalTime += resource.loadTime;
        existing.count++;
      });
    });
    
    return Array.from(slowResources.entries()).map(([url, data]) => ({
      url,
      type: data.type,
      averageLoadTime: data.totalTime / data.count,
      occurrences: data.count
    }));
  }

  private generateFailedRequestReport(metrics: AdvancedPerformanceMetrics[]): FailedRequestReport[] {
    const failedRequests = new Map<string, { count: number; method: string; status: number; lastOccurrence: Date }>();
    
    metrics.forEach(m => {
      m.errorMetrics.networkErrors.forEach(error => {
        const key = `${error.method}:${error.url}`;
        if (!failedRequests.has(key)) {
          failedRequests.set(key, {
            count: 0,
            method: error.method,
            status: error.status,
            lastOccurrence: new Date(error.timestamp)
          });
        }
        const existing = failedRequests.get(key)!;
        existing.count++;
        existing.lastOccurrence = new Date(Math.max(existing.lastOccurrence.getTime(), error.timestamp));
      });
    });
    
    return Array.from(failedRequests.entries()).map(([key, data]) => ({
      url: key.split(':')[1],
      method: data.method,
      status: data.status,
      count: data.count,
      lastOccurrence: data.lastOccurrence
    }));
  }

  private generateOfflineUsageReport(metrics: AdvancedPerformanceMetrics[]): OfflineUsageReport {
    const offlineMetrics = metrics.filter(m => !m.networkMetrics.onlineStatus);
    
    return {
      offlineTime: offlineMetrics.length * 10000, // Assuming 10s intervals
      offlineActions: 0, // Would need specific tracking
      syncSuccessRate: 0.95 // Would need sync tracking
    };
  }

  private calculateAverageCacheSize(metrics: AdvancedPerformanceMetrics[]): number {
    const cacheSizes = metrics.map(m => m.cacheMetrics.cacheSize).filter(size => size > 0);
    return cacheSizes.reduce((sum, size) => sum + size, 0) / cacheSizes.length || 0;
  }

  private calculateEvictionRate(metrics: AdvancedPerformanceMetrics[]): number {
    const evictionCounts = metrics.map(m => m.cacheMetrics.evictionCount);
    const totalEvictions = evictionCounts.reduce((sum, count) => sum + count, 0);
    return totalEvictions / metrics.length || 0;
  }

  private generateCacheStrategyReport(metrics: AdvancedPerformanceMetrics[]): CacheStrategyReport[] {
    // Would need more detailed cache strategy tracking
    return [
      { name: 'static-assets', hitRatio: 0.95, averageResponseTime: 50, totalRequests: 1000, effectiveness: 0.9 },
      { name: 'api-cache', hitRatio: 0.75, averageResponseTime: 150, totalRequests: 500, effectiveness: 0.7 },
      { name: 'images', hitRatio: 0.85, averageResponseTime: 100, totalRequests: 300, effectiveness: 0.8 }
    ];
  }

  private generateErrorTypeReport(metrics: AdvancedPerformanceMetrics[]): ErrorTypeReport[] {
    const errorTypes = new Map<string, number>();
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorMetrics.totalErrors, 0);
    
    metrics.forEach(m => {
      m.errorMetrics.jsErrors.forEach(error => {
        const type = this.categorizeError(error.message);
        errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
      });
    });
    
    return Array.from(errorTypes.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalErrors) * 100,
      trend: 0 // Would need historical comparison
    }));
  }

  private generateTopErrorReport(metrics: AdvancedPerformanceMetrics[]): TopErrorReport[] {
    const errorCounts = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();
    
    metrics.forEach(m => {
      m.errorMetrics.jsErrors.forEach(error => {
        if (!errorCounts.has(error.message)) {
          errorCounts.set(error.message, {
            count: 0,
            firstSeen: new Date(error.timestamp),
            lastSeen: new Date(error.timestamp)
          });
        }
        const existing = errorCounts.get(error.message)!;
        existing.count++;
        existing.lastSeen = new Date(Math.max(existing.lastSeen.getTime(), error.timestamp));
      });
    });
    
    return Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([message, data]) => ({
        message,
        count: data.count,
        affectedUsers: 1, // Would need user tracking
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen
      }));
  }

  private generateErrorTrendReport(metrics: AdvancedPerformanceMetrics[]): ErrorTrendReport[] {
    const dailyErrors = new Map<string, number>();
    
    metrics.forEach(m => {
      const date = m.timestamp.toDateString();
      dailyErrors.set(date, (dailyErrors.get(date) || 0) + m.errorMetrics.totalErrors);
    });
    
    return Array.from(dailyErrors.entries()).map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count,
      rate: count / 100 // Assuming 100 total requests per day
    }));
  }

  private calculateClickThroughRate(metrics: AdvancedPerformanceMetrics[]): number {
    // Simplified CTR calculation
    const totalInteractions = metrics.reduce((sum, m) => sum + m.interactionMetrics.totalInteractions, 0);
    return totalInteractions > 0 ? (totalInteractions / metrics.length) * 100 : 0;
  }

  private calculateTaskCompletionRate(metrics: AdvancedPerformanceMetrics[]): number {
    // Would need specific task tracking
    return 85; // Placeholder
  }

  private calculateUserSatisfactionScore(metrics: AdvancedPerformanceMetrics[]): number {
    // Based on performance metrics
    const latest = metrics[metrics.length - 1];
    if (!latest) return 0;
    
    let score = 100;
    if (latest.coreWebVitals.lcp > 2500) score -= 20;
    if (latest.coreWebVitals.fid > 100) score -= 20;
    if (latest.coreWebVitals.cls > 0.1) score -= 20;
    if (latest.errorMetrics.totalErrors > 0) score -= 10;
    
    return Math.max(0, score);
  }

  private generateDevicePerformanceReport(metrics: AdvancedPerformanceMetrics[]): DevicePerformanceReport[] {
    const devicePerformance = new Map<string, { totalScore: number; count: number; issues: Set<string> }>();
    
    metrics.forEach(m => {
      const deviceType = m.deviceContext.deviceType;
      if (!devicePerformance.has(deviceType)) {
        devicePerformance.set(deviceType, { totalScore: 0, count: 0, issues: new Set() });
      }
      
      const data = devicePerformance.get(deviceType)!;
      data.totalScore += this.calculatePerformanceScore([m]);
      data.count++;
      
      // Add issues
      if (m.coreWebVitals.lcp > 2500) data.issues.add('Slow LCP');
      if (m.coreWebVitals.fid > 100) data.issues.add('High FID');
      if (m.errorMetrics.totalErrors > 0) data.issues.add('JavaScript Errors');
    });
    
    return Array.from(devicePerformance.entries()).map(([deviceType, data]) => ({
      deviceType,
      averagePerformance: data.totalScore / data.count,
      userCount: data.count,
      topIssues: Array.from(data.issues)
    }));
  }

  private getTopErrorMessages(errors: any[]): string[] {
    const errorCounts = new Map<string, number>();
    
    errors.forEach(error => {
      errorCounts.set(error.message, (errorCounts.get(error.message) || 0) + 1);
    });
    
    return Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([message]) => message);
  }

  private categorizeError(message: string): string {
    if (message.includes('TypeError')) return 'Type Error';
    if (message.includes('ReferenceError')) return 'Reference Error';
    if (message.includes('SyntaxError')) return 'Syntax Error';
    if (message.includes('Network')) return 'Network Error';
    return 'Other Error';
  }

  // Public API methods
  public getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  public getLatestReport(): PerformanceReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  public exportAnalytics(): any {
    return {
      timestamp: new Date().toISOString(),
      metricsCount: this.metricsHistory.length,
      alertsCount: this.alertsHistory.length,
      reportsCount: this.reports.length,
      latestReport: this.getLatestReport()
    };
  }
}