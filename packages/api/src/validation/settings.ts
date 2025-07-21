// Settings validation schemas using Zod
import { z } from 'zod';
import type { UserRole } from '../types/settings';

// Base validation schemas
export const userRoleSchema = z.enum(['shopper', 'vendor', 'driver', 'admin']);

export const profileSettingsSchema = z.object({
  displayName: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  language: z.string().min(2).max(5), // ISO language codes
  timezone: z.string(), // IANA timezone
  currency: z.string().length(3), // ISO currency codes
  theme: z.enum(['light', 'dark', 'system'])
});

export const notificationSettingsSchema = z.object({
  push: z.object({
    enabled: z.boolean(),
    orders: z.boolean(),
    promotions: z.boolean(),
    system: z.boolean(),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:mm format
    })
  }),
  email: z.object({
    enabled: z.boolean(),
    orders: z.boolean(),
    promotions: z.boolean(),
    newsletter: z.boolean(),
    frequency: z.enum(['immediate', 'daily', 'weekly'])
  }),
  sms: z.object({
    enabled: z.boolean(),
    orders: z.boolean(),
    security: z.boolean()
  })
});

export const privacySettingsSchema = z.object({
  dataSharing: z.boolean(),
  locationSharing: z.boolean(),
  profileVisibility: z.enum(['public', 'private', 'friends']),
  activityTracking: z.boolean(),
  analytics: z.boolean()
});

export const preferenceSettingsSchema = z.object({
  autoSave: z.boolean(),
  confirmActions: z.boolean(),
  showTutorials: z.boolean(),
  compactView: z.boolean()
});

// Supporting schemas
export const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

export const contactInfoSchema = z.object({
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  website: z.string().url().optional(),
  address: z.string().min(10).max(500)
});

export const taxSettingsSchema = z.object({
  taxId: z.string().optional(),
  vatRate: z.number().min(0).max(100),
  includeTaxInPrice: z.boolean()
});

export const availabilityScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

export const insuranceInfoSchema = z.object({
  provider: z.string().min(1).max(100),
  policyNumber: z.string().min(1).max(50),
  expiryDate: z.string().datetime()
});

export const paymentGatewayConfigSchema = z.object({
  provider: z.enum(['stripe', 'omise', 'qrcode']),
  enabled: z.boolean(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional()
});

export const notificationServiceConfigSchema = z.object({
  provider: z.enum(['firebase', 'onesignal', 'pusher']),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  appId: z.string().optional()
});

export const customThemeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  })
});

// Role-specific settings schemas
export const shopperSettingsSchema = z.object({
  type: z.literal('shopper'),
  defaultDeliveryAddress: z.string().optional(),
  paymentPreferences: z.object({
    defaultMethod: z.string().optional(),
    saveCards: z.boolean(),
    autoReorder: z.boolean()
  }),
  orderPreferences: z.object({
    confirmationRequired: z.boolean(),
    substituteItems: z.boolean(),
    deliveryInstructions: z.string().max(500).optional()
  })
});

export const vendorSettingsSchema = z.object({
  type: z.literal('vendor'),
  businessProfile: z.object({
    businessName: z.string().min(1).max(100),
    description: z.string().max(1000),
    logo: z.string().url().optional(),
    banner: z.string().url().optional(),
    businessHours: z.array(businessHoursSchema),
    contactInfo: contactInfoSchema
  }),
  operationalSettings: z.object({
    autoAcceptOrders: z.boolean(),
    preparationTime: z.number().min(1).max(480), // max 8 hours
    deliveryRadius: z.number().min(0.1).max(100), // max 100km
    minimumOrder: z.number().min(0)
  }),
  financialSettings: z.object({
    payoutSchedule: z.enum(['daily', 'weekly', 'monthly']),
    taxSettings: taxSettingsSchema
  })
});

export const driverSettingsSchema = z.object({
  type: z.literal('driver'),
  availability: z.object({
    schedule: z.array(availabilityScheduleSchema),
    autoAcceptJobs: z.boolean(),
    maxJobsPerHour: z.number().min(1).max(20)
  }),
  vehicleInfo: z.object({
    type: z.enum(['motorcycle', 'car', 'bicycle']),
    licensePlate: z.string().min(1).max(20),
    insurance: insuranceInfoSchema
  }),
  jobPreferences: z.object({
    maxDistance: z.number().min(1).max(100),
    preferredAreas: z.array(z.string()),
    jobTypes: z.array(z.string())
  })
});

export const adminSettingsSchema = z.object({
  type: z.literal('admin'),
  systemConfig: z.object({
    maintenanceMode: z.boolean(),
    registrationEnabled: z.boolean(),
    featuresEnabled: z.array(z.string())
  }),
  platformPolicies: z.object({
    commissionRate: z.number().min(0).max(100),
    deliveryFee: z.number().min(0),
    cancellationPolicy: z.string().max(2000)
  }),
  integrations: z.object({
    paymentGateways: z.array(paymentGatewayConfigSchema),
    notificationServices: z.array(notificationServiceConfigSchema)
  }),
  mobileAppearance: z.object({
    splashScreen: z.object({
      backgroundImage: z.string().url().optional(),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      logoImage: z.string().url().optional(),
      logoPosition: z.enum(['center', 'top', 'bottom']),
      showLoadingIndicator: z.boolean()
    }),
    branding: z.object({
      primaryLogo: z.string().url().optional(),
      secondaryLogo: z.string().url().optional(),
      appIcon: z.string().url().optional(),
      brandColors: z.object({
        primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
      })
    }),
    theme: z.object({
      defaultTheme: z.enum(['light', 'dark', 'system']),
      customThemes: z.array(customThemeSchema).optional()
    })
  })
});

export const roleSpecificSettingsSchema = z.discriminatedUnion('type', [
  shopperSettingsSchema,
  vendorSettingsSchema,
  driverSettingsSchema,
  adminSettingsSchema
]);

// Main user settings schema
export const userSettingsSchema = z.object({
  userId: z.string().min(1),
  role: userRoleSchema,
  profile: profileSettingsSchema,
  notifications: notificationSettingsSchema,
  privacy: privacySettingsSchema,
  roleSpecific: roleSpecificSettingsSchema,
  preferences: preferenceSettingsSchema,
  version: z.number().min(1)
});

// Partial schemas for updates
export const userSettingsUpdateSchema = userSettingsSchema.partial().omit({
  userId: true,
  createdAt: true,
  updatedAt: true
});

// Mobile appearance schemas
export const splashScreenConfigSchema = z.object({
  backgroundImage: z.string().url().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logoImage: z.string().url().optional(),
  logoPosition: z.enum(['center', 'top', 'bottom']),
  showLoadingIndicator: z.boolean()
});

export const brandingConfigSchema = z.object({
  primaryLogo: z.string().url().optional(),
  secondaryLogo: z.string().url().optional(),
  appIcon: z.string().url().optional(),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  })
});

export const themeConfigSchema = z.object({
  defaultTheme: z.enum(['light', 'dark', 'system']),
  customThemes: z.array(customThemeSchema).optional()
});

export const mobileAppearanceConfigSchema = z.object({
  splashScreen: splashScreenConfigSchema,
  branding: brandingConfigSchema,
  theme: themeConfigSchema,
  version: z.number().min(1)
});

export const imageMetadataSchema = z.object({
  filename: z.string().min(1),
  size: z.number().min(1),
  width: z.number().min(1),
  height: z.number().min(1),
  format: z.enum(['jpg', 'jpeg', 'png', 'webp', 'svg']),
  optimized: z.boolean()
});

export const mobileAssetSchema = z.object({
  assetId: z.string().min(1),
  type: z.enum(['splash_background', 'logo', 'app_icon']),
  url: z.string().url(),
  metadata: imageMetadataSchema
});

// Settings export schema
export const settingsExportSchema = z.object({
  userId: z.string().min(1),
  role: userRoleSchema,
  settings: userSettingsSchema.omit({
    userId: true,
    createdAt: true,
    updatedAt: true,
    version: true
  }),
  format: z.enum(['json', 'csv'])
});

// Validation helper functions
export function validateUserSettings(data: unknown) {
  return userSettingsSchema.safeParse(data);
}

export function validateUserSettingsUpdate(data: unknown) {
  return userSettingsUpdateSchema.safeParse(data);
}

export function validateRoleSpecificSettings(data: unknown, role: UserRole) {
  const roleSchemas = {
    shopper: shopperSettingsSchema,
    vendor: vendorSettingsSchema,
    driver: driverSettingsSchema,
    admin: adminSettingsSchema
  };
  
  return roleSchemas[role].safeParse(data);
}

export function validateMobileAppearanceConfig(data: unknown) {
  return mobileAppearanceConfigSchema.safeParse(data);
}

export function validateMobileAsset(data: unknown) {
  return mobileAssetSchema.safeParse(data);
}

// Default values
export const defaultProfileSettings = {
  displayName: '',
  language: 'th',
  timezone: 'Asia/Bangkok',
  currency: 'THB',
  theme: 'system' as const
};

export const defaultNotificationSettings = {
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
    frequency: 'immediate' as const
  },
  sms: {
    enabled: false,
    orders: false,
    security: true
  }
};

export const defaultPrivacySettings = {
  dataSharing: false,
  locationSharing: true,
  profileVisibility: 'public' as const,
  activityTracking: true,
  analytics: true
};

export const defaultPreferenceSettings = {
  autoSave: true,
  confirmActions: true,
  showTutorials: true,
  compactView: false
};

export const defaultMobileAppearanceConfig = {
  splashScreen: {
    backgroundColor: '#FFFFFF',
    logoPosition: 'center' as const,
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
    defaultTheme: 'system' as const
  },
  version: 1
};