// Performance Alerting and Threshold Management System
import { PerformanceAlert, AdvancedPerformanceMetrics } from './advanced-performance-monitor';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownPeriod: number; // minutes
  notificationChannels: NotificationChannel[];
  conditions?: AlertCondition[];
}

export interface AlertCondition {
  metric: string;
  operator: 'and' | 'or';
  condition: 'greater_than' | 'less_than' | 'equals';
  value: number;
}

export interface NotificationChannel {
  type: 'console' | 'service_worker' | 'webhook' | 'email' | 'slack';
  config: any;
  enabled: boolean;
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  alert: PerformanceAlert;
  notificationsSent: NotificationResult[];
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface NotificationResult {
  channel: string;
  success: boolean;
  timestamp: Date;
  error?: string;
}

export interface AlertingConfig {
  enabled: boolean;
  defaultCooldownPeriod: number;
  maxAlertsPerHour: number;
  enableAutoResolution: boolean;
  autoResolutionTimeout: number; // minutes
}

export class PerformanceAlerting {
  private static instance: PerformanceAlerting;
  private alertRules: Map<string, AlertRule> = new Map();
  private alertHistory: AlertHistory[] = [];
  private lastAlertTimes: Map<string, Date> = new Map();
  private config: AlertingConfig = {
    enabled: true,
    defaultCooldownPeriod: 15, // 15 minutes
    maxAlertsPerHour: 10,
    enableAutoResolution: true,
    autoResolutionTimeout: 60 // 60 minutes
  };

  static getInstance(): PerformanceAlerting {
    if (!PerformanceAlerting.instance) {
      PerformanceAlerting.instance = new PerformanceAlerting();
    }
    return PerformanceAlerting.instance;
  }

  constructor() {
    this.initializeDefaultRules();
    this.startAutoResolutionTimer();
  }

  private initializeDefaultRules(): void {
    // Core Web Vitals Rules
    this.addRule({
      id: 'lcp_threshold',
      name: 'LCP Threshold Exceeded',
      description: 'Largest Contentful Paint is above acceptable threshold',
      metric: 'coreWebVitals.lcp',
      condition: 'greater_than',
      threshold: 2500,
      severity: 'high',
      enabled: true,
      cooldownPeriod: 15,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true },
        { type: 'service_worker', config: {}, enabled: true }
      ]
    });

    this.addRule({
      id: 'fid_threshold',
      name: 'FID Threshold Exceeded',
      description: 'First Input Delay is above acceptable threshold',
      metric: 'coreWebVitals.fid',
      condition: 'greater_than',
      threshold: 100,
      severity: 'high',
      enabled: true,
      cooldownPeriod: 15,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true },
        { type: 'service_worker', config: {}, enabled: true }
      ]
    });

    this.addRule({
      id: 'cls_threshold',
      name: 'CLS Threshold Exceeded',
      description: 'Cumulative Layout Shift is above acceptable threshold',
      metric: 'coreWebVitals.cls',
      condition: 'greater_than',
      threshold: 0.1,
      severity: 'medium',
      enabled: true,
      cooldownPeriod: 15,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true }
      ]
    });

    // Memory Rules
    this.addRule({
      id: 'memory_usage_high',
      name: 'High Memory Usage',
      description: 'JavaScript heap size is approaching limits',
      metric: 'runtimeMetrics.jsHeapSizeUsed',
      condition: 'greater_than',
      threshold: 100 * 1024 * 1024, // 100MB
      severity: 'medium',
      enabled: true,
      cooldownPeriod: 30,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true }
      ]
    });

    this.addRule({
      id: 'memory_usage_critical',
      name: 'Critical Memory Usage',
      description: 'JavaScript heap size is critically high',
      metric: 'runtimeMetrics.jsHeapSizeUsed',
      condition: 'greater_than',
      threshold: 200 * 1024 * 1024, // 200MB
      severity: 'critical',
      enabled: true,
      cooldownPeriod: 10,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true },
        { type: 'service_worker', config: {}, enabled: true }
      ]
    });

    // Error Rules
    this.addRule({
      id: 'js_errors_detected',
      name: 'JavaScript Errors Detected',
      description: 'JavaScript errors are occurring',
      metric: 'errorMetrics.totalErrors',
      condition: 'greater_than',
      threshold: 0,
      severity: 'medium',
      enabled: true,
      cooldownPeriod: 5,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true }
      ]
    });

    // Cache Performance Rules
    this.addRule({
      id: 'cache_hit_ratio_low',
      name: 'Low Cache Hit Ratio',
      description: 'Cache hit ratio is below optimal threshold',
      metric: 'cacheMetrics.hitRatio',
      condition: 'less_than',
      threshold: 0.85,
      severity: 'low',
      enabled: true,
      cooldownPeriod: 60,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true }
      ]
    });

    // Network Performance Rules
    this.addRule({
      id: 'slow_network_detected',
      name: 'Slow Network Connection',
      description: 'User is on a slow network connection',
      metric: 'networkMetrics.effectiveType',
      condition: 'equals',
      threshold: 0, // Would need custom logic for string comparison
      severity: 'low',
      enabled: false, // Disabled by default as it needs custom handling
      cooldownPeriod: 30,
      notificationChannels: [
        { type: 'console', config: {}, enabled: true }
      ]
    });
  }

  public addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  public updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    this.alertRules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  public removeRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  public enableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: true });
  }

  public disableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: false });
  }

  public getRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  public getRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  public evaluateMetrics(metrics: AdvancedPerformanceMetrics): PerformanceAlert[] {
    if (!this.config.enabled) return [];

    const alerts: PerformanceAlert[] = [];
    const now = new Date();

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      const lastAlertTime = this.lastAlertTimes.get(rule.id);
      if (lastAlertTime) {
        const timeSinceLastAlert = now.getTime() - lastAlertTime.getTime();
        const cooldownMs = rule.cooldownPeriod * 60 * 1000;
        if (timeSinceLastAlert < cooldownMs) continue;
      }

      // Evaluate rule
      const alert = this.evaluateRule(rule, metrics);
      if (alert) {
        alerts.push(alert);
        this.lastAlertTimes.set(rule.id, now);
        this.processAlert(rule, alert);
      }
    }

    return alerts;
  }

  private evaluateRule(rule: AlertRule, metrics: AdvancedPerformanceMetrics): PerformanceAlert | null {
    const value = this.getMetricValue(metrics, rule.metric);
    if (value === null) return null;

    let conditionMet = false;

    switch (rule.condition) {
      case 'greater_than':
        conditionMet = value > rule.threshold;
        break;
      case 'less_than':
        conditionMet = value < rule.threshold;
        break;
      case 'equals':
        conditionMet = value === rule.threshold;
        break;
      case 'not_equals':
        conditionMet = value !== rule.threshold;
        break;
      case 'percentage_change':
        // Would need historical data for percentage change
        conditionMet = false;
        break;
    }

    // Evaluate additional conditions if present
    if (conditionMet && rule.conditions) {
      conditionMet = this.evaluateConditions(rule.conditions, metrics);
    }

    if (!conditionMet) return null;

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'threshold',
      severity: rule.severity,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      message: `${rule.name}: ${rule.description} (Value: ${value}, Threshold: ${rule.threshold})`,
      timestamp: new Date(),
      resolved: false
    };
  }

  private evaluateConditions(conditions: AlertCondition[], metrics: AdvancedPerformanceMetrics): boolean {
    let result = true;
    let hasOrCondition = false;

    for (const condition of conditions) {
      const value = this.getMetricValue(metrics, condition.metric);
      if (value === null) continue;

      let conditionMet = false;
      switch (condition.condition) {
        case 'greater_than':
          conditionMet = value > condition.value;
          break;
        case 'less_than':
          conditionMet = value < condition.value;
          break;
        case 'equals':
          conditionMet = value === condition.value;
          break;
      }

      if (condition.operator === 'and') {
        result = result && conditionMet;
      } else if (condition.operator === 'or') {
        hasOrCondition = true;
        result = result || conditionMet;
      }
    }

    return result;
  }

  private getMetricValue(metrics: AdvancedPerformanceMetrics, path: string): number | null {
    const keys = path.split('.');
    let current: any = metrics;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }

    return typeof current === 'number' ? current : null;
  }

  private async processAlert(rule: AlertRule, alert: PerformanceAlert): Promise<void> {
    const notificationResults: NotificationResult[] = [];

    // Send notifications through enabled channels
    for (const channel of rule.notificationChannels) {
      if (!channel.enabled) continue;

      try {
        const result = await this.sendNotification(channel, alert, rule);
        notificationResults.push(result);
      } catch (error) {
        notificationResults.push({
          channel: channel.type,
          success: false,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Store alert history
    const alertHistory: AlertHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      alert,
      notificationsSent: notificationResults
    };

    this.alertHistory.push(alertHistory);

    // Keep only last 1000 alert history entries
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  private async sendNotification(
    channel: NotificationChannel,
    alert: PerformanceAlert,
    rule: AlertRule
  ): Promise<NotificationResult> {
    const timestamp = new Date();

    switch (channel.type) {
      case 'console':
        return this.sendConsoleNotification(alert, rule, timestamp);
      
      case 'service_worker':
        return this.sendServiceWorkerNotification(alert, rule, timestamp);
      
      case 'webhook':
        return this.sendWebhookNotification(channel.config, alert, rule, timestamp);
      
      case 'email':
        return this.sendEmailNotification(channel.config, alert, rule, timestamp);
      
      case 'slack':
        return this.sendSlackNotification(channel.config, alert, rule, timestamp);
      
      default:
        throw new Error(`Unsupported notification channel: ${channel.type}`);
    }
  }

  private sendConsoleNotification(
    alert: PerformanceAlert,
    rule: AlertRule,
    timestamp: Date
  ): NotificationResult {
    const severityColors = {
      low: 'color: #3b82f6',
      medium: 'color: #f59e0b',
      high: 'color: #ef4444',
      critical: 'color: #dc2626; font-weight: bold'
    };

    console.group(`%c🚨 Performance Alert [${alert.severity.toUpperCase()}]`, severityColors[alert.severity]);
    console.log(`Rule: ${rule.name}`);
    console.log(`Description: ${rule.description}`);
    console.log(`Metric: ${alert.metric}`);
    console.log(`Value: ${alert.value}`);
    console.log(`Threshold: ${alert.threshold}`);
    console.log(`Time: ${timestamp.toISOString()}`);
    console.groupEnd();

    return {
      channel: 'console',
      success: true,
      timestamp
    };
  }

  private sendServiceWorkerNotification(
    alert: PerformanceAlert,
    rule: AlertRule,
    timestamp: Date
  ): NotificationResult {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PERFORMANCE_ALERT',
        payload: {
          alert,
          rule,
          timestamp: timestamp.toISOString()
        }
      });

      return {
        channel: 'service_worker',
        success: true,
        timestamp
      };
    }

    throw new Error('Service worker not available');
  }

  private async sendWebhookNotification(
    config: any,
    alert: PerformanceAlert,
    rule: AlertRule,
    timestamp: Date
  ): Promise<NotificationResult> {
    if (!config.url) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      alert,
      rule,
      timestamp: timestamp.toISOString(),
      source: 'PWA Performance Monitor'
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    return {
      channel: 'webhook',
      success: true,
      timestamp
    };
  }

  private async sendEmailNotification(
    config: any,
    alert: PerformanceAlert,
    rule: AlertRule,
    timestamp: Date
  ): Promise<NotificationResult> {
    // Email notification would require a backend service
    // This is a placeholder implementation
    console.log('Email notification would be sent:', {
      to: config.to,
      subject: `Performance Alert: ${rule.name}`,
      body: alert.message
    });

    return {
      channel: 'email',
      success: true,
      timestamp
    };
  }

  private async sendSlackNotification(
    config: any,
    alert: PerformanceAlert,
    rule: AlertRule,
    timestamp: Date
  ): Promise<NotificationResult> {
    if (!config.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const severityColors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const payload = {
      text: `Performance Alert: ${rule.name}`,
      attachments: [
        {
          color: severityColors[alert.severity],
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Value', value: alert.value.toString(), short: true },
            { title: 'Threshold', value: alert.threshold?.toString() || 'N/A', short: true },
            { title: 'Description', value: rule.description, short: false },
            { title: 'Time', value: timestamp.toISOString(), short: false }
          ]
        }
      ]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }

    return {
      channel: 'slack',
      success: true,
      timestamp
    };
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alertHistory = this.alertHistory.find(h => h.alert.id === alertId);
    if (!alertHistory) return false;

    alertHistory.acknowledgedBy = acknowledgedBy;
    alertHistory.acknowledgedAt = new Date();
    return true;
  }

  public resolveAlert(alertId: string): boolean {
    const alertHistory = this.alertHistory.find(h => h.alert.id === alertId);
    if (!alertHistory) return false;

    alertHistory.alert.resolved = true;
    alertHistory.resolvedAt = new Date();
    return true;
  }

  private startAutoResolutionTimer(): void {
    if (!this.config.enableAutoResolution) return;

    setInterval(() => {
      const now = new Date();
      const timeoutMs = this.config.autoResolutionTimeout * 60 * 1000;

      this.alertHistory.forEach(history => {
        if (!history.alert.resolved) {
          const alertAge = now.getTime() - history.alert.timestamp.getTime();
          if (alertAge > timeoutMs) {
            history.alert.resolved = true;
            history.resolvedAt = now;
          }
        }
      });
    }, 60000); // Check every minute
  }

  public getAlertHistory(limit?: number): AlertHistory[] {
    const history = [...this.alertHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  public getUnresolvedAlerts(): AlertHistory[] {
    return this.alertHistory.filter(h => !h.alert.resolved);
  }

  public getAlertStats(): {
    total: number;
    unresolved: number;
    bySeverity: Record<string, number>;
    byRule: Record<string, number>;
    last24Hours: number;
  } {
    const now = new Date();
    const last24Hours = now.getTime() - (24 * 60 * 60 * 1000);

    const bySeverity: Record<string, number> = {};
    const byRule: Record<string, number> = {};
    let unresolved = 0;
    let last24HoursCount = 0;

    this.alertHistory.forEach(history => {
      const alert = history.alert;
      
      // Count by severity
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      
      // Count by rule
      const rule = this.alertRules.get(history.ruleId);
      const ruleName = rule?.name || 'Unknown';
      byRule[ruleName] = (byRule[ruleName] || 0) + 1;
      
      // Count unresolved
      if (!alert.resolved) unresolved++;
      
      // Count last 24 hours
      if (alert.timestamp.getTime() > last24Hours) last24HoursCount++;
    });

    return {
      total: this.alertHistory.length,
      unresolved,
      bySeverity,
      byRule,
      last24Hours: last24HoursCount
    };
  }

  public updateConfig(newConfig: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): AlertingConfig {
    return { ...this.config };
  }

  public exportConfiguration(): any {
    return {
      config: this.config,
      rules: Array.from(this.alertRules.values()),
      alertHistory: this.alertHistory.slice(-100), // Last 100 alerts
      stats: this.getAlertStats()
    };
  }

  public importConfiguration(data: any): void {
    if (data.config) {
      this.updateConfig(data.config);
    }

    if (data.rules) {
      this.alertRules.clear();
      data.rules.forEach((rule: AlertRule) => {
        this.addRule(rule);
      });
    }
  }

  public testRule(ruleId: string, testMetrics: AdvancedPerformanceMetrics): {
    wouldTrigger: boolean;
    alert?: PerformanceAlert;
    reason: string;
  } {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      return { wouldTrigger: false, reason: 'Rule not found' };
    }

    if (!rule.enabled) {
      return { wouldTrigger: false, reason: 'Rule is disabled' };
    }

    const alert = this.evaluateRule(rule, testMetrics);
    
    return {
      wouldTrigger: alert !== null,
      alert: alert || undefined,
      reason: alert ? 'Rule conditions met' : 'Rule conditions not met'
    };
  }

  public clearHistory(): void {
    this.alertHistory = [];
    this.lastAlertTimes.clear();
  }
}