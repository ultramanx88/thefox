import type { UserSettings, MobileAppearanceConfig } from '../types/settings';

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enablePersistence: boolean;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000, // Maximum number of cached settings
  ttl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
  enablePersistence: true
};

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  version: number;
  dirty: boolean; // Indicates if data needs to be synced
}

// Cache statistics
interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalAccesses: number;
  oldestEntry: number;
  newestEntry: number;
  memoryUsage: number;
}

// Sync queue entry for offline support
interface SyncQueueEntry {
  userId: string;
  operation: 'create' | 'update' | 'delete';
  data: Partial<UserSettings>;
  timestamp: number;
  retryCount: number;
  source: 'web' | 'mobile';
}

/**
 * Advanced caching system for settings with LRU eviction, TTL, and offline sync
 */
export class SettingsCache {
  private userSettingsCache = new Map<string, CacheEntry<UserSettings>>();
  private appearanceCache: CacheEntry<MobileAppearanceConfig> | null = null;
  private syncQueue: SyncQueueEntry[] = [];
  private config: CacheConfig = DEFAULT_CACHE_CONFIG;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    syncOperations: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    }

    this.startCleanupTimer();
    this.setupOnlineStatusListener();
    this.loadPersistedCache();
  }

  // User settings cache operations
  getUserSettings(userId: string): UserSettings | null {
    const entry = this.userSettingsCache.get(userId);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.userSettingsCache.delete(userId);
      this.stats.misses++;
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  setUserSettings(userId: string, settings: UserSettings, version?: number): void {
    // Ensure cache size limit
    this.ensureCacheSize();

    const now = Date.now();
    const entry: CacheEntry<UserSettings> = {
      data: settings,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      version: version || settings.version,
      dirty: false
    };

    this.userSettingsCache.set(userId, entry);
    this.persistCache();
  }

  updateUserSettings(userId: string, updates: Partial<UserSettings>): boolean {
    const entry = this.userSettingsCache.get(userId);
    if (!entry || this.isExpired(entry)) {
      return false;
    }

    // Deep merge updates
    entry.data = this.deepMerge(entry.data, updates);
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    entry.version++;
    entry.dirty = true;

    this.persistCache();
    return true;
  }

  deleteUserSettings(userId: string): boolean {
    const deleted = this.userSettingsCache.delete(userId);
    if (deleted) {
      this.persistCache();
    }
    return deleted;
  }

  // Mobile appearance cache operations
  getMobileAppearance(): MobileAppearanceConfig | null {
    if (!this.appearanceCache || this.isExpired(this.appearanceCache)) {
      this.stats.misses++;
      return null;
    }

    this.appearanceCache.accessCount++;
    this.appearanceCache.lastAccessed = Date.now();
    this.stats.hits++;

    return this.appearanceCache.data;
  }

  setMobileAppearance(config: MobileAppearanceConfig): void {
    const now = Date.now();
    this.appearanceCache = {
      data: config,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      version: config.version,
      dirty: false
    };

    this.persistCache();
  }

  // Offline sync queue operations
  addToSyncQueue(entry: Omit<SyncQueueEntry, 'timestamp' | 'retryCount'>): void {
    const syncEntry: SyncQueueEntry = {
      ...entry,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(syncEntry);
    this.persistSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  getSyncQueue(): SyncQueueEntry[] {
    return [...this.syncQueue];
  }

  clearSyncQueue(): void {
    this.syncQueue = [];
    this.persistSyncQueue();
  }

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const { SettingsService } = await import('../firebase/settings');
    const processedEntries: number[] = [];

    for (let i = 0; i < this.syncQueue.length; i++) {
      const entry = this.syncQueue[i];
      
      try {
        switch (entry.operation) {
          case 'create':
          case 'update':
            await SettingsService.updateUserSettings(entry.userId, entry.data, entry.source);
            break;
          case 'delete':
            await SettingsService.deleteUserSettings(entry.userId);
            break;
        }

        processedEntries.push(i);
        this.stats.syncOperations++;
      } catch (error) {
        console.error(`Sync failed for entry ${i}:`, error);
        entry.retryCount++;
        
        // Remove entries that have failed too many times
        if (entry.retryCount > 3) {
          processedEntries.push(i);
        }
      }
    }

    // Remove processed entries (in reverse order to maintain indices)
    processedEntries.reverse().forEach(index => {
      this.syncQueue.splice(index, 1);
    });

    if (processedEntries.length > 0) {
      this.persistSyncQueue();
    }
  }

  // Cache invalidation
  invalidateUserSettings(userId: string): void {
    this.userSettingsCache.delete(userId);
    this.persistCache();
  }

  invalidateMobileAppearance(): void {
    this.appearanceCache = null;
    this.persistCache();
  }

  invalidateAll(): void {
    this.userSettingsCache.clear();
    this.appearanceCache = null;
    this.clearSyncQueue();
    this.persistCache();
  }

  // Cache warming
  async warmCache(userIds: string[]): Promise<void> {
    const { SettingsService } = await import('../firebase/settings');
    
    const promises = userIds.map(async (userId) => {
      if (!this.getUserSettings(userId)) {
        try {
          const settings = await SettingsService.getUserSettings(userId);
          if (settings) {
            this.setUserSettings(userId, settings);
          }
        } catch (error) {
          console.error(`Failed to warm cache for user ${userId}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  // Cache statistics
  getStats(): CacheStats {
    const totalAccesses = this.stats.hits + this.stats.misses;
    const entries = Array.from(this.userSettingsCache.values());
    
    return {
      size: this.userSettingsCache.size,
      hitRate: totalAccesses > 0 ? this.stats.hits / totalAccesses : 0,
      missRate: totalAccesses > 0 ? this.stats.misses / totalAccesses : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      totalAccesses,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      syncOperations: 0
    };
  }

  // Configuration
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart cleanup timer if interval changed
    if (config.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // Online/offline status
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // Process sync queue when coming back online
    if (wasOffline && isOnline) {
      this.processSyncQueue();
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Dirty data management
  getDirtyEntries(): string[] {
    const dirtyUserIds: string[] = [];
    
    for (const [userId, entry] of this.userSettingsCache) {
      if (entry.dirty) {
        dirtyUserIds.push(userId);
      }
    }

    return dirtyUserIds;
  }

  markClean(userId: string): void {
    const entry = this.userSettingsCache.get(userId);
    if (entry) {
      entry.dirty = false;
    }
  }

  markAllClean(): void {
    for (const entry of this.userSettingsCache.values()) {
      entry.dirty = false;
    }
    
    if (this.appearanceCache) {
      this.appearanceCache.dirty = false;
    }
  }

  // Private helper methods
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private ensureCacheSize(): void {
    if (this.userSettingsCache.size >= this.config.maxSize) {
      // LRU eviction - remove least recently used entries
      const entries = Array.from(this.userSettingsCache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = Math.ceil(this.config.maxSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.userSettingsCache.delete(entries[i][0]);
        this.stats.evictions++;
      }
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [userId, entry] of this.userSettingsCache) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(userId);
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => {
      this.userSettingsCache.delete(key);
    });

    // Check appearance cache
    if (this.appearanceCache && this.isExpired(this.appearanceCache)) {
      this.appearanceCache = null;
    }

    if (expiredKeys.length > 0) {
      this.persistCache();
    }
  }

  private setupOnlineStatusListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setOnlineStatus(true);
      });

      window.addEventListener('offline', () => {
        this.setOnlineStatus(false);
      });

      // Initial status
      this.setOnlineStatus(navigator.onLine);
    }
  }

  private persistCache(): void {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cacheData = {
        userSettings: Array.from(this.userSettingsCache.entries()),
        appearance: this.appearanceCache,
        timestamp: Date.now()
      };

      localStorage.setItem('settingsCache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  private loadPersistedCache(): void {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cached = localStorage.getItem('settingsCache');
      if (!cached) return;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Don't load cache if it's too old
      if (age > this.config.ttl * 2) {
        localStorage.removeItem('settingsCache');
        return;
      }

      // Restore user settings cache
      if (cacheData.userSettings) {
        this.userSettingsCache = new Map(cacheData.userSettings);
      }

      // Restore appearance cache
      if (cacheData.appearance) {
        this.appearanceCache = cacheData.appearance;
      }
    } catch (error) {
      console.error('Failed to load persisted cache:', error);
      localStorage.removeItem('settingsCache');
    }
  }

  private persistSyncQueue(): void {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('settingsSyncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private loadPersistedSyncQueue(): void {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const cached = localStorage.getItem('settingsSyncQueue');
      if (cached) {
        this.syncQueue = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to load persisted sync queue:', error);
      localStorage.removeItem('settingsSyncQueue');
    }
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    
    // Estimate user settings cache size
    for (const [key, entry] of this.userSettingsCache) {
      size += key.length * 2; // String characters are 2 bytes
      size += JSON.stringify(entry).length * 2;
    }

    // Estimate appearance cache size
    if (this.appearanceCache) {
      size += JSON.stringify(this.appearanceCache).length * 2;
    }

    // Estimate sync queue size
    size += JSON.stringify(this.syncQueue).length * 2;

    return size;
  }

  // Cleanup on destruction
  destroy(): void {
    this.stopCleanupTimer();
    this.invalidateAll();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    }
  }
}