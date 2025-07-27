'use client';

import { useEffect } from 'react';
import { InstallPrompt } from './install-prompt';
import { OfflineIndicator, OnlineIndicator } from './offline-indicator';
import { UpdatePrompt } from './update-prompt';
import { PerformanceMonitor } from '@/lib/pwa/performance-monitor';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    // Setup service worker communication
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'PERFORMANCE_METRICS':
            console.log('Performance metrics from SW:', payload);
            break;
          case 'CACHE_STATS':
            console.log('Cache statistics:', payload);
            break;
          case 'PERFORMANCE_ALERT':
            console.warn('Performance alert:', payload);
            break;
        }
      });

      // Request initial cache stats
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'GET_CACHE_STATS' });
        }
      });
    }

    // Cleanup on unmount
    return () => {
      performanceMonitor.cleanup();
    };
  }, []);

  return (
    <>
      {children}
      <InstallPrompt />
      <OfflineIndicator />
      <OnlineIndicator />
      <UpdatePrompt />
    </>
  );
}