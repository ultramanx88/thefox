import { SettingsService } from '../firebase/settings';
import { SettingsCache } from './SettingsCache';
import type { 
  UserSettings, 
  MobileAppearanceConfig, 
  SettingsChange,
  UserRole 
} from '../types/settings';

// Sync event types
type SyncEventType = 
  | 'settings_updated'
  | 'settings_deleted'
  | 'appearance_updated'
  | 'sync_conflict'
  | 'sync_error'
  | 'sync_complete';

interface SyncEvent {
  type: SyncEventType;
  userId?: string;
  data?: any;
  timestamp: number;
  source: 'local' | 'remote';
}

// Conflict resolution strategies
type ConflictResolution = 'last_write_wins' | 'merge' | 'manual';

interface SyncConfig {
  enableRealTimeSync: boolean;
  conflictResolution: ConflictResolution;
  syncInterval: number; // Fallback sync interval in ms
  maxRetries: number;
  batchSize: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enableRealTimeSync: true,
  conflictResolution: 'last_write_wins',
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  batchSize: 10
};

/**
 * Real-time synchronization service for settings across devices
 */
export class SettingsSync {
  private cache: SettingsCache;
  private config: SyncConfig = DEFAULT_SYNC_CONFIG;
  private listeners = new Map<string, (() => void)[]>();
  private eventListeners = new Map<SyncEventType, ((event: SyncEvent) => void)[]>();
  private syncTimer: NodeJS.Timeout | null = null;
  private isActive = false;

  constructor(cache: SettingsCache, config?: Partial<SyncConfig>) {
    this.cache = cache;
    if (config) {
      this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    }
  }

  /**
   * Start synchronization service
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    
    if (this.config.enableRealTimeSync) {
      this.setupRealTimeListeners();
    }
    
    this.startFallbackSync();
    this.emitEvent('sync_complete', { message: 'Sync service started' });
  }

  /**
   * Stop synchronization service
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.cleanupListeners();
    this.stopFallbackSync();
    this.emitEvent('sync_complete', { message: 'Sync service stopped' });
  }

  /**
   * Sync specific user settings
   */
  async syncUserSettings(userId: string, role: UserRole): Promise<void> {
    try {
      // Get latest from server
      const serverSettings = await SettingsService.getUserSettings(userId);
      const cachedSettings = this.cache.getUserSettings(userId);

      if (!serverSettings) {
        // Settings deleted on server
        if (cachedSettings) {
          this.cache.deleteUserSettings(userId);
          this.emitEvent('settings_deleted', { userId });
        }
        return;
      }

      if (!cachedSettings) {
        // New settings from server
        this.cache.setUserSettings(userId, serverSettings);
        this.emitEvent('settings_updated', { userId, data: serverSettings });
        return;
      }

      // Check for conflicts
      if (serverSettings.version !== cachedSettings.version) {
        await this.resolveConflict(userId, cachedSettings, serverSettings);
      }
    } catch (error) {
      console.error(`Failed to sync settings for user ${userId}:`, error);
      this.emitEvent('sync_error', { userId, data: error });
    }
  }

  /**
   * Sync mobile appearance settings
   */
  async syncMobileAppearance(): Promise<void> {
    try {
      const serverConfig = await SettingsService.getMobileAppearanceConfig();
      const cachedConfig = this.cache.getMobileAppearance();

      if (!cachedConfig || serverConfig.version > cachedConfig.version) {
        this.cache.setMobileAppearance(serverConfig);
        this.emitEvent('appearance_updated', { data: serverConfig });
      }
    } catch (error) {
      console.error('Failed to sync mobile appearance:', error);
      this.emitEvent('sync_error', { data: error });
    }
  }

  /**
   * Force sync all cached data
   */
  async forceSyncAll(): Promise<void> {
    try {
      // Sync mobile appearance
      await this.syncMobileAppearance();

      // Process sync queue
      await this.cache.processSyncQueue();

      // Sync dirty entries
      const dirtyUserIds = this.cache.getDirtyEntries();
      for (const userId of dirtyUserIds) {
        const settings = this.cache.getUserSettings(userId);
        if (settings) {
          await SettingsService.updateUserSettings(userId, settings);
          this.cache.markClean(userId);
        }
      }

      this.emitEvent('sync_complete', { message: 'Force sync completed' });
    } catch (error) {
      console.error('Force sync failed:', error);
      this.emitEvent('sync_error', { data: error });
    }
  }

  /**
   * Set up real-time listener for user settings
   */
  setupUserSettingsListener(userId: string, role: UserRole): () => void {
    const unsubscribe = SettingsService.onSettingsChange(userId, (settings) => {
      if (settings) {
        const cached = this.cache.getUserSettings(userId);
        
        // Only update if version is newer or different
        if (!cached || settings.version > cached.version) {
          this.cache.setUserSettings(userId, settings);
          this.emitEvent('settings_updated', { 
            userId, 
            data: settings, 
            source: 'remote' 
          });
        }
      } else {
        // Settings deleted
        this.cache.deleteUserSettings(userId);
        this.emitEvent('settings_deleted', { 
          userId, 
          source: 'remote' 
        });
      }
    });

    // Track listener for cleanup
    const userListeners = this.listeners.get(userId) || [];
    userListeners.push(unsubscribe);
    this.listeners.set(userId, userListeners);

    return unsubscribe;
  }

  /**
   * Set up real-time listener for mobile appearance
   */
  setupMobileAppearanceListener(): () => void {
    return SettingsService.onMobileAppearanceChange((config) => {
      const cached = this.cache.getMobileAppearance();
      
      // Only update if version is newer
      if (!cached || config.version > cached.version) {
        this.cache.setMobileAppearance(config);
        this.emitEvent('appearance_updated', { 
          data: config, 
          source: 'remote' 
        });
      }
    });
  }

  /**
   * Handle optimistic updates
   */
  async optimisticUpdate(
    userId: string, 
    updates: Partial<UserSettings>,
    source: 'web' | 'mobile' = 'web'
  ): Promise<void> {
    // Update cache immediately
    const success = this.cache.updateUserSettings(userId, updates);
    
    if (success) {
      this.emitEvent('settings_updated', { 
        userId, 
        data: updates, 
        source: 'local' 
      });

      // Add to sync queue for eventual consistency
      this.cache.addToSyncQueue({
        userId,
        operation: 'update',
        data: updates,
        source
      });

      // Try to sync immediately if online
      if (this.cache.getOnlineStatus()) {
        try {
          await SettingsService.updateUserSettings(userId, updates, source);
          this.cache.markClean(userId);
        } catch (error) {
          console.error('Optimistic update sync failed:', error);
          // Will be retried by sync queue
        }
      }
    }
  }

  /**
   * Add event listener
   */
  addEventListener(
    type: SyncEventType, 
    listener: (event: SyncEvent) => void
  ): () => void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.eventListeners.get(type) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    isActive: boolean;
    queueSize: number;
    dirtyEntries: number;
    activeListeners: number;
    lastSyncTime: number;
  } {
    return {
      isActive: this.isActive,
      queueSize: this.cache.getSyncQueue().length,
      dirtyEntries: this.cache.getDirtyEntries().length,
      activeListeners: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      lastSyncTime: Date.now() // TODO: Track actual last sync time
    };
  }

  /**
   * Update sync configuration
   */
  updateConfig(config: Partial<SyncConfig>): void {
    const oldConfig = this.config;
    this.config = { ...this.config, ...config };

    // Restart services if needed
    if (oldConfig.enableRealTimeSync !== config.enableRealTimeSync) {
      if (this.isActive) {
        this.stop();
        this.start();
      }
    }

    if (oldConfig.syncInterval !== config.syncInterval) {
      this.stopFallbackSync();
      this.startFallbackSync();
    }
  }

  // Private methods
  private setupRealTimeListeners(): void {
    // Mobile appearance listener is global
    const appearanceUnsubscribe = this.setupMobileAppearanceListener();
    this.listeners.set('__appearance__', [appearanceUnsubscribe]);
  }

  private cleanupListeners(): void {
    for (const [key, listeners] of this.listeners) {
      listeners.forEach(unsubscribe => unsubscribe());
    }
    this.listeners.clear();
  }

  private startFallbackSync(): void {
    this.syncTimer = setInterval(async () => {
      if (this.cache.getOnlineStatus()) {
        await this.cache.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  private stopFallbackSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async resolveConflict(
    userId: string,
    localSettings: UserSettings,
    serverSettings: UserSettings
  ): Promise<void> {
    let resolvedSettings: UserSettings;

    switch (this.config.conflictResolution) {
      case 'last_write_wins':
        resolvedSettings = serverSettings.updatedAt > localSettings.updatedAt 
          ? serverSettings 
          : localSettings;
        break;

      case 'merge':
        resolvedSettings = this.mergeSettings(localSettings, serverSettings);
        break;

      case 'manual':
        this.emitEvent('sync_conflict', {
          userId,
          data: { local: localSettings, server: serverSettings }
        });
        return;

      default:
        resolvedSettings = serverSettings;
    }

    // Update cache with resolved settings
    this.cache.setUserSettings(userId, resolvedSettings);
    
    // Update server if local version was chosen or merged
    if (resolvedSettings !== serverSettings) {
      await SettingsService.updateUserSettings(userId, resolvedSettings);
    }

    this.emitEvent('settings_updated', { 
      userId, 
      data: resolvedSettings,
      source: 'local'
    });
  }

  private mergeSettings(local: UserSettings, server: UserSettings): UserSettings {
    // Simple merge strategy - prefer server for system fields, local for user preferences
    const merged: UserSettings = {
      ...server,
      profile: {
        ...server.profile,
        ...local.profile,
        // Prefer server for system-managed fields
        avatar: server.profile.avatar || local.profile.avatar
      },
      notifications: {
        ...server.notifications,
        ...local.notifications
      },
      privacy: {
        ...server.privacy,
        ...local.privacy
      },
      preferences: {
        ...server.preferences,
        ...local.preferences
      },
      // Use latest version + 1
      version: Math.max(local.version, server.version) + 1,
      updatedAt: new Date() as any
    };

    return merged;
  }

  private emitEvent(type: SyncEventType, data?: any): void {
    const event: SyncEvent = {
      type,
      data,
      timestamp: Date.now(),
      source: 'local'
    };

    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in sync event listener for ${type}:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.eventListeners.clear();
  }
}