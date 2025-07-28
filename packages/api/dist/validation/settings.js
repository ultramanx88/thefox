"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMobileAppearanceConfig = exports.defaultPreferenceSettings = exports.defaultPrivacySettings = exports.defaultNotificationSettings = exports.defaultProfileSettings = exports.settingsExportSchema = exports.mobileAssetSchema = exports.imageMetadataSchema = exports.mobileAppearanceConfigSchema = exports.themeConfigSchema = exports.brandingConfigSchema = exports.splashScreenConfigSchema = exports.userSettingsUpdateSchema = exports.userSettingsSchema = exports.roleSpecificSettingsSchema = exports.adminSettingsSchema = exports.driverSettingsSchema = exports.vendorSettingsSchema = exports.shopperSettingsSchema = exports.customThemeSchema = exports.notificationServiceConfigSchema = exports.paymentGatewayConfigSchema = exports.insuranceInfoSchema = exports.availabilityScheduleSchema = exports.taxSettingsSchema = exports.contactInfoSchema = exports.businessHoursSchema = exports.preferenceSettingsSchema = exports.privacySettingsSchema = exports.notificationSettingsSchema = exports.profileSettingsSchema = exports.userRoleSchema = void 0;
exports.validateUserSettings = validateUserSettings;
exports.validateUserSettingsUpdate = validateUserSettingsUpdate;
exports.validateRoleSpecificSettings = validateRoleSpecificSettings;
exports.validateMobileAppearanceConfig = validateMobileAppearanceConfig;
exports.validateMobileAsset = validateMobileAsset;
// Settings validation schemas using Zod
const zod_1 = require("zod");
// Base validation schemas
exports.userRoleSchema = zod_1.z.enum(['shopper', 'vendor', 'driver', 'admin']);
exports.profileSettingsSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100),
    avatar: zod_1.z.string().url().optional(),
    language: zod_1.z.string().min(2).max(5), // ISO language codes
    timezone: zod_1.z.string(), // IANA timezone
    currency: zod_1.z.string().length(3), // ISO currency codes
    theme: zod_1.z.enum(['light', 'dark', 'system'])
});
exports.notificationSettingsSchema = zod_1.z.object({
    push: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        orders: zod_1.z.boolean(),
        promotions: zod_1.z.boolean(),
        system: zod_1.z.boolean(),
        quietHours: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            start: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
            end: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:mm format
        })
    }),
    email: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        orders: zod_1.z.boolean(),
        promotions: zod_1.z.boolean(),
        newsletter: zod_1.z.boolean(),
        frequency: zod_1.z.enum(['immediate', 'daily', 'weekly'])
    }),
    sms: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        orders: zod_1.z.boolean(),
        security: zod_1.z.boolean()
    })
});
exports.privacySettingsSchema = zod_1.z.object({
    dataSharing: zod_1.z.boolean(),
    locationSharing: zod_1.z.boolean(),
    profileVisibility: zod_1.z.enum(['public', 'private', 'friends']),
    activityTracking: zod_1.z.boolean(),
    analytics: zod_1.z.boolean()
});
exports.preferenceSettingsSchema = zod_1.z.object({
    autoSave: zod_1.z.boolean(),
    confirmActions: zod_1.z.boolean(),
    showTutorials: zod_1.z.boolean(),
    compactView: zod_1.z.boolean()
});
// Supporting schemas
exports.businessHoursSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6),
    isOpen: zod_1.z.boolean(),
    openTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closeTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
});
exports.contactInfoSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(15),
    email: zod_1.z.string().email(),
    website: zod_1.z.string().url().optional(),
    address: zod_1.z.string().min(10).max(500)
});
exports.taxSettingsSchema = zod_1.z.object({
    taxId: zod_1.z.string().optional(),
    vatRate: zod_1.z.number().min(0).max(100),
    includeTaxInPrice: zod_1.z.boolean()
});
exports.availabilityScheduleSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6),
    isAvailable: zod_1.z.boolean(),
    startTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
});
exports.insuranceInfoSchema = zod_1.z.object({
    provider: zod_1.z.string().min(1).max(100),
    policyNumber: zod_1.z.string().min(1).max(50),
    expiryDate: zod_1.z.string().datetime()
});
exports.paymentGatewayConfigSchema = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'omise', 'qrcode']),
    enabled: zod_1.z.boolean(),
    publicKey: zod_1.z.string().optional(),
    secretKey: zod_1.z.string().optional(),
    webhookSecret: zod_1.z.string().optional()
});
exports.notificationServiceConfigSchema = zod_1.z.object({
    provider: zod_1.z.enum(['firebase', 'onesignal', 'pusher']),
    enabled: zod_1.z.boolean(),
    apiKey: zod_1.z.string().optional(),
    appId: zod_1.z.string().optional()
});
exports.customThemeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(50),
    colors: zod_1.z.object({
        primary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        background: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        surface: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        text: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    })
});
// Role-specific settings schemas
exports.shopperSettingsSchema = zod_1.z.object({
    type: zod_1.z.literal('shopper'),
    defaultDeliveryAddress: zod_1.z.string().optional(),
    paymentPreferences: zod_1.z.object({
        defaultMethod: zod_1.z.string().optional(),
        saveCards: zod_1.z.boolean(),
        autoReorder: zod_1.z.boolean()
    }),
    orderPreferences: zod_1.z.object({
        confirmationRequired: zod_1.z.boolean(),
        substituteItems: zod_1.z.boolean(),
        deliveryInstructions: zod_1.z.string().max(500).optional()
    })
});
exports.vendorSettingsSchema = zod_1.z.object({
    type: zod_1.z.literal('vendor'),
    businessProfile: zod_1.z.object({
        businessName: zod_1.z.string().min(1).max(100),
        description: zod_1.z.string().max(1000),
        logo: zod_1.z.string().url().optional(),
        banner: zod_1.z.string().url().optional(),
        businessHours: zod_1.z.array(exports.businessHoursSchema),
        contactInfo: exports.contactInfoSchema
    }),
    operationalSettings: zod_1.z.object({
        autoAcceptOrders: zod_1.z.boolean(),
        preparationTime: zod_1.z.number().min(1).max(480), // max 8 hours
        deliveryRadius: zod_1.z.number().min(0.1).max(100), // max 100km
        minimumOrder: zod_1.z.number().min(0)
    }),
    financialSettings: zod_1.z.object({
        payoutSchedule: zod_1.z.enum(['daily', 'weekly', 'monthly']),
        taxSettings: exports.taxSettingsSchema
    })
});
exports.driverSettingsSchema = zod_1.z.object({
    type: zod_1.z.literal('driver'),
    availability: zod_1.z.object({
        schedule: zod_1.z.array(exports.availabilityScheduleSchema),
        autoAcceptJobs: zod_1.z.boolean(),
        maxJobsPerHour: zod_1.z.number().min(1).max(20)
    }),
    vehicleInfo: zod_1.z.object({
        type: zod_1.z.enum(['motorcycle', 'car', 'bicycle']),
        licensePlate: zod_1.z.string().min(1).max(20),
        insurance: exports.insuranceInfoSchema
    }),
    jobPreferences: zod_1.z.object({
        maxDistance: zod_1.z.number().min(1).max(100),
        preferredAreas: zod_1.z.array(zod_1.z.string()),
        jobTypes: zod_1.z.array(zod_1.z.string())
    })
});
exports.adminSettingsSchema = zod_1.z.object({
    type: zod_1.z.literal('admin'),
    systemConfig: zod_1.z.object({
        maintenanceMode: zod_1.z.boolean(),
        registrationEnabled: zod_1.z.boolean(),
        featuresEnabled: zod_1.z.array(zod_1.z.string())
    }),
    platformPolicies: zod_1.z.object({
        commissionRate: zod_1.z.number().min(0).max(100),
        deliveryFee: zod_1.z.number().min(0),
        cancellationPolicy: zod_1.z.string().max(2000)
    }),
    integrations: zod_1.z.object({
        paymentGateways: zod_1.z.array(exports.paymentGatewayConfigSchema),
        notificationServices: zod_1.z.array(exports.notificationServiceConfigSchema)
    }),
    mobileAppearance: zod_1.z.object({
        splashScreen: zod_1.z.object({
            backgroundImage: zod_1.z.string().url().optional(),
            backgroundColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
            logoImage: zod_1.z.string().url().optional(),
            logoPosition: zod_1.z.enum(['center', 'top', 'bottom']),
            showLoadingIndicator: zod_1.z.boolean()
        }),
        branding: zod_1.z.object({
            primaryLogo: zod_1.z.string().url().optional(),
            secondaryLogo: zod_1.z.string().url().optional(),
            appIcon: zod_1.z.string().url().optional(),
            brandColors: zod_1.z.object({
                primary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
                secondary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
                accent: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)
            })
        }),
        theme: zod_1.z.object({
            defaultTheme: zod_1.z.enum(['light', 'dark', 'system']),
            customThemes: zod_1.z.array(exports.customThemeSchema).optional()
        })
    })
});
exports.roleSpecificSettingsSchema = zod_1.z.discriminatedUnion('type', [
    exports.shopperSettingsSchema,
    exports.vendorSettingsSchema,
    exports.driverSettingsSchema,
    exports.adminSettingsSchema
]);
// Main user settings schema
exports.userSettingsSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    role: exports.userRoleSchema,
    profile: exports.profileSettingsSchema,
    notifications: exports.notificationSettingsSchema,
    privacy: exports.privacySettingsSchema,
    roleSpecific: exports.roleSpecificSettingsSchema,
    preferences: exports.preferenceSettingsSchema,
    version: zod_1.z.number().min(1)
});
// Partial schemas for updates
exports.userSettingsUpdateSchema = exports.userSettingsSchema.partial().omit({
    userId: true,
    createdAt: true,
    updatedAt: true
});
// Mobile appearance schemas
exports.splashScreenConfigSchema = zod_1.z.object({
    backgroundImage: zod_1.z.string().url().optional(),
    backgroundColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    logoImage: zod_1.z.string().url().optional(),
    logoPosition: zod_1.z.enum(['center', 'top', 'bottom']),
    showLoadingIndicator: zod_1.z.boolean()
});
exports.brandingConfigSchema = zod_1.z.object({
    primaryLogo: zod_1.z.string().url().optional(),
    secondaryLogo: zod_1.z.string().url().optional(),
    appIcon: zod_1.z.string().url().optional(),
    brandColors: zod_1.z.object({
        primary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        accent: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    })
});
exports.themeConfigSchema = zod_1.z.object({
    defaultTheme: zod_1.z.enum(['light', 'dark', 'system']),
    customThemes: zod_1.z.array(exports.customThemeSchema).optional()
});
exports.mobileAppearanceConfigSchema = zod_1.z.object({
    splashScreen: exports.splashScreenConfigSchema,
    branding: exports.brandingConfigSchema,
    theme: exports.themeConfigSchema,
    version: zod_1.z.number().min(1)
});
exports.imageMetadataSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1),
    size: zod_1.z.number().min(1),
    width: zod_1.z.number().min(1),
    height: zod_1.z.number().min(1),
    format: zod_1.z.enum(['jpg', 'jpeg', 'png', 'webp', 'svg']),
    optimized: zod_1.z.boolean()
});
exports.mobileAssetSchema = zod_1.z.object({
    assetId: zod_1.z.string().min(1),
    type: zod_1.z.enum(['splash_background', 'logo', 'app_icon']),
    url: zod_1.z.string().url(),
    metadata: exports.imageMetadataSchema
});
// Settings export schema
exports.settingsExportSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    role: exports.userRoleSchema,
    settings: exports.userSettingsSchema.omit({
        userId: true,
        createdAt: true,
        updatedAt: true,
        version: true
    }),
    format: zod_1.z.enum(['json', 'csv'])
});
// Validation helper functions
function validateUserSettings(data) {
    return exports.userSettingsSchema.safeParse(data);
}
function validateUserSettingsUpdate(data) {
    return exports.userSettingsUpdateSchema.safeParse(data);
}
function validateRoleSpecificSettings(data, role) {
    const roleSchemas = {
        shopper: exports.shopperSettingsSchema,
        vendor: exports.vendorSettingsSchema,
        driver: exports.driverSettingsSchema,
        admin: exports.adminSettingsSchema
    };
    return roleSchemas[role].safeParse(data);
}
function validateMobileAppearanceConfig(data) {
    return exports.mobileAppearanceConfigSchema.safeParse(data);
}
function validateMobileAsset(data) {
    return exports.mobileAssetSchema.safeParse(data);
}
// Default values
exports.defaultProfileSettings = {
    displayName: '',
    language: 'th',
    timezone: 'Asia/Bangkok',
    currency: 'THB',
    theme: 'system'
};
exports.defaultNotificationSettings = {
    push: {
        enabled: true,
        orders: true,
        promotions: false,
        system: true,
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        }
    },
    email: {
        enabled: true,
        orders: true,
        promotions: false,
        newsletter: false,
        frequency: 'immediate'
    },
    sms: {
        enabled: false,
        orders: false,
        security: true
    }
};
exports.defaultPrivacySettings = {
    dataSharing: false,
    locationSharing: true,
    profileVisibility: 'public',
    activityTracking: true,
    analytics: true
};
exports.defaultPreferenceSettings = {
    autoSave: true,
    confirmActions: true,
    showTutorials: true,
    compactView: false
};
exports.defaultMobileAppearanceConfig = {
    splashScreen: {
        backgroundColor: '#FFFFFF',
        logoPosition: 'center',
        showLoadingIndicator: true
    },
    branding: {
        brandColors: {
            primary: '#3B82F6',
            secondary: '#64748B',
            accent: '#F59E0B'
        }
    },
    theme: {
        defaultTheme: 'system'
    },
    version: 1
};
