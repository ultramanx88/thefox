import type { UserSettings, MobileAppearanceConfig } from '../types/settings';
interface CacheConfig {
    maxSize: number;
    ttl: number;
    cleanupInterval: number;
    enablePersistence: boolean;
}
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
export declare class SettingsCache {
    private userSettingsCache;
    private appearanceCache;
    private syncQueue;
    private config;
    private stats;
    private cleanupTimer;
    private isOnline;
    constructor(config?: Partial<CacheConfig>);
    getUserSettings(userId: string): UserSettings | null;
    setUserSettings(userId: string, settings: UserSettings, version?: number): void;
    updateUserSettings(userId: string, updates: Partial<UserSettings>): boolean;
    deleteUserSettings(userId: string): boolean;
    getMobileAppearance(): MobileAppearanceConfig | null;
    setMobileAppearance(config: MobileAppearanceConfig): void;
    addToSyncQueue(entry: Omit<SyncQueueEntry, 'timestamp' | 'retryCount'>): void;
    getSyncQueue(): SyncQueueEntry[];
    clearSyncQueue(): void;
    processSyncQueue(): Promise<void>;
    invalidateUserSettings(userId: string): void;
    invalidateMobileAppearance(): void;
    invalidateAll(): void;
    warmCache(userIds: string[]): Promise<void>;
    getStats(): CacheStats;
    resetStats(): void;
    updateConfig(config: Partial<CacheConfig>): void;
    getConfig(): CacheConfig;
    setOnlineStatus(isOnline: boolean): void;
    getOnlineStatus(): boolean;
    getDirtyEntries(): string[];
    markClean(userId: string): void;
    markAllClean(): void;
    private isExpired;
    private ensureCacheSize;
    private deepMerge;
    private startCleanupTimer;
    private stopCleanupTimer;
    private cleanup;
    private setupOnlineStatusListener;
    private persistCache;
    private loadPersistedCache;
    private persistSyncQueue;
    private loadPersistedSyncQueue;
    private estimateMemoryUsage;
    destroy(): void;
}
export {};
