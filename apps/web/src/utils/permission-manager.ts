/**
 * Permission management utilities for PWA installation
 */

import type { PermissionState, InstallationPreferences } from '@/types/pwa-install';
import { pwaStorage, isWithinCooldownPeriod, shouldRateLimitInstallAttempts } from '@/utils/pwa-storage';
import { generateDeviceFingerprint } from '@/utils/device-detection';

export class PermissionManager {
  private static instance: PermissionManager;
  private rateLimitMap = new Map<string, number>();

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Check if permission has been granted
   */
  hasPermission(): boolean {
    const preferences = pwaStorage.getInstallationPreferences();
    return preferences.permissionGranted;
  }

  /**
   * Grant installation permission
   */
  grantPermission(rememberChoice: boolean = true): void {
    const preferences = pwaStorage.getInstallationPreferences();
    const fingerprint = preferences.deviceFingerprint || generateDeviceFingerprint();

    const updatedPreferences: InstallationPreferences = {
      ...preferences,
      permissionGranted: true,
      lastPromptDate: new Date().toISOString(),
      deviceFingerprint: fingerprint,
      autoInstallEnabled: rememberChoice
    };

    pwaStorage.setInstallationPreferences(updatedPreferences);
    
    // Clear any rate limiting for this device
    this.clearRateLimit(fingerprint);
  }

  /**
   * Deny installation permission
   */
  denyPermission(rememberChoice: boolean = true): void {
    const preferences = pwaStorage.getInstallationPreferences();
    const fingerprint = preferences.deviceFingerprint || generateDeviceFingerprint();

    const updatedPreferences: InstallationPreferences = {
      ...preferences,
      permissionGranted: false,
      lastPromptDate: new Date().toISOString(),
      dismissCount: rememberChoice ? preferences.dismissCount + 1 : preferences.dismissCount,
      deviceFingerprint: fingerprint
    };

    pwaStorage.setInstallationPreferences(updatedPreferences);
    
    // Add rate limiting if denied
    if (rememberChoice) {
      this.addRateLimit(fingerprint);
    }
  }

  /**
   * Dismiss permission dialog without explicit choice
   */
  dismissPermission(): void {
    const preferences = pwaStorage.getInstallationPreferences();
    const fingerprint = preferences.deviceFingerprint || generateDeviceFingerprint();

    const updatedPreferences: InstallationPreferences = {
      ...preferences,
      lastPromptDate: new Date().toISOString(),
      dismissCount: preferences.dismissCount + 1,
      deviceFingerprint: fingerprint
    };

    pwaStorage.setInstallationPreferences(updatedPreferences);
  }

  /**
   * Reset all permissions
   */
  resetPermissions(): void {
    const preferences = pwaStorage.getInstallationPreferences();
    const fingerprint = preferences.deviceFingerprint;
    
    pwaStorage.resetPreferences();
    
    // Clear rate limiting
    if (fingerprint) {
      this.clearRateLimit(fingerprint);
    }
  }

  /**
   * Check if we should show the permission dialog
   */
  shouldShowPermissionDialog(): boolean {
    const preferences = pwaStorage.getInstallationPreferences();
    
    // Don't show if permission already granted
    if (preferences.permissionGranted) {
      return false;
    }
    
    // Check rate limiting
    if (shouldRateLimitInstallAttempts(preferences)) {
      return false;
    }
    
    // Check dismiss count and cooldown
    const MAX_DISMISSALS = 3;
    const COOLDOWN_DAYS = 7;
    
    if (preferences.dismissCount >= MAX_DISMISSALS) {
      return false;
    }
    
    if (isWithinCooldownPeriod(preferences.lastPromptDate, COOLDOWN_DAYS)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get current permission state
   */
  getPermissionState(): PermissionState {
    const preferences = pwaStorage.getInstallationPreferences();
    
    if (preferences.permissionGranted) {
      return 'granted';
    }
    
    if (preferences.dismissCount > 0) {
      return 'dismissed';
    }
    
    return 'unknown';
  }

  /**
   * Check if installation attempts should be rate limited
   */
  isRateLimited(): boolean {
    const preferences = pwaStorage.getInstallationPreferences();
    const fingerprint = preferences.deviceFingerprint;
    
    if (!fingerprint) return false;
    
    const attempts = this.rateLimitMap.get(fingerprint) || 0;
    const MAX_ATTEMPTS_PER_HOUR = 5;
    
    return attempts >= MAX_ATTEMPTS_PER_HOUR;
  }

  /**
   * Add rate limiting for a device
   */
  private addRateLimit(fingerprint: string): void {
    const current = this.rateLimitMap.get(fingerprint) || 0;
    this.rateLimitMap.set(fingerprint, current + 1);
    
    // Clear rate limit after 1 hour
    setTimeout(() => {
      this.clearRateLimit(fingerprint);
    }, 60 * 60 * 1000);
  }

  /**
   * Clear rate limiting for a device
   */
  private clearRateLimit(fingerprint: string): void {
    this.rateLimitMap.delete(fingerprint);
  }

  /**
   * Get permission statistics for analytics
   */
  getPermissionStats(): {
    hasPermission: boolean;
    dismissCount: number;
    daysSinceLastPrompt: number;
    isRateLimited: boolean;
  } {
    const preferences = pwaStorage.getInstallationPreferences();
    
    let daysSinceLastPrompt = 0;
    if (preferences.lastPromptDate) {
      const lastPrompt = new Date(preferences.lastPromptDate);
      const now = new Date();
      daysSinceLastPrompt = Math.floor((now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      hasPermission: preferences.permissionGranted,
      dismissCount: preferences.dismissCount,
      daysSinceLastPrompt,
      isRateLimited: this.isRateLimited()
    };
  }

  /**
   * Validate permission state for security
   */
  validatePermissionState(): boolean {
    try {
      const preferences = pwaStorage.getInstallationPreferences();
      
      // Check for required fields
      if (typeof preferences.permissionGranted !== 'boolean') {
        return false;
      }
      
      if (typeof preferences.dismissCount !== 'number' || preferences.dismissCount < 0) {
        return false;
      }
      
      // Validate timestamp format
      if (preferences.lastPromptDate && isNaN(Date.parse(preferences.lastPromptDate))) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Permission validation failed:', error);
      return false;
    }
  }

  /**
   * Sanitize permission data to prevent tampering
   */
  sanitizePermissionData(): void {
    try {
      const preferences = pwaStorage.getInstallationPreferences();
      
      // Ensure dismiss count is within reasonable bounds
      if (preferences.dismissCount > 10) {
        preferences.dismissCount = 10;
      }
      
      if (preferences.dismissCount < 0) {
        preferences.dismissCount = 0;
      }
      
      // Validate and fix timestamp
      if (preferences.lastPromptDate && isNaN(Date.parse(preferences.lastPromptDate))) {
        preferences.lastPromptDate = '';
      }
      
      // Ensure device fingerprint exists
      if (!preferences.deviceFingerprint) {
        preferences.deviceFingerprint = generateDeviceFingerprint();
      }
      
      pwaStorage.setInstallationPreferences(preferences);
    } catch (error) {
      console.error('Failed to sanitize permission data:', error);
      // Reset preferences if sanitization fails
      pwaStorage.resetPreferences();
    }
  }
}

// Export singleton instance
export const permissionManager = PermissionManager.getInstance();