import type { UserSettings, UserRole, ValidationResult, SettingsExport, MobileAppearanceConfig, MobileAsset } from '../types/settings';
interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}
/**
 * High-level settings management interface
 * Provides business logic layer on top of SettingsService
 */
export declare class SettingsManager {
    private static instance;
    private cache;
    private sync;
    private retryConfig;
    private listeners;
    private constructor();
    static getInstance(): SettingsManager;
    /**
     * Get user settings with advanced caching and retry logic
     */
    getUserSettings(userId: string, role: UserRole): Promise<UserSettings>;
    /**
     * Create new user settings
     */
    createUserSettings(userId: string, role: UserRole, initialSettings?: Partial<UserSettings>): Promise<UserSettings>;
    /**
     * Check if user settings exist
     */
    userSettingsExist(userId: string): Promise<boolean>;
    /**
     * Delete user settings
     */
    deleteUserSettings(userId: string): Promise<void>;
    /**
     * Update user settings with validation, caching, and retry logic
     */
    updateUserSettings(userId: string, settings: Partial<UserSettings>, source?: 'web' | 'mobile'): Promise<UserSettings>;
    /**
     * Update specific setting field
     */
    updateSettingField(userId: string, fieldPath: string, value: any, source?: 'web' | 'mobile'): Promise<void>;
    /**
     * Batch update multiple settings
     */
    batchUpdateSettings(updates: Array<{
        userId: string;
        settings: Partial<UserSettings>;
        source?: 'web' | 'mobile';
    }>): Promise<void>;
    /**
     * Reset user settings to defaults
     */
    resetUserSettings(userId: string, role: UserRole, categories?: string[]): Promise<void>;
    /**
     * Export user settings
     */
    exportUserSettings(userId: string): Promise<SettingsExport>;
    /**
     * Validate settings data
     */
    validateSettings(settings: Partial<UserSettings>): ValidationResult;
    /**
     * Sync settings across devices
     */
    syncSettings(userId: string, role?: UserRole): Promise<void>;
    /**
     * Force sync all settings
     */
    forceSyncAll(): Promise<void>;
    /**
     * Set up real-time settings listener with proper cleanup
     */
    onSettingsChange(userId: string, callback: (settings: UserSettings | null) => void): () => void;
    getMobileAppearanceConfig(): Promise<MobileAppearanceConfig>;
    updateMobileAppearanceConfig(config: Partial<MobileAppearanceConfig>): Promise<void>;
    onMobileAppearanceChange(callback: (config: MobileAppearanceConfig) => void): () => void;
    saveMobileAsset(asset: Omit<MobileAsset, 'uploadedAt'>): Promise<void>;
    getMobileAsset(assetId: string): Promise<MobileAsset | null>;
    private createDefaultUserSettings;
    /**
     * Retry wrapper for database operations
     */
    private withRetry;
    /**
     * Merge settings objects safely
     */
    private mergeSettings;
    /**
     * Create nested update object from field path
     */
    private createNestedUpdate;
    /**
     * Clean up listeners for a user
     */
    private cleanupListeners;
    private createValidationError;
    private createError;
    private notifySettingsChange;
    private notifySettingsReset;
    private notifySettingsDeleted;
    /**
     * Get multiple users' settings
     */
    getMultipleUserSettings(userIds: string[]): Promise<Map<string, UserSettings | null>>;
    /**
     * Search settings by criteria
     */
    searchUserSettings(criteria: {
        role?: UserRole;
        theme?: string;
        language?: string;
        limit?: number;
    }): Promise<UserSettings[]>;
    /**
     * Get settings statistics
     */
    getSettingsStats(): {
        totalCached: number;
        roleDistribution: Record<UserRole, number>;
        themeDistribution: Record<string, number>;
        languageDistribution: Record<string, number>;
    };
    /**
     * Preload settings for multiple users
     */
    preloadUserSettings(userIds: string[], defaultRole?: UserRole): Promise<void>;
    /**
     * Configure retry behavior
     */
    setRetryConfig(config: Partial<RetryConfig>): void;
    /**
     * Get current retry configuration
     */
    getRetryConfig(): RetryConfig;
    clearCache(): void;
    clearUserCache(userId: string): void;
    getCacheSize(): number;
    getListenerCount(): number;
    /**
     * Health check for the settings manager
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: {
            cacheSize: number;
            listenerCount: number;
            canConnectToDatabase: boolean;
            lastError?: string;
        };
    }>;
}
export {};
