// PWA utility functions

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

// Cache management utilities
export const clearAppCache = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
};

export const getCacheSize = async (): Promise<number> => {
  if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  
  return 0;
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