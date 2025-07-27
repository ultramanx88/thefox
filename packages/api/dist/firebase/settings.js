import { collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { validateUserSettingsUpdate, validateMobileAppearanceConfig, validateMobileAsset, defaultProfileSettings, defaultNotificationSettings, defaultPrivacySettings, defaultPreferenceSettings, defaultMobileAppearanceConfig } from '../validation/settings';
export class SettingsService {
    // Get user settings
    static async getUserSettings(userId) {
        try {
            const settingsRef = doc(db, this.SETTINGS_COLLECTION, userId);
            const settingsSnap = await getDoc(settingsRef);
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
            const validation = validateUserSettingsUpdate(settings);
            if (!validation.success) {
                throw this.createValidationError(validation.error.issues);
            }
            const settingsRef = doc(db, this.SETTINGS_COLLECTION, userId);
            const currentSettings = await this.getUserSettings(userId);
            // Prepare update data
            const updateData = {
                ...settings,
                updatedAt: serverTimestamp(),
                version: (currentSettings?.version || 0) + 1
            };
            // If this is a new settings document, include creation timestamp
            if (!currentSettings) {
                updateData.createdAt = serverTimestamp();
                updateData.userId = userId;
            }
            // Update settings
            await setDoc(settingsRef, updateData, { merge: true });
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
                exportedAt: Timestamp.now(),
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
            const defaultsRef = doc(db, this.SETTINGS_DEFAULTS_COLLECTION, role);
            const defaultsSnap = await getDoc(defaultsRef);
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
            const batch = writeBatch(db);
            const roles = ['shopper', 'vendor', 'driver', 'admin'];
            for (const role of roles) {
                const defaultsRef = doc(db, this.SETTINGS_DEFAULTS_COLLECTION, role);
                const defaults = this.getHardcodedDefaults(role);
                batch.set(defaultsRef, {
                    ...defaults,
                    updatedAt: serverTimestamp()
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
        const settingsRef = doc(db, this.SETTINGS_COLLECTION, userId);
        return onSnapshot(settingsRef, (doc) => {
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
            const appearanceRef = doc(db, this.MOBILE_APPEARANCE_COLLECTION, 'config');
            const appearanceSnap = await getDoc(appearanceRef);
            if (appearanceSnap.exists()) {
                const data = appearanceSnap.data();
                return {
                    ...data,
                    updatedAt: data.updatedAt
                };
            }
            // Return default config if not found
            return {
                ...defaultMobileAppearanceConfig,
                updatedAt: Timestamp.now()
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
            const validation = validateMobileAppearanceConfig(config);
            if (!validation.success) {
                throw this.createValidationError(validation.error.issues);
            }
            const appearanceRef = doc(db, this.MOBILE_APPEARANCE_COLLECTION, 'config');
            const currentConfig = await this.getMobileAppearanceConfig();
            const updateData = {
                ...config,
                updatedAt: serverTimestamp(),
                version: (currentConfig?.version || 0) + 1
            };
            await setDoc(appearanceRef, updateData, { merge: true });
        }
        catch (error) {
            console.error('Error updating mobile appearance config:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to update mobile appearance config', true);
        }
    }
    // Mobile appearance real-time listener
    static onMobileAppearanceChange(callback) {
        const appearanceRef = doc(db, this.MOBILE_APPEARANCE_COLLECTION, 'config');
        return onSnapshot(appearanceRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback({
                    ...data,
                    updatedAt: data.updatedAt
                });
            }
            else {
                callback({
                    ...defaultMobileAppearanceConfig,
                    updatedAt: Timestamp.now()
                });
            }
        }, (error) => {
            console.error('Mobile appearance listener error:', error);
        });
    }
    // Mobile asset management
    static async saveMobileAsset(asset) {
        try {
            const validation = validateMobileAsset({ ...asset, uploadedAt: Timestamp.now() });
            if (!validation.success) {
                throw this.createValidationError(validation.error.issues);
            }
            const assetRef = doc(db, this.MOBILE_ASSETS_COLLECTION, asset.assetId);
            await setDoc(assetRef, {
                ...asset,
                uploadedAt: serverTimestamp()
            });
        }
        catch (error) {
            console.error('Error saving mobile asset:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to save mobile asset', true);
        }
    }
    static async getMobileAsset(assetId) {
        try {
            const assetRef = doc(db, this.MOBILE_ASSETS_COLLECTION, assetId);
            const assetSnap = await getDoc(assetRef);
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
            const settingsRef = doc(db, this.SETTINGS_COLLECTION, userId);
            await deleteDoc(settingsRef);
        }
        catch (error) {
            console.error('Error deleting user settings:', error);
            throw this.createSettingsError(SettingsErrorType.STORAGE_ERROR, 'Failed to delete user settings', true);
        }
    }
    // Delete mobile asset
    static async deleteMobileAsset(assetId) {
        try {
            const assetRef = doc(db, this.MOBILE_ASSETS_COLLECTION, assetId);
            await deleteDoc(assetRef);
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
                            timestamp: Timestamp.now(),
                            source
                        });
                    }
                }
            });
            if (changes.length > 0) {
                const auditRef = doc(collection(db, this.SETTINGS_AUDIT_COLLECTION, userId, 'changes'));
                await setDoc(auditRef, {
                    userId,
                    changes,
                    timestamp: serverTimestamp()
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
            profile: defaultProfileSettings,
            notifications: defaultNotificationSettings,
            privacy: defaultPrivacySettings,
            preferences: defaultPreferenceSettings
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
                mobileAppearance: defaultMobileAppearanceConfig
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
// Collection references
SettingsService.SETTINGS_COLLECTION = 'settings';
SettingsService.SETTINGS_DEFAULTS_COLLECTION = 'settingsDefaults';
SettingsService.SETTINGS_AUDIT_COLLECTION = 'settingsAudit';
SettingsService.MOBILE_APPEARANCE_COLLECTION = 'mobileAppearance';
SettingsService.MOBILE_ASSETS_COLLECTION = 'mobileAssets';
