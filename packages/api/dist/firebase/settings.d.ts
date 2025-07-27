import type { UserSettings, UserRole, DefaultSettings, MobileAppearanceConfig, MobileAsset, SettingsExport } from '../types/settings';
export declare class SettingsService {
    private static readonly SETTINGS_COLLECTION;
    private static readonly SETTINGS_DEFAULTS_COLLECTION;
    private static readonly SETTINGS_AUDIT_COLLECTION;
    private static readonly MOBILE_APPEARANCE_COLLECTION;
    private static readonly MOBILE_ASSETS_COLLECTION;
    static getUserSettings(userId: string): Promise<UserSettings | null>;
    static updateUserSettings(userId: string, settings: Partial<UserSettings>, source?: 'web' | 'mobile'): Promise<void>;
    static resetUserSettings(userId: string, role: UserRole, categories?: string[]): Promise<void>;
    static exportUserSettings(userId: string): Promise<SettingsExport>;
    static getDefaultSettings(role: UserRole): Promise<DefaultSettings>;
    static initializeDefaultSettings(): Promise<void>;
    static onSettingsChange(userId: string, callback: (settings: UserSettings | null) => void): () => void;
    static getMobileAppearanceConfig(): Promise<MobileAppearanceConfig>;
    static updateMobileAppearanceConfig(config: Partial<MobileAppearanceConfig>): Promise<void>;
    static onMobileAppearanceChange(callback: (config: MobileAppearanceConfig) => void): () => void;
    static saveMobileAsset(asset: Omit<MobileAsset, 'uploadedAt'>): Promise<void>;
    static getMobileAsset(assetId: string): Promise<MobileAsset | null>;
    static deleteUserSettings(userId: string): Promise<void>;
    static deleteMobileAsset(assetId: string): Promise<void>;
    private static logSettingsChanges;
    private static getHardcodedDefaults;
    private static createSettingsError;
    private static createValidationError;
}
