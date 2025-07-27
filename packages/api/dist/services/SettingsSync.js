import { SettingsService } from '../firebase/settings';
const DEFAULT_SYNC_CONFIG = {
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
    constructor(cache, config) {
        this.config = DEFAULT_SYNC_CONFIG;
        this.listeners = new Map();
        this.eventListeners = new Map();
        this.syncTimer = null;
        this.isActive = false;
        this.cache = cache;
        if (config) {
            this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
        }
    }
    /**
     * Start synchronization service
     */
    start() {
        if (this.isActive)
            return;
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
    stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        this.cleanupListeners();
        this.stopFallbackSync();
        this.emitEvent('sync_complete', { message: 'Sync service stopped' });
    }
    /**
     * Sync specific user settings
     */
    async syncUserSettings(userId, role) {
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
        }
        catch (error) {
            console.error(`Failed to sync settings for user ${userId}:`, error);
            this.emitEvent('sync_error', { userId, data: error });
        }
    }
    /**
     * Sync mobile appearance settings
     */
    async syncMobileAppearance() {
        try {
            const serverConfig = await SettingsService.getMobileAppearanceConfig();
            const cachedConfig = this.cache.getMobileAppearance();
            if (!cachedConfig || serverConfig.version > cachedConfig.version) {
                this.cache.setMobileAppearance(serverConfig);
                this.emitEvent('appearance_updated', { data: serverConfig });
            }
        }
        catch (error) {
            console.error('Failed to sync mobile appearance:', error);
            this.emitEvent('sync_error', { data: error });
        }
    }
    /**
     * Force sync all cached data
     */
    async forceSyncAll() {
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
        }
        catch (error) {
            console.error('Force sync failed:', error);
            this.emitEvent('sync_error', { data: error });
        }
    }
    /**
     * Set up real-time listener for user settings
     */
    setupUserSettingsListener(userId, role) {
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
            }
            else {
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
    setupMobileAppearanceListener() {
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
    async optimisticUpdate(userId, updates, source = 'web') {
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
                }
                catch (error) {
                    console.error('Optimistic update sync failed:', error);
                    // Will be retried by sync queue
                }
            }
        }
    }
    /**
     * Add event listener
     */
    addEventListener(type, listener) {
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
    getSyncStats() {
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
    updateConfig(config) {
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
    setupRealTimeListeners() {
        // Mobile appearance listener is global
        const appearanceUnsubscribe = this.setupMobileAppearanceListener();
        this.listeners.set('__appearance__', [appearanceUnsubscribe]);
    }
    cleanupListeners() {
        for (const [key, listeners] of this.listeners) {
            listeners.forEach(unsubscribe => unsubscribe());
        }
        this.listeners.clear();
    }
    startFallbackSync() {
        this.syncTimer = setInterval(async () => {
            if (this.cache.getOnlineStatus()) {
                await this.cache.processSyncQueue();
            }
        }, this.config.syncInterval);
    }
    stopFallbackSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    async resolveConflict(userId, localSettings, serverSettings) {
        let resolvedSettings;
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
    mergeSettings(local, server) {
        // Simple merge strategy - prefer server for system fields, local for user preferences
        const merged = {
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
            updatedAt: new Date()
        };
        return merged;
    }
    emitEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: Date.now(),
            source: 'local'
        };
        const listeners = this.eventListeners.get(type) || [];
        listeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                console.error(`Error in sync event listener for ${type}:`, error);
            }
        });
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.eventListeners.clear();
    }
}
