// Enhanced PWA utility functions with scalability features
import { PWACacheUtils } from './pwa/cache-utils';
import { PerformanceMonitor } from './pwa/performance-monitor';

export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
};

export const canInstallPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'serviceWorker' in navigator &&
    'BeforeInstallPromptEvent' in window &&
    !isPWAInstalled()
  );
};

export const getInstallInstructions = (): string => {
  if (isIOSDevice()) {
    return 'Tap the Share button and select "Add to Home Screen"';
  } else if (isAndroidDevice()) {
    return 'Tap the menu button and select "Add to Home Screen" or "Install App"';
  } else {
    return 'Click the install button in your browser\'s address bar';
  }
};

export const trackPWAInstall = () => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'pwa_install', {
      event_category: 'PWA',
      event_label: 'App Installed',
    });
  }
};

export const trackPWAUsage = () => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'pwa_usage', {
      event_category: 'PWA',
      event_label: isPWAInstalled() ? 'Standalone Mode' : 'Browser Mode',
    });
  }
};

export const registerSWUpdateListener = (callback: () => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', callback);
    
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', callback);
    };
  }
  
  return () => {};
};

export const checkForSWUpdate = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return !!registration.waiting;
  }
  
  return false;
};

export const activateWaitingSW = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
};

// Enhanced cache management utilities
export const clearAppCache = async (): Promise<void> => {
  await PWACacheUtils.clearAllCaches();
};

export const getCacheSize = async (): Promise<number> => {
  return await PWACacheUtils.getTotalCacheSize();
};

export const getCacheInfo = async () => {
  return await PWACacheUtils.getAllCacheInfo();
};

export const optimizeCache = async (): Promise<void> => {
  // Clean up expired entries
  await PWACacheUtils.cleanupExpiredEntries();
  
  // Notify service worker to optimize
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'OPTIMIZE_MEMORY' });
  }
};

export const prefetchCriticalResources = async (urls: string[]): Promise<void> => {
  await PWACacheUtils.preloadCriticalResources(urls);
};

// Network status utilities
export const getNetworkStatus = (): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
};

// Enhanced network monitoring
export const getDetailedNetworkInfo = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    type: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    downlinkMax: connection?.downlinkMax || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
  };
};

// Performance monitoring utilities
export const getPerformanceMetrics = () => {
  const monitor = PerformanceMonitor.getInstance();
  return monitor.getLatestMetrics();
};

export const getCoreWebVitals = () => {
  const monitor = PerformanceMonitor.getInstance();
  return monitor.getCoreWebVitals();
};

export const generatePerformanceReport = () => {
  const monitor = PerformanceMonitor.getInstance();
  return monitor.generatePerformanceReport();
};

// Storage quota utilities
export const getStorageQuota = async () => {
  return await PWACacheUtils.getStorageQuota();
};

export const isStorageQuotaExceeded = async (threshold: number = 0.8): Promise<boolean> => {
  const quota = await getStorageQuota();
  return quota.percentage > threshold * 100;
};

// Share API utilities
export const canUseWebShare = (): boolean => {
  return 'share' in navigator;
};

export const shareContent = async (data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (canUseWebShare()) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
  
  return false;
};

// Device capabilities detection
export const getDeviceCapabilities = () => {
  return {
    memory: (navigator as any).deviceMemory || 0,
    cores: navigator.hardwareConcurrency || 0,
    connection: getDetailedNetworkInfo(),
    storage: 'storage' in navigator,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notifications: 'Notification' in window,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator,
    webShare: canUseWebShare(),
  };
};

// PWA health check
export const performPWAHealthCheck = async () => {
  const isInstalled = isPWAInstalled();
  const isServiceWorkerActive = PWACacheUtils.isServiceWorkerActive();
  const cacheInfo = await getCacheInfo();
  const storageQuota = await getStorageQuota();
  const performanceMetrics = getPerformanceMetrics();
  const networkStatus = getDetailedNetworkInfo();
  const deviceCapabilities = getDeviceCapabilities();

  return {
    timestamp: new Date().toISOString(),
    status: {
      installed: isInstalled,
      serviceWorkerActive: isServiceWorkerActive,
      online: networkStatus.online,
    },
    cache: {
      totalCaches: cacheInfo.length,
      totalSize: cacheInfo.reduce((sum, cache) => sum + cache.size, 0),
      totalEntries: cacheInfo.reduce((sum, cache) => sum + cache.entries, 0),
    },
    storage: storageQuota,
    performance: performanceMetrics,
    network: networkStatus,
    device: deviceCapabilities,
  };
};

// Export cache data for debugging
export const exportPWAData = async () => {
  return await PWACacheUtils.exportCacheData();
};

// Format utilities
export const formatBytes = PWACacheUtils.formatBytes;

// Background sync utilities
export const queueBackgroundSync = (tag: string, data?: any) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    });
  }
};

// Notification utilities
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, options);
  }
  return null;
};