'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedPerformanceMonitor, AdvancedPerformanceMetrics, CoreWebVitals, PerformanceAlert } from '@/lib/pwa/advanced-performance-monitor';
import { PerformanceAnalytics, PerformanceReport } from '@/lib/pwa/performance-analytics';
import { PerformanceAlerting, AlertRule } from '@/lib/pwa/performance-alerting';
import { 
  Activity, Database, Network, Smartphone, AlertTriangle, CheckCircle, Bell, 
  TrendingUp, TrendingDown, Minus, Settings, Download, RefreshCw, Zap,
  Clock, Memory, Wifi, Eye, Bug, Shield
} from 'lucide-react';

export function AdvancedPerformanceDashboard() {
  const [metrics, setMetrics] = useState<AdvancedPerformanceMetrics | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const performanceMonitor = AdvancedPerformanceMonitor.getInstance();
    const performanceAnalytics = PerformanceAnalytics.getInstance();
    const performanceAlerting = PerformanceAlerting.getInstance();
    
    // Start monitoring
    performanceMonitor.startMonitoring();
    
    // Get initial data
    const initialMetrics = performanceMonitor.getLatestMetrics();
    if (initialMetrics) {
      setMetrics(initialMetrics);
      performanceAnalytics.addMetrics(initialMetrics);
      
      const newAlerts = performanceAlerting.evaluateMetrics(initialMetrics);
      setAlerts(prev => [...prev, ...newAlerts]);
    }

    setAlertRules(performanceAlerting.getRules());

    // Update data every 5 seconds
    const interval = setInterval(() => {
      const latestMetrics = performanceMonitor.getLatestMetrics();
      if (latestMetrics) {
        setMetrics(latestMetrics);
        performanceAnalytics.addMetrics(latestMetrics);
        
        const newAlerts = performanceAlerting.evaluateMetrics(latestMetrics);
        if (newAlerts.length > 0) {
          setAlerts(prev => [...prev, ...newAlerts]);
          newAlerts.forEach(alert => performanceAnalytics.addAlert(alert));
        }
        
        try {
          const newReport = performanceAnalytics.generateRealtimeReport();
          setReport(newReport);
        } catch (error) {
          console.warn('Could not generate performance report:', error);
        }
      }
    }, 5000);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        
        if (type === 'CACHE_STATS') {
          setCacheStats(payload);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'GET_CACHE_STATS' });
        }
      });

      setIsLoading(false);

      return () => {
        clearInterval(interval);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        performanceMonitor.stopMonitoring();
      };
    }

    setIsLoading(false);
    return () => {
      clearInterval(interval);
      performanceMonitor.stopMonitoring();
    };
  }, []);

  const getVitalStatus = (metric: keyof CoreWebVitals, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 600, poor: 1500 },
      inp: { good: 200, poor: 500 }
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const handleOptimizeCache = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'OPTIMIZE_MEMORY' });
    }
  };

  const handlePrefetchResources = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_RESOURCES' });
    }
  };

  const handleClearCache = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
  };

  const handleResolveAlert = (alertId: string) => {
    const performanceAlerting = PerformanceAlerting.getInstance();
    performanceAlerting.resolveAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const handleExportData = () => {
    const performanceMonitor = AdvancedPerformanceMonitor.getInstance();
    const performanceAnalytics = PerformanceAnalytics.getInstance();
    const performanceAlerting = PerformanceAlerting.getInstance();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: performanceMonitor.exportMetrics(),
      analytics: performanceAnalytics.exportAnalytics(),
      alerting: performanceAlerting.exportConfiguration()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pwa-performance-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const performanceScore = report?.summary.performanceScore || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced PWA Performance Dashboard</h2>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-500">Performance Score:</span>
              <span className={`text-xl font-bold ${
                performanceScore >= 90 ? 'text-green-600' : 
                performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {performanceScore}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500">
                Active Alerts: {unresolvedAlerts.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">
                Monitoring: Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOptimizeCache} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Optimize
          </Button>
          <Button onClick={handlePrefetchResources} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Prefetch
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {unresolvedAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Performance Alerts ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {unresolvedAlerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium">{alert.metric}</div>
                      <div className="text-xs text-gray-500">{alert.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <Button 
                      onClick={() => handleResolveAlert(alert.id)}
                      variant="outline" 
                      size="sm"
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="runtime">Runtime</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{performanceScore}</div>
                <Progress value={performanceScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics ? Math.round(metrics.interactionMetrics.sessionDuration / 1000) : 0}s
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Bug className="w-4 h-4 mr-2" />
                  Total Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics?.errorMetrics.totalErrors || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics?.interactionMetrics.totalInteractions || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Core Web Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics && Object.entries(metrics.coreWebVitals).map(([key, value]) => {
              const status = getVitalStatus(key as keyof CoreWebVitals, value);
              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase">
                      {key.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {key === 'cls' ? value.toFixed(3) : Math.round(value)}
                      {key !== 'cls' && 'ms'}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(status)}`}>
                      {status === 'good' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {status !== 'good' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {status.replace('-', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics && Object.entries(metrics.coreWebVitals).map(([key, value]) => {
              const status = getVitalStatus(key as keyof CoreWebVitals, value);
              const thresholds = {
                lcp: { good: 2500, poor: 4000 },
                fid: { good: 100, poor: 300 },
                cls: { good: 0.1, poor: 0.25 },
                fcp: { good: 1800, poor: 3000 },
                ttfb: { good: 600, poor: 1500 },
                inp: { good: 200, poor: 500 }
              }[key as keyof CoreWebVitals];

              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{key.toUpperCase()}</span>
                      {getTrendIcon(0)}
                    </CardTitle>
                    <CardDescription>
                      {key === 'lcp' && 'Largest Contentful Paint'}
                      {key === 'fid' && 'First Input Delay'}
                      {key === 'cls' && 'Cumulative Layout Shift'}
                      {key === 'fcp' && 'First Contentful Paint'}
                      {key === 'ttfb' && 'Time to First Byte'}
                      {key === 'inp' && 'Interaction to Next Paint'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-4xl font-bold">
                        {key === 'cls' ? value.toFixed(3) : Math.round(value)}
                        {key !== 'cls' && 'ms'}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Good: ≤ {key === 'cls' ? thresholds.good.toFixed(3) : thresholds.good}{key !== 'cls' && 'ms'}</span>
                          <span>Poor: > {key === 'cls' ? thresholds.poor.toFixed(3) : thresholds.poor}{key !== 'cls' && 'ms'}</span>
                        </div>
                        <Progress 
                          value={Math.min((value / thresholds.poor) * 100, 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      <Badge className={`${getStatusColor(status)} text-sm`}>
                        {status === 'good' && <CheckCircle className="w-4 h-4 mr-1" />}
                        {status !== 'good' && <AlertTriangle className="w-4 h-4 mr-1" />}
                        {status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Runtime Tab */}
        <TabsContent value="runtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Memory className="w-5 h-5 mr-2" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>JS Heap Used:</span>
                        <span>{formatBytes(metrics.runtimeMetrics.jsHeapSizeUsed)}</span>
                      </div>
                      <Progress 
                        value={(metrics.runtimeMetrics.jsHeapSizeUsed / metrics.runtimeMetrics.jsHeapSizeLimit) * 100} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Used:</span>
                        <div className="font-medium">{formatBytes(metrics.runtimeMetrics.jsHeapSizeUsed)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <div className="font-medium">{formatBytes(metrics.runtimeMetrics.jsHeapSizeTotal)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Limit:</span>
                        <div className="font-medium">{formatBytes(metrics.runtimeMetrics.jsHeapSizeLimit)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Long Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Long Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">
                      {metrics.runtimeMetrics.longTasks.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      Tasks longer than 50ms
                    </div>
                    {metrics.runtimeMetrics.longTasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Recent Long Tasks:</div>
                        {metrics.runtimeMetrics.longTasks.slice(-3).map((task, index) => (
                          <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                            Duration: {Math.round(task.duration)}ms
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Layout Shifts */}
          {metrics && metrics.runtimeMetrics.layoutShifts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Layout Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.runtimeMetrics.layoutShifts.slice(-5).map((shift, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Shift Value: {shift.value.toFixed(4)}</span>
                      <span className="text-xs text-gray-500">
                        {shift.hadRecentInput ? 'User Input' : 'Unexpected'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="w-5 h-5 mr-2" />
                  Network Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={metrics.networkMetrics.onlineStatus ? "default" : "destructive"}>
                        {metrics.networkMetrics.onlineStatus ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Connection Type:</span>
                      <Badge variant="outline">{metrics.networkMetrics.connectionType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Type:</span>
                      <Badge variant="outline">{metrics.networkMetrics.effectiveType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Downlink:</span>
                      <span>{metrics.networkMetrics.downlink} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RTT:</span>
                      <span>{metrics.networkMetrics.rtt}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Save Data:</span>
                      <Badge variant={metrics.networkMetrics.saveData ? "secondary" : "outline"}>
                        {metrics.networkMetrics.saveData ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Device Type:</span>
                      <Badge variant="outline">{metrics.deviceContext.deviceType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Screen Size:</span>
                      <span>{metrics.deviceContext.screenSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU Cores:</span>
                      <span>{metrics.deviceContext.cpuCores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span>{metrics.deviceContext.memorySize}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pixel Ratio:</span>
                      <span>{metrics.deviceContext.pixelRatio}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orientation:</span>
                      <span>{metrics.deviceContext.orientation}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(cacheStats).map(([cacheName, stats]: [string, any]) => (
              <Card key={cacheName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    {cacheName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Hit Ratio:</span>
                    <span className="font-medium">
                      {(stats.hitRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stats.hitRatio * 100} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Cache Size:</span>
                    <span className="font-medium">{formatBytes(stats.cacheSize)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Total Requests:</span>
                    <span className="font-medium">{stats.totalRequests}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Avg Response:</span>
                    <span className="font-medium">
                      {Math.round(stats.averageResponseTime)}ms
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOptimizeCache} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Optimize Cache
            </Button>
            <Button onClick={handlePrefetchResources} variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Prefetch Resources
            </Button>
            <Button onClick={handleClearCache} variant="destructive" size="sm">
              Clear All Cache
            </Button>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {alerts.slice(-10).reverse().map((alert) => (
                    <div key={alert.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium">{alert.metric}</div>
                      <div className="text-xs text-gray-600">{alert.message}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs">
                          Value: {alert.value} | Threshold: {alert.threshold}
                        </span>
                        {!alert.resolved && (
                          <Button 
                            onClick={() => handleResolveAlert(alert.id)}
                            variant="outline" 
                            size="sm"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Alert Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{rule.name}</span>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{rule.description}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Metric: {rule.metric}</span>
                        <span>Threshold: {rule.threshold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}