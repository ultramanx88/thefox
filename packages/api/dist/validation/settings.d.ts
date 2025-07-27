import type { UserRole } from '../types/settings';
export declare const userRoleSchema: any;
export declare const profileSettingsSchema: any;
export declare const notificationSettingsSchema: any;
export declare const privacySettingsSchema: any;
export declare const preferenceSettingsSchema: any;
export declare const businessHoursSchema: any;
export declare const contactInfoSchema: any;
export declare const taxSettingsSchema: any;
export declare const availabilityScheduleSchema: any;
export declare const insuranceInfoSchema: any;
export declare const paymentGatewayConfigSchema: any;
export declare const notificationServiceConfigSchema: any;
export declare const customThemeSchema: any;
export declare const shopperSettingsSchema: any;
export declare const vendorSettingsSchema: any;
export declare const driverSettingsSchema: any;
export declare const adminSettingsSchema: any;
export declare const roleSpecificSettingsSchema: any;
export declare const userSettingsSchema: any;
export declare const userSettingsUpdateSchema: any;
export declare const splashScreenConfigSchema: any;
export declare const brandingConfigSchema: any;
export declare const themeConfigSchema: any;
export declare const mobileAppearanceConfigSchema: any;
export declare const imageMetadataSchema: any;
export declare const mobileAssetSchema: any;
export declare const settingsExportSchema: any;
export declare function validateUserSettings(data: unknown): any;
export declare function validateUserSettingsUpdate(data: unknown): any;
export declare function validateRoleSpecificSettings(data: unknown, role: UserRole): any;
export declare function validateMobileAppearanceConfig(data: unknown): any;
export declare function validateMobileAsset(data: unknown): any;
export declare const defaultProfileSettings: {
    displayName: string;
    language: string;
    timezone: string;
    currency: string;
    theme: "system";
};
export declare const defaultNotificationSettings: {
    push: {
        enabled: boolean;
        orders: boolean;
        promotions: boolean;
        system: boolean;
        quietHours: {
            enabled: boolean;
            start: string;
            end: string;
        };
    };
    email: {
        enabled: boolean;
        orders: boolean;
        promotions: boolean;
        newsletter: boolean;
        frequency: "immediate";
    };
    sms: {
        enabled: boolean;
        orders: boolean;
        security: boolean;
    };
};
export declare const defaultPrivacySettings: {
    dataSharing: boolean;
    locationSharing: boolean;
    profileVisibility: "public";
    activityTracking: boolean;
    analytics: boolean;
};
export declare const defaultPreferenceSettings: {
    autoSave: boolean;
    confirmActions: boolean;
    showTutorials: boolean;
    compactView: boolean;
};
export declare const defaultMobileAppearanceConfig: {
    splashScreen: {
        backgroundColor: string;
        logoPosition: "center";
        showLoadingIndicator: boolean;
    };
    branding: {
        brandColors: {
            primary: string;
            secondary: string;
            accent: string;
        };
    };
    theme: {
        defaultTheme: "system";
    };
    version: number;
};
