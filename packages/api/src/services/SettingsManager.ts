import { SettingsService } from '../firebase/settings';
import { SettingsCache } from './SettingsCache';
import { SettingsSync } from './SettingsSync';
import {
  UserSettings,
  UserRole,
  ValidationResult,
  SettingsExport,
  MobileAppearanceConfig,
  MobileAsset,
  SettingsError,
  SettingsErrorType,
  SettingsChange
} from '../types/settings';

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * High-level settings management interface
 * Provides business logic layer on top of SettingsService
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private cache: SettingsCache;
  private sync: SettingsSync;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  private listeners = new Map<string, (() => void)[]>();

  private constructor() {
    // Initialize cache and sync services
    this.cache = new SettingsCache({
      maxSize: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes
      enablePersistence: true
    });

    this.sync = new SettingsSync(this.cache, {
      enableRealTimeSync: true,
      conflictResolution: 'last_write_wins'
    });

    // Start sync service
    this.sync.start();

    // Set up sync event listeners
    this.setupSyncEventListeners();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get user settings with advanced caching and retry logic
   */
  async getUserSettings(userId: string, role: UserRole): Promise<UserSettings> {
    return this.withRetry(async () => {
      // Validate input
      if (!userId || !role) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'User ID and role are required',
          false
        );
      }

      // Check cache first
      const cached = this.cache.getUserSettings(userId);
      if (cached) {
        // Set up real-time listener if not already active
        this.ensureUserListener(userId, role);
        return cached;
      }

      // Get from database
      let settings = await SettingsService.getUserSettings(userId);
      
      // If no settings exist, create default settings
      if (!settings) {
        settings = await this.createDefaultUserSettings(userId, role);
      }

      // Validate settings structure
      const validation = this.validateSettings(settings);
      if (!validation.isValid) {
        console.warn('Invalid settings structure detected, recreating defaults:', validation.errors);
        settings = await this.createDefaultUserSettings(userId, role);
      }

      // Cache the settings
      this.cache.setUserSettings(userId, settings);
      
      // Set up real-time listener
      this.ensureUserListener(userId, role);
      
      return settings;
    }, 'getUserSettings');
  }

  /**
   * Create new user settings
   */
  async createUserSettings(userId: string, role: UserRole, initialSettings?: Partial<UserSettings>): Promise<UserSettings> {
    return this.withRetry(async () => {
      // Validate input
      if (!userId || !role) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'User ID and role are required',
          false
        );
      }

      // Check if settings already exist
      const existingSettings = await SettingsService.getUserSettings(userId);
      if (existingSettings) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'User settings already exist',
          false
        );
      }

      // Get default settings
      const defaultSettings = await SettingsService.getDefaultSettings(role);
      
      // Merge with initial settings if provided
      const settingsData = {
        ...defaultSettings,
        ...initialSettings,
        userId,
        role,
        version: 1
      };

      // Validate merged settings
      const validation = this.validateSettings(settingsData);
      if (!validation.isValid) {
        throw this.createValidationError(validation.errors[0]);
      }

      // Create settings in database
      await SettingsService.updateUserSettings(userId, settingsData);

      // Get the created settings
      const createdSettings = await SettingsService.getUserSettings(userId);
      if (!createdSettings) {
        throw this.createError(
          SettingsErrorType.STORAGE_ERROR,
          'Failed to create user settings',
          true
        );
      }

      // Cache the settings
      this.cache.setUserSettings(userId, createdSettings);
      
      return createdSettings;
    }, 'createUserSettings');
  }

  /**
   * Check if user settings exist
   */
  async userSettingsExist(userId: string): Promise<boolean> {
    return this.withRetry(async () => {
      if (!userId) {
        return false;
      }

      // Check cache first
      if (this.cache.getUserSettings(userId)) {
        return true;
      }

      // Check database
      const settings = await SettingsService.getUserSettings(userId);
      return settings !== null;
    }, 'userSettingsExist');
  }

  /**
   * Delete user settings
   */
  async deleteUserSettings(userId: string): Promise<void> {
    return this.withRetry(async () => {
      if (!userId) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'User ID is required',
          false
        );
      }

      // Remove from database
      await SettingsService.deleteUserSettings(userId);

      // Remove from cache
      this.cache.deleteUserSettings(userId);

      // Clean up listeners
      this.cleanupListeners(userId);

      // Notify about deletion
      this.notifySettingsDeleted(userId);
    }, 'deleteUserSettings');
  }

  /**
   * Update user settings with validation, caching, and retry logic
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>,
    source: 'web' | 'mobile' = 'web'
  ): Promise<UserSettings> {
    return this.withRetry(async () => {
      // Validate input
      if (!userId) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'User ID is required',
          false
        );
      }

      if (!settings || Object.keys(settings).length === 0) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'Settings data is required',
          false
        );
      }

      // Use optimistic update through sync service
      await this.sync.optimisticUpdate(userId, settings, source);

      // Get updated settings from cache
      const updatedSettings = this.cache.getUserSettings(userId);
      if (!updatedSettings) {
        throw this.createError(
          SettingsErrorType.STORAGE_ERROR,
          'Failed to retrieve updated settings',
          true
        );
      }

      // Validate the updated settings
      const validation = this.validateSettings(updatedSettings);
      if (!validation.isValid) {
        throw this.createValidationError(validation.errors[0]);
      }

      // Notify listeners about the change
      this.notifySettingsChange(userId, settings);

      return updatedSettings;
    }, 'updateUserSettings');
  }

  /**
   * Update specific setting field
   */
  async updateSettingField(
    userId: string,
    fieldPath: string,
    value: any,
    source: 'web' | 'mobile' = 'web'
  ): Promise<void> {
    return this.withRetry(async () => {
      if (!userId || !fieldPath) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'User ID and field path are required',
          false
        );
      }

      // Get current settings
      const currentSettings = this.cache.getUserSettings(userId);
      if (!currentSettings) {
        throw this.createError(
          SettingsErrorType.STORAGE_ERROR,
          'User settings not found',
          false
        );
      }

      // Create update object using field path
      const updateData = this.createNestedUpdate(fieldPath, value);

      // Update settings
      await this.updateUserSettings(userId, updateData, source);
    }, 'updateSettingField');
  }

  /**
   * Batch update multiple settings
   */
  async batchUpdateSettings(
    updates: Array<{
      userId: string;
      settings: Partial<UserSettings>;
      source?: 'web' | 'mobile';
    }>
  ): Promise<void> {
    return this.withRetry(async () => {
      if (!updates || updates.length === 0) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'Updates array is required',
          false
        );
      }

      // Validate all updates first
      for (const update of updates) {
        if (!update.userId || !update.settings) {
          throw this.createError(
            SettingsErrorType.VALIDATION_ERROR,
            'Each update must have userId and settings',
            false
          );
        }
      }

      // Process updates sequentially to maintain consistency
      const results = [];
      for (const update of updates) {
        try {
          await this.updateUserSettings(
            update.userId,
            update.settings,
            update.source || 'web'
          );
          results.push({ userId: update.userId, success: true });
        } catch (error) {
          results.push({ 
            userId: update.userId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Check if any updates failed
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        console.warn('Some batch updates failed:', failures);
      }
    }, 'batchUpdateSettings');
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(
    userId: string,
    role: UserRole,
    categories?: string[]
  ): Promise<void> {
    try {
      await SettingsService.resetUserSettings(userId, role, categories);
      
      // Clear cache to force reload
      this.cache.invalidateUserSettings(userId);
      
      // Notify listeners about the reset
      this.notifySettingsReset(userId, categories);
    } catch (error) {
      console.error('Error in resetUserSettings:', error);
      throw error;
    }
  }

  /**
   * Export user settings
   */
  async exportUserSettings(userId: string): Promise<SettingsExport> {
    try {
      return await SettingsService.exportUserSettings(userId);
    } catch (error) {
      console.error('Error in exportUserSettings:', error);
      throw error;
    }
  }

  /**
   * Validate settings data
   */
  validateSettings(settings: Partial<UserSettings>): ValidationResult {
    const errors: any[] = [];

    // Basic validation rules
    if (settings.profile) {
      if (settings.profile.displayName && settings.profile.displayName.trim().length === 0) {
        errors.push({
          field: 'profile.displayName',
          message: 'Display name cannot be empty',
          code: 'REQUIRED'
        });
      }

      if (settings.profile.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(settings.profile.language)) {
        errors.push({
          field: 'profile.language',
          message: 'Invalid language code format',
          code: 'INVALID_FORMAT'
        });
      }
    }

    if (settings.notifications?.push?.quietHours) {
      const { start, end } = settings.notifications.push.quietHours;
      if (start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start)) {
        errors.push({
          field: 'notifications.push.quietHours.start',
          message: 'Invalid time format (use HH:mm)',
          code: 'INVALID_FORMAT'
        });
      }
      if (end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(end)) {
        errors.push({
          field: 'notifications.push.quietHours.end',
          message: 'Invalid time format (use HH:mm)',
          code: 'INVALID_FORMAT'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sync settings across devices
   */
  async syncSettings(userId: string, role: UserRole = 'shopper'): Promise<void> {
    try {
      await this.sync.syncUserSettings(userId, role);
    } catch (error) {
      console.error('Error in syncSettings:', error);
      throw error;
    }
  }

  /**
   * Force sync all settings
   */
  async forceSyncAll(): Promise<void> {
    try {
      await this.sync.forceSyncAll();
    } catch (error) {
      console.error('Error in forceSyncAll:', error);
      throw error;
    }
  }

  /**
   * Set up real-time settings listener with proper cleanup
   */
  onSettingsChange(
    userId: string,
    callback: (settings: UserSettings | null) => void
  ): () => void {
    return this.sync.addEventListener('settings_updated', (event) => {
      if (event.userId === userId && event.data) {
        callback(event.data);
      }
    });
  }

  // Mobile appearance management
  async getMobileAppearanceConfig(): Promise<MobileAppearanceConfig> {
    try {
      // Check cache first
      const cached = this.cache.getMobileAppearance();
      if (cached) {
        return cached;
      }

      // Get from database
      const config = await SettingsService.getMobileAppearanceConfig();
      
      // Cache the config
      this.cache.setMobileAppearance(config);
      
      return config;
    } catch (error) {
      console.error('Error in getMobileAppearanceConfig:', error);
      throw error;
    }
  }

  async updateMobileAppearanceConfig(
    config: Partial<MobileAppearanceConfig>
  ): Promise<void> {
    try {
      await SettingsService.updateMobileAppearanceConfig(config);
      
      // Invalidate cache to force refresh
      this.cache.invalidateMobileAppearance();
      
      // Get updated config
      const updatedConfig = await this.getMobileAppearanceConfig();
      
      // Notify about the change
      this.notifyAppearanceChange(updatedConfig);
    } catch (error) {
      console.error('Error in updateMobileAppearanceConfig:', error);
      throw error;
    }
  }

  onMobileAppearanceChange(
    callback: (config: MobileAppearanceConfig) => void
  ): () => void {
    return this.sync.addEventListener('appearance_updated', (event) => {
      if (event.data) {
        callback(event.data);
      }
    });
  }

  // Mobile asset management
  async saveMobileAsset(asset: Omit<MobileAsset, 'uploadedAt'>): Promise<void> {
    try {
      await SettingsService.saveMobileAsset(asset);
    } catch (error) {
      console.error('Error in saveMobileAsset:', error);
      throw error;
    }
  }

  async getMobileAsset(assetId: string): Promise<MobileAsset | null> {
    try {
      return await SettingsService.getMobileAsset(assetId);
    } catch (error) {
      console.error('Error in getMobileAsset:', error);
      throw error;
    }
  }

  // Private helper methods
  private async createDefaultUserSettings(
    userId: string,
    role: UserRole
  ): Promise<UserSettings> {
    const defaultSettings = await SettingsService.getDefaultSettings(role);
    
    const userSettings: UserSettings = {
      userId,
      role,
      profile: defaultSettings.profile,
      notifications: defaultSettings.notifications,
      privacy: defaultSettings.privacy,
      roleSpecific: defaultSettings.roleSpecific,
      preferences: defaultSettings.preferences,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      version: 1
    };

    // Save to database
    await SettingsService.updateUserSettings(userId, userSettings);
    
    return userSettings;
  }

  /**
   * Retry wrapper for database operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors or permission errors
        if (error instanceof Error) {
          const settingsError = error as SettingsError;
          if (settingsError.type === SettingsErrorType.VALIDATION_ERROR ||
              settingsError.type === SettingsErrorType.PERMISSION_DENIED ||
              !settingsError.retryable) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );

        console.warn(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    console.error(`${operationName} failed after ${this.retryConfig.maxAttempts} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Merge settings objects safely
   */
  private mergeSettings(current: UserSettings, updates: Partial<UserSettings>): UserSettings {
    const merged = { ...current };

    // Deep merge for nested objects
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof UserSettings];
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          merged[key as keyof UserSettings] = {
            ...merged[key as keyof UserSettings],
            ...value
          } as any;
        } else {
          merged[key as keyof UserSettings] = value as any;
        }
      }
    });

    // Update version
    merged.version = (current.version || 0) + 1;
    merged.updatedAt = new Date() as any;

    return merged;
  }

  /**
   * Create nested update object from field path
   */
  private createNestedUpdate(fieldPath: string, value: any): Partial<UserSettings> {
    const parts = fieldPath.split('.');
    const update: any = {};
    
    let current = update;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    return update;
  }

  /**
   * Clean up listeners for a user
   */
  private cleanupListeners(userId: string): void {
    const userListeners = this.listeners.get(userId);
    if (userListeners) {
      userListeners.forEach(unsubscribe => unsubscribe());
      this.listeners.delete(userId);
    }
  }

  private createValidationError(error: any): SettingsError {
    return {
      type: SettingsErrorType.VALIDATION_ERROR,
      message: error.message,
      field: error.field,
      code: error.code,
      retryable: false
    };
  }

  private createError(
    type: SettingsErrorType,
    message: string,
    retryable: boolean,
    field?: string,
    code?: string
  ): SettingsError {
    return {
      type,
      message,
      field,
      code,
      retryable
    };
  }

  private notifySettingsChange(
    userId: string,
    changes: Partial<UserSettings>
  ): void {
    // Emit custom event for settings change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { userId, changes }
      }));
    }
  }

  private notifySettingsReset(userId: string, categories?: string[]): void {
    // Emit custom event for settings reset
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('settingsReset', {
        detail: { userId, categories }
      }));
    }
  }

  private notifySettingsDeleted(userId: string): void {
    // Emit custom event for settings deletion
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('settingsDeleted', {
        detail: { userId }
      }));
    }
  }

  // Additional CRUD utilities
  
  /**
   * Get multiple users' settings
   */
  async getMultipleUserSettings(userIds: string[]): Promise<Map<string, UserSettings | null>> {
    const results = new Map<string, UserSettings | null>();
    
    // Process in parallel for better performance
    const promises = userIds.map(async (userId) => {
      try {
        // Check cache first
        const cached = this.settingsCache.get(userId);
        if (cached) {
          return { userId, settings: cached };
        }

        // Get from database
        const settings = await SettingsService.getUserSettings(userId);
        if (settings) {
          this.settingsCache.set(userId, settings);
        }
        
        return { userId, settings };
      } catch (error) {
        console.error(`Error getting settings for user ${userId}:`, error);
        return { userId, settings: null };
      }
    });

    const settingsArray = await Promise.all(promises);
    settingsArray.forEach(({ userId, settings }) => {
      results.set(userId, settings);
    });

    return results;
  }

  /**
   * Search settings by criteria
   */
  async searchUserSettings(criteria: {
    role?: UserRole;
    theme?: string;
    language?: string;
    limit?: number;
  }): Promise<UserSettings[]> {
    // This would require a more complex Firestore query
    // For now, return cached settings that match criteria
    const results: UserSettings[] = [];
    
    for (const [userId, settings] of this.settingsCache) {
      let matches = true;
      
      if (criteria.role && settings.role !== criteria.role) {
        matches = false;
      }
      
      if (criteria.theme && settings.profile.theme !== criteria.theme) {
        matches = false;
      }
      
      if (criteria.language && settings.profile.language !== criteria.language) {
        matches = false;
      }
      
      if (matches) {
        results.push(settings);
      }
      
      if (criteria.limit && results.length >= criteria.limit) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Get settings statistics
   */
  getSettingsStats(): {
    totalCached: number;
    roleDistribution: Record<UserRole, number>;
    themeDistribution: Record<string, number>;
    languageDistribution: Record<string, number>;
  } {
    const stats = {
      totalCached: this.settingsCache.size,
      roleDistribution: {} as Record<UserRole, number>,
      themeDistribution: {} as Record<string, number>,
      languageDistribution: {} as Record<string, number>
    };

    // Initialize counters
    const roles: UserRole[] = ['shopper', 'vendor', 'driver', 'admin'];
    roles.forEach(role => {
      stats.roleDistribution[role] = 0;
    });

    // Count distributions
    for (const [userId, settings] of this.settingsCache) {
      // Role distribution
      stats.roleDistribution[settings.role]++;
      
      // Theme distribution
      const theme = settings.profile.theme;
      stats.themeDistribution[theme] = (stats.themeDistribution[theme] || 0) + 1;
      
      // Language distribution
      const language = settings.profile.language;
      stats.languageDistribution[language] = (stats.languageDistribution[language] || 0) + 1;
    }

    return stats;
  }

  /**
   * Preload settings for multiple users
   */
  async preloadUserSettings(userIds: string[], defaultRole: UserRole = 'shopper'): Promise<void> {
    const uncachedUserIds = userIds.filter(userId => !this.settingsCache.has(userId));
    
    if (uncachedUserIds.length === 0) {
      return;
    }

    // Load settings in parallel
    const promises = uncachedUserIds.map(async (userId) => {
      try {
        await this.getUserSettings(userId, defaultRole);
      } catch (error) {
        console.error(`Error preloading settings for user ${userId}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Configure retry behavior
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  // Cache management
  clearCache(): void {
    this.settingsCache.clear();
    this.appearanceCache = null;
    
    // Clean up all listeners
    for (const [userId, listeners] of this.listeners) {
      listeners.forEach(unsubscribe => unsubscribe());
    }
    this.listeners.clear();
  }

  clearUserCache(userId: string): void {
    this.settingsCache.delete(userId);
    this.cleanupListeners(userId);
  }

  getCacheSize(): number {
    return this.settingsCache.size;
  }

  getListenerCount(): number {
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    return total;
  }

  /**
   * Health check for the settings manager
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      cacheSize: number;
      listenerCount: number;
      canConnectToDatabase: boolean;
      lastError?: string;
    };
  }> {
    const details = {
      cacheSize: this.getCacheSize(),
      listenerCount: this.getListenerCount(),
      canConnectToDatabase: false,
      lastError: undefined as string | undefined
    };

    try {
      // Test database connection by trying to get default settings
      await SettingsService.getDefaultSettings('shopper');
      details.canConnectToDatabase = true;
    } catch (error) {
      details.canConnectToDatabase = false;
      details.lastError = error instanceof Error ? error.message : 'Unknown error';
    }

    const status = details.canConnectToDatabase ? 'healthy' : 'unhealthy';

    return { status, details };
  }
}