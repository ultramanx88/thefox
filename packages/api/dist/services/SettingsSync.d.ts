import { SettingsCache } from './SettingsCache';
import type { UserSettings, UserRole } from '../types/settings';
type SyncEventType = 'settings_updated' | 'settings_deleted' | 'appearance_updated' | 'sync_conflict' | 'sync_error' | 'sync_complete';
interface SyncEvent {
    type: SyncEventType;
    userId?: string;
    data?: any;
    timestamp: number;
    source: 'local' | 'remote';
}
type ConflictResolution = 'last_write_wins' | 'merge' | 'manual';
interface SyncConfig {
    enableRealTimeSync: boolean;
    conflictResolution: ConflictResolution;
    syncInterval: number;
    maxRetries: number;
    batchSize: number;
}
/**
 * Real-time synchronization service for settings across devices
 */
export declare class SettingsSync {
    private cache;
    private config;
    private listeners;
    private eventListeners;
    private syncTimer;
    private isActive;
    constructor(cache: SettingsCache, config?: Partial<SyncConfig>);
    /**
     * Start synchronization service
     */
    start(): void;
    /**
     * Stop synchronization service
     */
    stop(): void;
    /**
     * Sync specific user settings
     */
    syncUserSettings(userId: string, role: UserRole): Promise<void>;
    /**
     * Sync mobile appearance settings
     */
    syncMobileAppearance(): Promise<void>;
    /**
     * Force sync all cached data
     */
    forceSyncAll(): Promise<void>;
    /**
     * Set up real-time listener for user settings
     */
    setupUserSettingsListener(userId: string, role: UserRole): () => void;
    /**
     * Set up real-time listener for mobile appearance
     */
    setupMobileAppearanceListener(): () => void;
    /**
     * Handle optimistic updates
     */
    optimisticUpdate(userId: string, updates: Partial<UserSettings>, source?: 'web' | 'mobile'): Promise<void>;
    /**
     * Add event listener
     */
    addEventListener(type: SyncEventType, listener: (event: SyncEvent) => void): () => void;
    /**
     * Get sync statistics
     */
    getSyncStats(): {
        isActive: boolean;
        queueSize: number;
        dirtyEntries: number;
        activeListeners: number;
        lastSyncTime: number;
    };
    /**
     * Update sync configuration
     */
    updateConfig(config: Partial<SyncConfig>): void;
    private setupRealTimeListeners;
    private cleanupListeners;
    private startFallbackSync;
    private stopFallbackSync;
    private resolveConflict;
    private mergeSettings;
    private emitEvent;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export {};
