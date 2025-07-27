import { Timestamp } from 'firebase/firestore';
export type UserRole = 'shopper' | 'vendor' | 'driver' | 'admin';
export interface UserSettings {
    userId: string;
    role: UserRole;
    profile: ProfileSettings;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    roleSpecific: RoleSpecificSettings;
    preferences: PreferenceSettings;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: number;
}
export interface ProfileSettings {
    displayName: string;
    avatar?: string;
    language: string;
    timezone: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
}
export interface NotificationSettings {
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
        frequency: 'immediate' | 'daily' | 'weekly';
    };
    sms: {
        enabled: boolean;
        orders: boolean;
        security: boolean;
    };
}
export interface PrivacySettings {
    dataSharing: boolean;
    locationSharing: boolean;
    profileVisibility: 'public' | 'private' | 'friends';
    activityTracking: boolean;
    analytics: boolean;
}
export interface PreferenceSettings {
    autoSave: boolean;
    confirmActions: boolean;
    showTutorials: boolean;
    compactView: boolean;
}
export type RoleSpecificSettings = ShopperSettings | VendorSettings | DriverSettings | AdminSettings;
export interface ShopperSettings {
    type: 'shopper';
    defaultDeliveryAddress?: string;
    paymentPreferences: {
        defaultMethod?: string;
        saveCards: boolean;
        autoReorder: boolean;
    };
    orderPreferences: {
        confirmationRequired: boolean;
        substituteItems: boolean;
        deliveryInstructions?: string;
    };
}
export interface VendorSettings {
    type: 'vendor';
    businessProfile: {
        businessName: string;
        description: string;
        logo?: string;
        banner?: string;
        businessHours: BusinessHours[];
        contactInfo: ContactInfo;
    };
    operationalSettings: {
        autoAcceptOrders: boolean;
        preparationTime: number;
        deliveryRadius: number;
        minimumOrder: number;
    };
    financialSettings: {
        payoutSchedule: 'daily' | 'weekly' | 'monthly';
        taxSettings: TaxSettings;
    };
}
export interface DriverSettings {
    type: 'driver';
    availability: {
        schedule: AvailabilitySchedule[];
        autoAcceptJobs: boolean;
        maxJobsPerHour: number;
    };
    vehicleInfo: {
        type: 'motorcycle' | 'car' | 'bicycle';
        licensePlate: string;
        insurance: InsuranceInfo;
    };
    jobPreferences: {
        maxDistance: number;
        preferredAreas: string[];
        jobTypes: string[];
    };
}
export interface AdminSettings {
    type: 'admin';
    systemConfig: {
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        featuresEnabled: string[];
    };
    platformPolicies: {
        commissionRate: number;
        deliveryFee: number;
        cancellationPolicy: string;
    };
    integrations: {
        paymentGateways: PaymentGatewayConfig[];
        notificationServices: NotificationServiceConfig[];
    };
    mobileAppearance: {
        splashScreen: {
            backgroundImage?: string;
            backgroundColor: string;
            logoImage?: string;
            logoPosition: 'center' | 'top' | 'bottom';
            showLoadingIndicator: boolean;
        };
        branding: {
            primaryLogo?: string;
            secondaryLogo?: string;
            appIcon?: string;
            brandColors: {
                primary: string;
                secondary: string;
                accent: string;
            };
        };
        theme: {
            defaultTheme: 'light' | 'dark' | 'system';
            customThemes?: CustomTheme[];
        };
    };
}
export interface BusinessHours {
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
}
export interface ContactInfo {
    phone: string;
    email: string;
    website?: string;
    address: string;
}
export interface TaxSettings {
    taxId?: string;
    vatRate: number;
    includeTaxInPrice: boolean;
}
export interface AvailabilitySchedule {
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
}
export interface InsuranceInfo {
    provider: string;
    policyNumber: string;
    expiryDate: string;
}
export interface PaymentGatewayConfig {
    provider: 'stripe' | 'omise' | 'qrcode';
    enabled: boolean;
    publicKey?: string;
    secretKey?: string;
    webhookSecret?: string;
}
export interface NotificationServiceConfig {
    provider: 'firebase' | 'onesignal' | 'pusher';
    enabled: boolean;
    apiKey?: string;
    appId?: string;
}
export interface CustomTheme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
    };
}
export interface DefaultSettings {
    role: UserRole;
    profile: ProfileSettings;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    preferences: PreferenceSettings;
    roleSpecific: RoleSpecificSettings;
}
export interface SettingsSchema {
    role: UserRole;
    fields: SettingsFieldSchema[];
    validation: ValidationRules;
}
export interface SettingsFieldSchema {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'image' | 'color';
    label: string;
    description?: string;
    required: boolean;
    options?: {
        value: string;
        label: string;
    }[];
    validation?: FieldValidation;
    category: string;
    subcategory?: string;
    permissions?: UserRole[];
}
export interface FieldValidation {
    min?: number;
    max?: number;
    pattern?: string;
    allowedFormats?: string[];
    maxFileSize?: number;
}
export interface ValidationRules {
    [key: string]: FieldValidation;
}
export interface SettingsChange {
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Timestamp;
    source: 'web' | 'mobile';
}
export interface SettingsExport {
    userId: string;
    role: UserRole;
    settings: Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt' | 'version'>;
    exportedAt: Timestamp;
    format: 'json' | 'csv';
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface MobileAppearanceConfig {
    splashScreen: SplashScreenConfig;
    branding: BrandingConfig;
    theme: ThemeConfig;
    updatedAt: Timestamp;
    version: number;
}
export interface SplashScreenConfig {
    backgroundImage?: string;
    backgroundColor: string;
    logoImage?: string;
    logoPosition: 'center' | 'top' | 'bottom';
    showLoadingIndicator: boolean;
}
export interface BrandingConfig {
    primaryLogo?: string;
    secondaryLogo?: string;
    appIcon?: string;
    brandColors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}
export interface ThemeConfig {
    defaultTheme: 'light' | 'dark' | 'system';
    customThemes?: CustomTheme[];
}
export interface MobileAsset {
    assetId: string;
    type: 'splash_background' | 'logo' | 'app_icon';
    url: string;
    metadata: ImageMetadata;
    uploadedAt: Timestamp;
}
export interface ImageMetadata {
    filename: string;
    size: number;
    width: number;
    height: number;
    format: string;
    optimized: boolean;
}
export declare enum SettingsErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    NETWORK_ERROR = "NETWORK_ERROR",
    SYNC_CONFLICT = "SYNC_CONFLICT",
    STORAGE_ERROR = "STORAGE_ERROR",
    IMAGE_PROCESSING_ERROR = "IMAGE_PROCESSING_ERROR"
}
export interface SettingsError {
    type: SettingsErrorType;
    message: string;
    field?: string;
    code?: string;
    retryable: boolean;
}
