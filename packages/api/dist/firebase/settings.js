"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const firestore_1 = require("firebase/firestore");
const config_1 = require("./config");
const settings_1 = require("../validation/settings");
class SettingsService {
    // Get user settings
    static async getUserSettings(userId) {
        try {
            const settingsRef = (0, firestore_1.doc)(config_1.db, this.SETTINGS_COLLECTION, userId);
            const settingsSnap = await (0, firestore_1.getDoc)(settingsRef);
            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                return {
                    ...data,
                    userId,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error getting user settings:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to retrieve user settings', true);
        }
    }
    // Create or update user settings
    static async updateUserSettings(userId, settings, source = 'web') {
        try {
            // Validate settings
            const validation = (0, settings_1.validateUserSettingsUpdate)(settings);
            if (!validation.success) {
                throw this.createValidationError(validation.error.issues);
            }
            const settingsRef = (0, firestore_1.doc)(config_1.db, this.SETTINGS_COLLECTION, userId);
            const currentSettings = await this.getUserSettings(userId);
            // Prepare update data
            const updateData = {
                ...settings,
                updatedAt: (0, firestore_1.serverTimestamp)(),
                version: (currentSettings?.version || 0) + 1
            };
            // If this is a new settings document, include creation timestamp
            if (!currentSettings) {
                updateData.createdAt = (0, firestore_1.serverTimestamp)();
                updateData.userId = userId;
            }
            // Update settings
            await (0, firestore_1.setDoc)(settingsRef, updateData, { merge: true });
            // Log changes for audit
            if (currentSettings) {
                await this.logSettingsChanges(userId, currentSettings, updateData, source);
            }
        }
        catch (error) {
            console.error('Error updating user settings:', error);
            if (error instanceof Error && error.message.includes('validation')) {
                throw error;
            }
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to update user settings', true);
        }
    }
    // Reset user settings to defaults
    static async resetUserSettings(userId, role, categories) {
        try {
            const defaultSettings = await this.getDefaultSettings(role);
            const currentSettings = await this.getUserSettings(userId);
            if (!currentSettings) {
                throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'User settings not found', false);
            }
            let resetData;
            if (categories && categories.length > 0) {
                // Partial reset - only specified categories
                resetData = { ...currentSettings };
                categories.forEach(category => {
                    if (category in defaultSettings) {
                        resetData[category] =
                            defaultSettings[category];
                    }
                });
            }
            else {
                // Full reset
                resetData = {
                    ...defaultSettings,
                    userId,
                    role,
                    createdAt: currentSettings.createdAt,
                    version: currentSettings.version + 1
                };
            }
            await this.updateUserSettings(userId, resetData);
        }
        catch (error) {
            console.error('Error resetting user settings:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to reset user settings', true);
        }
    }
    // Export user settings
    static async exportUserSettings(userId) {
        try {
            const settings = await this.getUserSettings(userId);
            if (!settings) {
                throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'User settings not found', false);
            }
            // Remove sensitive data and metadata
            const { userId: _, createdAt, updatedAt, version, ...exportSettings } = settings;
            return {
                userId,
                role: settings.role,
                settings: exportSettings,
                exportedAt: firestore_1.Timestamp.now(),
                format: 'json'
            };
        }
        catch (error) {
            console.error('Error exporting user settings:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to export user settings', true);
        }
    }
    // Get default settings for a role
    static async getDefaultSettings(role) {
        try {
            const defaultsRef = (0, firestore_1.doc)(config_1.db, this.SETTINGS_DEFAULTS_COLLECTION, role);
            const defaultsSnap = await (0, firestore_1.getDoc)(defaultsRef);
            if (defaultsSnap.exists()) {
                return defaultsSnap.data();
            }
            // Return hardcoded defaults if not found in database
            return this.getHardcodedDefaults(role);
        }
        catch (error) {
            console.error('Error getting default settings:', error);
            return this.getHardcodedDefaults(role);
        }
    }
    // Initialize default settings in database
    static async initializeDefaultSettings() {
        try {
            const batch = (0, firestore_1.writeBatch)(config_1.db);
            const roles = ['shopper', 'vendor', 'driver', 'admin'];
            for (const role of roles) {
                const defaultsRef = (0, firestore_1.doc)(config_1.db, this.SETTINGS_DEFAULTS_COLLECTION, role);
                const defaults = this.getHardcodedDefaults(role);
                batch.set(defaultsRef, {
                    ...defaults,
                    updatedAt: (0, firestore_1.serverTimestamp)()
                });
            }
            await batch.commit();
        }
        catch (error) {
            console.error('Error initializing default settings:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to initialize default settings', true);
        }
    }
    // Real-time settings listener
    static onSettingsChange(userId, callback) {
        const settingsRef = (0, firestore_1.doc)(config_1.db, this.SETTINGS_COLLECTION, userId);
        return (0, firestore_1.onSnapshot)(settingsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback({
                    ...data,
                    userId,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            }
            else {
                callback(null);
            }
        }, (error) => {
            console.error('Settings listener error:', error);
            callback(null);
        });
    }
    // Mobile appearance management
    static async getMobileAppearanceConfig() {
        try {
            const appearanceRef = (0, firestore_1.doc)(config_1.db, this.MOBILE_APPEARANCE_COLLECTION, 'config');
            const appearanceSnap = await (0, firestore_1.getDoc)(appearanceRef);
            if (appearanceSnap.exists()) {
                const data = appearanceSnap.data();
                return {
                    ...data,
                    updatedAt: data.updatedAt
                };
            }
            // Return default config if not found
            return {
                ...settings_1.defaultMobileAppearanceConfig,
                updatedAt: firestore_1.Timestamp.now()
            };
        }
        catch (error) {
            console.error('Error getting mobile appearance config:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to retrieve mobile appearance config', true);
        }
    }
    static async updateMobileAppearanceConfig(config) {
        try {
            // Validate config
            const validation = (0, settings_1.validateMobileAppearanceConfig)(config);
            if (!validation.success) {
                throw this.createValidationError(validation.error.issues);
            }
            const appearanceRef = (0, firestore_1.doc)(config_1.db, this.MOBILE_APPEARANCE_COLLECTION, 'config');
            const currentConfig = await this.getMobileAppearanceConfig();
            const updateData = {
                ...config,
                updatedAt: (0, firestore_1.serverTimestamp)(),
                version: (currentConfig?.version || 0) + 1
            };
            await (0, firestore_1.setDoc)(appearanceRef, updateData, { merge: true });
        }
        catch (error) {
            console.error('Error updating mobile appearance config:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to update mobile appearance config', true);
        }
    }
    // Mobile appearance real-time listener
    static onMobileAppearanceChange(callback) {
        const appearanceRef = (0, firestore_1.doc)(config_1.db, this.MOBILE_APPEARANCE_COLLECTION, 'config');
        return (0, firestore_1.onSnapshot)(appearanceRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback({
                    ...data,
                    updatedAt: data.updatedAt
                });
            }
            else {
                callback({
                    ...settings_1.defaultMobileAppearanceConfig,
                    updatedAt: firestore_1.Timestamp.now()
                });
            }
        }, (error) => {
            console.error('Mobile appearance listener error:', error);
        });
    }
    // Mobile asset management
    static async saveMobileAsset(asset) {
        try {
            const validation = (0, settings_1.validateMobileAsset)({ ...asset, uploadedAt: firestore_1.Timestamp.now() });
            if (!validation.success) {
                throw this.createValidationError(validation.error.issues);
            }
            const assetRef = (0, firestore_1.doc)(config_1.db, this.MOBILE_ASSETS_COLLECTION, asset.assetId);
            await (0, firestore_1.setDoc)(assetRef, {
                ...asset,
                uploadedAt: (0, firestore_1.serverTimestamp)()
            });
        }
        catch (error) {
            console.error('Error saving mobile asset:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to save mobile asset', true);
        }
    }
    static async getMobileAsset(assetId) {
        try {
            const assetRef = (0, firestore_1.doc)(config_1.db, this.MOBILE_ASSETS_COLLECTION, assetId);
            const assetSnap = await (0, firestore_1.getDoc)(assetRef);
            if (assetSnap.exists()) {
                const data = assetSnap.data();
                return {
                    ...data,
                    uploadedAt: data.uploadedAt
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error getting mobile asset:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to retrieve mobile asset', true);
        }
    }
    // Delete user settings
    static async deleteUserSettings(userId) {
        try {
            const settingsRef = (0, firestore_1.doc)(config_1.db, this.SETTINGS_COLLECTION, userId);
            await (0, firestore_1.deleteDoc)(settingsRef);
        }
        catch (error) {
            console.error('Error deleting user settings:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to delete user settings', true);
        }
    }
    // Delete mobile asset
    static async deleteMobileAsset(assetId) {
        try {
            const assetRef = (0, firestore_1.doc)(config_1.db, this.MOBILE_ASSETS_COLLECTION, assetId);
            await (0, firestore_1.deleteDoc)(assetRef);
        }
        catch (error) {
            console.error('Error deleting mobile asset:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to delete mobile asset', true);
        }
    }
    // Private helper methods
    static async logSettingsChanges(userId, oldSettings, newSettings, source) {
        try {
            const changes = [];
            // Compare settings and create change log
            Object.keys(newSettings).forEach(key => {
                if (key !== 'updatedAt' && key !== 'version') {
                    const oldValue = oldSettings[key];
                    const newValue = newSettings[key];
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        changes.push({
                            field: key,
                            oldValue,
                            newValue,
                            timestamp: firestore_1.Timestamp.now(),
                            source
                        });
                    }
                }
            });
            if (changes.length > 0) {
                const auditRef = (0, firestore_1.doc)((0, firestore_1.collection)(config_1.db, this.SETTINGS_AUDIT_COLLECTION, userId, 'changes'));
                await (0, firestore_1.setDoc)(auditRef, {
                    userId,
                    changes,
                    timestamp: (0, firestore_1.serverTimestamp)()
                });
            }
        }
        catch (error) {
            console.error('Error logging settings changes:', error);
            // Don't throw error for audit logging failures
        }
    }
    static getHardcodedDefaults(role) {
        const baseDefaults = {
            role,
            profile: settings_1.defaultProfileSettings,
            notifications: settings_1.defaultNotificationSettings,
            privacy: settings_1.defaultPrivacySettings,
            preferences: settings_1.defaultPreferenceSettings
        };
        const roleSpecificDefaults = {
            shopper: {
                type: 'shopper',
                defaultDeliveryAddress: undefined,
                paymentPreferences: {
                    defaultMethod: undefined,
                    saveCards: false,
                    autoReorder: false
                },
                orderPreferences: {
                    confirmationRequired: true,
                    substituteItems: false,
                    deliveryInstructions: undefined
                }
            },
            vendor: {
                type: 'vendor',
                businessProfile: {
                    businessName: '',
                    description: '',
                    logo: undefined,
                    banner: undefined,
                    businessHours: [],
                    contactInfo: {
                        phone: '',
                        email: '',
                        website: undefined,
                        address: ''
                    }
                },
                operationalSettings: {
                    autoAcceptOrders: false,
                    preparationTime: 30,
                    deliveryRadius: 5,
                    minimumOrder: 0
                },
                financialSettings: {
                    payoutSchedule: 'weekly',
                    taxSettings: {
                        taxId: undefined,
                        vatRate: 7,
                        includeTaxInPrice: true
                    }
                }
            },
            driver: {
                type: 'driver',
                availability: {
                    schedule: [],
                    autoAcceptJobs: false,
                    maxJobsPerHour: 4
                },
                vehicleInfo: {
                    type: 'motorcycle',
                    licensePlate: '',
                    insurance: {
                        provider: '',
                        policyNumber: '',
                        expiryDate: ''
                    }
                },
                jobPreferences: {
                    maxDistance: 10,
                    preferredAreas: [],
                    jobTypes: []
                }
            },
            admin: {
                type: 'admin',
                systemConfig: {
                    maintenanceMode: false,
                    registrationEnabled: true,
                    featuresEnabled: []
                },
                platformPolicies: {
                    commissionRate: 10,
                    deliveryFee: 25,
                    cancellationPolicy: ''
                },
                integrations: {
                    paymentGateways: [],
                    notificationServices: []
                },
                mobileAppearance: settings_1.defaultMobileAppearanceConfig
            }
        };
        return {
            ...baseDefaults,
            roleSpecific: roleSpecificDefaults[role]
        };
    }
    static createSettingsError(type, message, retryable, field, code) {
        return {
            type,
            message,
            field,
            code,
            retryable
        };
    }
    static createValidationError(issues) {
        const firstIssue = issues[0];
        return this.createSettingsError(SettingsErrorType.VALIDATION_ERROR, firstIssue.message, false, firstIssue.path?.join('.'), firstIssue.code);
    }
}
exports.SettingsService = SettingsService;
// Collection references
SettingsService.SETTINGS_COLLECTION = 'settings';
SettingsService.SETTINGS_DEFAULTS_COLLECTION = 'settingsDefaults';
SettingsService.SETTINGS_AUDIT_COLLECTION = 'settingsAudit';
SettingsService.MOBILE_APPEARANCE_COLLECTION = 'mobileAppearance';
SettingsService.MOBILE_ASSETS_COLLECTION = 'mobileAssets';
