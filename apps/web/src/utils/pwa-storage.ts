/**
 * Storage utilities for PWA installation preferences and state
 */

import type { 
  InstallationPreferences, 
  InstallationEvent, 
  DeviceCapabilities 
} from '@/types/pwa-install';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from '@/types/pwa-install';

/**
 * localStorage utilities with error handling
 */
class PWAStorage {
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get installation preferences from localStorage
   */
  getInstallationPreferences(): InstallationPreferences {
    if (!this.isStorageAvailable()) {
      return { ...DEFAULT_PREFERENCES };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSTALLATION_PREFERENCES);
      if (!stored) {
        return { ...DEFAULT_PREFERENCES };
      }

      const parsed = JSON.parse(stored) as InstallationPreferences;
      
      // Migrate old versions if needed
      return this.migratePreferences(parsed);
    } catch (error) {
      console.warn('Failed to load installation preferences:', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Save installation preferences to localStorage
   */
  setInstallationPreferences(preferences: InstallationPreferences): void {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available, preferences not saved');
      return;
    }

    try {
      const toSave = {
        ...preferences,
        version: '1.0.0' // Current version
      };
      
      localStorage.setItem(
        STORAGE_KEYS.INSTALLATION_PREFERENCES, 
        JSON.stringify(toSave)
      );
    } catch (error) {
      console.error('Failed to save installation preferences:', error);
    }
  }

  /**
   * Update specific preference fields
   */
  updatePreferences(updates: Partial<InstallationPreferences>): void {
    const current = this.getInstallationPreferences();
    const updated = { ...current, ...updates };
    this.setInstallationPreferences(updated);
  }

  /**
   * Reset all installation preferences
   */
  resetPreferences(): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.INSTALLATION_PREFERENCES);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }

  /**
   * Get device capabilities from cache
   */
  getDeviceCapabilities(): DeviceCapabilities | null {
    if (!this.isStorageAvailable()) return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_CAPABILITIES);
      if (!stored) return null;

      return JSON.parse(stored) as DeviceCapabilities;
    } catch (error) {
      console.warn('Failed to load device capabilities:', error);
      return null;
    }
  }

  /**
   * Cache device capabilities
   */
  setDeviceCapabilities(capabilities: DeviceCapabilities): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.DEVICE_CAPABILITIES,
        JSON.stringify(capabilities)
      );
    } catch (error) {
      console.error('Failed to cache device capabilities:', error);
    }
  }

  /**
   * Migrate preferences from older versions
   */
  private migratePreferences(preferences: any): InstallationPreferences {
    // Handle migration from older versions
    const migrated = { ...DEFAULT_PREFERENCES, ...preferences };
    
    // Ensure all required fields exist
    if (!migrated.version) {
      migrated.version = '1.0.0';
    }
    
    if (typeof migrated.autoInstallEnabled === 'undefined') {
      migrated.autoInstallEnabled = true;
    }
    
    if (!migrated.deviceFingerprint) {
      migrated.deviceFingerprint = '';
    }

    return migrated;
  }
}

/**
 * Session storage utilities for temporary state
 */
class PWASessionStorage {
  private isStorageAvailable(): boolean {
    try {
      const test = '__session_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get session installation state
   */
  getSessionState(): any {
    if (!this.isStorageAvailable()) return null;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION_STATE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load session state:', error);
      return null;
    }
  }

  /**
   * Set session installation state
   */
  setSessionState(state: any): void {
    if (!this.isStorageAvailable()) return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  /**
   * Clear session state
   */
  clearSessionState(): void {
    if (!this.isStorageAvailable()) return;

    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_STATE);
    } catch (error) {
      console.error('Failed to clear session state:', error);
    }
  }
}

/**
 * Analytics queue management
 */
class PWAAnalyticsStorage {
  private isStorageAvailable(): boolean {
    try {
      const test = '__analytics_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add analytics event to queue
   */
  queueEvent(event: InstallationEvent): void {
    if (!this.isStorageAvailable()) return;

    try {
      const queue = this.getEventQueue();
      queue.push(event);
      
      // Limit queue size
      const MAX_QUEUE_SIZE = 100;
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.splice(0, queue.length - MAX_QUEUE_SIZE);
      }
      
      localStorage.setItem(STORAGE_KEYS.ANALYTICS_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue analytics event:', error);
    }
  }

  /**
   * Get all queued analytics events
   */
  getEventQueue(): InstallationEvent[] {
    if (!this.isStorageAvailable()) return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load analytics queue:', error);
      return [];
    }
  }

  /**
   * Clear analytics event queue
   */
  clearEventQueue(): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.ANALYTICS_QUEUE);
    } catch (error) {
      console.error('Failed to clear analytics queue:', error);
    }
  }

  /**
   * Get events and clear queue (for batch processing)
   */
  flushEventQueue(): InstallationEvent[] {
    const events = this.getEventQueue();
    this.clearEventQueue();
    return events;
  }
}

// Export singleton instances
export const pwaStorage = new PWAStorage();
export const pwaSessionStorage = new PWASessionStorage();
export const pwaAnalyticsStorage = new PWAAnalyticsStorage();

// Utility functions
export function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function isWithinCooldownPeriod(lastDate: string, cooldownDays: number): boolean {
  if (!lastDate) return false;
  
  const last = new Date(lastDate);
  const now = new Date();
  const daysDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysDiff < cooldownDays;
}

export function shouldRateLimitInstallAttempts(preferences: InstallationPreferences): boolean {
  const MAX_ATTEMPTS_PER_DAY = 5;
  const today = new Date().toDateString();
  
  // Simple rate limiting based on last prompt date
  if (preferences.lastPromptDate) {
    const lastPromptDate = new Date(preferences.lastPromptDate).toDateString();
    if (lastPromptDate === today && preferences.dismissCount >= MAX_ATTEMPTS_PER_DAY) {
      return true;
    }
  }
  
  return false;
}