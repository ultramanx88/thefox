/**
 * Device detection utilities for PWA installation
 */

import type { DeviceType, DeviceCapabilities, InstallMethod } from '@/types/pwa-install';

/**
 * Detect the user's device type for PWA installation
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'unsupported';

  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMobile = /mobile|tablet/.test(userAgent) || isAndroid || isIOS;

  if (isAndroid) return 'android';
  if (isIOS) return 'ios';
  if (!isMobile) return 'desktop';
  
  return 'unsupported';
}

/**
 * Detect browser name and version
 */
export function detectBrowser(): { name: string; version: string } {
  if (typeof window === 'undefined') return { name: 'unknown', version: '0' };

  const userAgent = navigator.userAgent;
  
  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'chrome', version: match?.[1] || '0' };
  }
  
  // Edge
  if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: 'edge', version: match?.[1] || '0' };
  }
  
  // Firefox
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: 'firefox', version: match?.[1] || '0' };
  }
  
  // Safari
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: 'safari', version: match?.[1] || '0' };
  }
  
  return { name: 'unknown', version: '0' };
}

/**
 * Check if the current environment supports PWA installation
 */
export function checkPWASupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for service worker support
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  // Check for manifest support
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
  
  return hasServiceWorker && hasManifest && !isStandalone;
}

/**
 * Detect device capabilities for PWA installation
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      supportsBeforeInstallPrompt: false,
      supportsServiceWorker: false,
      supportsWebShare: false,
      isStandalone: false,
      platform: 'unknown',
      installMethod: 'unsupported',
      browserName: 'unknown',
      browserVersion: '0'
    };
  }

  const browser = detectBrowser();
  const deviceType = detectDeviceType();
  
  // Check for beforeinstallprompt support
  const supportsBeforeInstallPrompt = 'onbeforeinstallprompt' in window;
  
  // Check for service worker support
  const supportsServiceWorker = 'serviceWorker' in navigator;
  
  // Check for Web Share API support
  const supportsWebShare = 'share' in navigator;
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
  
  // Determine install method based on browser and device
  let installMethod: InstallMethod = 'unsupported';
  
  if (supportsBeforeInstallPrompt && (browser.name === 'chrome' || browser.name === 'edge')) {
    installMethod = 'native';
  } else if (deviceType === 'ios' && browser.name === 'safari') {
    installMethod = 'manual';
  } else if (deviceType === 'desktop' && supportsServiceWorker) {
    installMethod = 'manual';
  }
  
  return {
    supportsBeforeInstallPrompt,
    supportsServiceWorker,
    supportsWebShare,
    isStandalone,
    platform: navigator.platform || 'unknown',
    installMethod,
    browserName: browser.name,
    browserVersion: browser.version
  };
}

/**
 * Generate a device fingerprint for permission tracking
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.platform
  ];
  
  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Check if the device/browser combination supports native PWA installation
 */
export function supportsNativeInstall(): boolean {
  const capabilities = detectDeviceCapabilities();
  return capabilities.installMethod === 'native';
}

/**
 * Check if the app is already installed (running in standalone mode)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Get platform-specific installation instructions
 */
export function getInstallationInstructions(deviceType: DeviceType): string[] {
  switch (deviceType) {
    case 'ios':
      return [
        'Tap the Share button at the bottom of the screen',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install the app'
      ];
    
    case 'android':
      return [
        'Tap the menu button (three dots) in your browser',
        'Select "Add to Home screen" or "Install app"',
        'Tap "Add" to install the app'
      ];
    
    case 'desktop':
      return [
        'Click the install button in your browser\'s address bar',
        'Or use Ctrl+Shift+A (Cmd+Shift+A on Mac)',
        'Click "Install" to add the app to your desktop'
      ];
    
    default:
      return [
        'Your browser doesn\'t support PWA installation',
        'You can bookmark this page for quick access',
        'Consider using Chrome or Edge for the best experience'
      ];
  }
}

/**
 * Check if we should show the install prompt based on dismiss history
 */
export function shouldShowInstallPrompt(dismissCount: number, lastPromptDate: string): boolean {
  const MAX_DISMISS_COUNT = 3;
  const COOLDOWN_DAYS = 7;
  
  // Don't show if dismissed too many times
  if (dismissCount >= MAX_DISMISS_COUNT) {
    return false;
  }
  
  // Check cooldown period
  if (lastPromptDate) {
    const lastPrompt = new Date(lastPromptDate);
    const now = new Date();
    const daysSinceLastPrompt = (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastPrompt < COOLDOWN_DAYS) {
      return false;
    }
  }
  
  return true;
}