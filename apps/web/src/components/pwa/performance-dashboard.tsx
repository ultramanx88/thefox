'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AdvancedPerformanceMonitor, AdvancedPerformanceMetrics, CoreWebVitals, PerformanceAlert } from '@/lib/pwa/advanced-performance-monitor';
import { PerformanceAnalytics } from '@/lib/pwa/performance-analytics';
import { PerformanceAlerting } from '@/lib/pwa/performance-alerting';
import { Activity, Database, Network, Smartphone, AlertTriangle, CheckCircle, Bell, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<AdvancedPerformanceMetrics | null>(null);
  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitals>({
    lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, inp: 0
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    const performanceMonitor = AdvancedPerformanceMonitor.getInstance();
    const performanceAnalytics = PerformanceAnalytics.getInstance();
    const performanceAlerting = PerformanceAlerting.getInstance();
    
    // Start monitoring
    performanceMonitor.startMonitoring();
    
    // Get initial metrics
    const initialMetrics = performanceMonitor.getLatestMetrics();
    if (initialMetrics) {
      setMetrics(initialMetrics);
      setCoreWebVitals(initialMetrics.coreWebVitals);
      
      // Add to analytics
      performanceAnalytics.addMetrics(initialMetrics);
      
      // Check for alerts
      const newAlerts = performanceAlerting.evaluateMetrics(initialMetrics);
      setAlerts(prev => [...prev, ...newAlerts]);
    }

    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      const latestMetrics = performanceMonitor.getLatestMetrics();
      if (latestMetrics) {
        setMetrics(latestMetrics);
        setCoreWebVitals(latestMetrics.coreWebVitals);
        
        // Add to analytics
        performanceAnalytics.addMetrics(latestMetrics);
        
        // Check for alerts
        const newAlerts = performanceAlerting.evaluateMetrics(latestMetrics);
        if (newAlerts.length > 0) {
          setAlerts(prev => [...prev, ...newAlerts]);
          newAlerts.forEach(alert => performanceAnalytics.addAlert(alert));
        }
        
        // Calculate performance score
        const report = performanceAnalytics.generateRealtimeReport();
        setPerformanceScore(report.summary.performanceScore);
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
      
      // Request cache stats
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getPerformanceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced PWA Performance Dashboard</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Performance Score:</span>
              <span className={`text-lg font-bold ${getPerformanceScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="text-sm text-gray-500">
                Active Alerts: {alerts.filter(a => !a.resolved).length}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOptimizeCache} variant="outline" size="sm">
            Optimize Cache
          </Button>
          <Button onClick={handlePrefetchResources} variant="outline" size="sm">
            Prefetch Resources
          </Button>
          <Button onClick={handleClearCache} variant="outline" size="sm">
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(a => !a.resolved).slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Button 
                    onClick={() => handleResolveAlert(alert.id)}
                    variant="outline" 
                    size="sm"
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(coreWebVitals).map(([key, value]) => {
          const status = getVitalStatus(key as keyof CoreWebVitals, value);
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase">
                  {key.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {key === 'cls' ? value.toFixed(3) : Math.round(value)}
                  {key !== 'cls' && 'ms'}
                </div>
                <Badge className={`mt-2 ${getStatusColor(status)}`}>
                  {status === 'good' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status !== 'good' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {status.replace('-', ' ')}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cache Statistics */}
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

      {/* Device & Network Info */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Device Type:</span>
                <Badge variant="outline">{metrics.deviceMetrics.deviceType}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Screen Size:</span>
                <span>{metrics.deviceMetrics.screenSize}</span>
              </div>
              <div className="flex justify-between">
                <span>CPU Cores:</span>
                <span>{metrics.deviceMetrics.cpuCores}</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span>{metrics.deviceMetrics.memorySize}GB</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="w-5 h-5 mr-2" />
                Network Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Memory Usage */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}