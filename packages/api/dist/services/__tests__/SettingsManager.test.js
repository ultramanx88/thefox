import { SettingsManager } from '../SettingsManager';
import { SettingsService } from '../../firebase/settings';
// Mock the SettingsService
jest.mock('../../firebase/settings');
const mockSettingsService = SettingsService;
describe('SettingsManager', () => {
    let settingsManager;
    const mockUserId = 'test-user-123';
    const mockRole = 'shopper';
    const mockUserSettings = {
        userId: mockUserId,
        role: mockRole,
        profile: {
            displayName: 'Test User',
            language: 'en',
            timezone: 'UTC',
            currency: 'USD',
            theme: 'light'
        },
        notifications: {
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
        },
        privacy: {
            dataSharing: false,
            locationSharing: true,
            profileVisibility: 'public',
            activityTracking: true,
            analytics: true
        },
        roleSpecific: {
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
        preferences: {
            autoSave: true,
            confirmActions: true,
            showTutorials: true,
            compactView: false
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
    };
    beforeEach(() => {
        settingsManager = SettingsManager.getInstance();
        settingsManager.clearCache();
        jest.clearAllMocks();
    });
    describe('getUserSettings', () => {
        it('should return cached settings if available', async () => {
            // Setup cache
            settingsManager['settingsCache'].set(mockUserId, mockUserSettings);
            const result = await settingsManager.getUserSettings(mockUserId, mockRole);
            expect(result).toEqual(mockUserSettings);
            expect(mockSettingsService.getUserSettings).not.toHaveBeenCalled();
        });
        it('should fetch from database if not cached', async () => {
            mockSettingsService.getUserSettings.mockResolvedValue(mockUserSettings);
            const result = await settingsManager.getUserSettings(mockUserId, mockRole);
            expect(result).toEqual(mockUserSettings);
            expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith(mockUserId);
            expect(settingsManager['settingsCache'].get(mockUserId)).toEqual(mockUserSettings);
        });
        it('should create default settings if none exist', async () => {
            mockSettingsService.getUserSettings.mockResolvedValue(null);
            mockSettingsService.getDefaultSettings.mockResolvedValue({
                role: mockRole,
                profile: mockUserSettings.profile,
                notifications: mockUserSettings.notifications,
                privacy: mockUserSettings.privacy,
                roleSpecific: mockUserSettings.roleSpecific,
                preferences: mockUserSettings.preferences
            });
            mockSettingsService.updateUserSettings.mockResolvedValue();
            const result = await settingsManager.getUserSettings(mockUserId, mockRole);
            expect(mockSettingsService.getDefaultSettings).toHaveBeenCalledWith(mockRole);
            expect(mockSettingsService.updateUserSettings).toHaveBeenCalled();
            expect(result.userId).toBe(mockUserId);
            expect(result.role).toBe(mockRole);
        });
        it('should throw error for invalid input', async () => {
            await expect(settingsManager.getUserSettings('', mockRole))
                .rejects.toThrow('User ID and role are required');
            await expect(settingsManager.getUserSettings(mockUserId, ''))
                .rejects.toThrow('User ID and role are required');
        });
    });
    describe('createUserSettings', () => {
        it('should create new user settings successfully', async () => {
            mockSettingsService.getUserSettings.mockResolvedValue(null);
            mockSettingsService.getDefaultSettings.mockResolvedValue({
                role: mockRole,
                profile: mockUserSettings.profile,
                notifications: mockUserSettings.notifications,
                privacy: mockUserSettings.privacy,
                roleSpecific: mockUserSettings.roleSpecific,
                preferences: mockUserSettings.preferences
            });
            mockSettingsService.updateUserSettings.mockResolvedValue();
            mockSettingsService.getUserSettings.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserSettings);
            const result = await settingsManager.createUserSettings(mockUserId, mockRole);
            expect(result).toEqual(mockUserSettings);
            expect(mockSettingsService.updateUserSettings).toHaveBeenCalled();
            expect(settingsManager['settingsCache'].get(mockUserId)).toEqual(mockUserSettings);
        });
        it('should throw error if settings already exist', async () => {
            mockSettingsService.getUserSettings.mockResolvedValue(mockUserSettings);
            await expect(settingsManager.createUserSettings(mockUserId, mockRole))
                .rejects.toThrow('User settings already exist');
        });
        it('should merge initial settings with defaults', async () => {
            const initialSettings = {
                profile: {
                    displayName: 'Custom Name',
                    theme: 'dark'
                }
            };
            mockSettingsService.getUserSettings.mockResolvedValue(null);
            mockSettingsService.getDefaultSettings.mockResolvedValue({
                role: mockRole,
                profile: mockUserSettings.profile,
                notifications: mockUserSettings.notifications,
                privacy: mockUserSettings.privacy,
                roleSpecific: mockUserSettings.roleSpecific,
                preferences: mockUserSettings.preferences
            });
            mockSettingsService.updateUserSettings.mockResolvedValue();
            const expectedSettings = {
                ...mockUserSettings,
                profile: {
                    ...mockUserSettings.profile,
                    displayName: 'Custom Name',
                    theme: 'dark'
                }
            };
            mockSettingsService.getUserSettings.mockResolvedValueOnce(null).mockResolvedValueOnce(expectedSettings);
            const result = await settingsManager.createUserSettings(mockUserId, mockRole, initialSettings);
            expect(result.profile.displayName).toBe('Custom Name');
            expect(result.profile.theme).toBe('dark');
        });
    });
    describe('updateUserSettings', () => {
        beforeEach(() => {
            settingsManager['settingsCache'].set(mockUserId, mockUserSettings);
        });
        it('should update settings successfully', async () => {
            const updates = {
                profile: {
                    displayName: 'Updated Name',
                    theme: 'dark'
                }
            };
            mockSettingsService.updateUserSettings.mockResolvedValue();
            const result = await settingsManager.updateUserSettings(mockUserId, updates);
            expect(mockSettingsService.updateUserSettings).toHaveBeenCalledWith(mockUserId, updates, 'web');
            expect(result.profile.displayName).toBe('Updated Name');
            expect(result.profile.theme).toBe('dark');
            expect(result.version).toBe(mockUserSettings.version + 1);
        });
        it('should validate settings before update', async () => {
            const invalidUpdates = {
                profile: {
                    displayName: '', // Invalid empty name
                }
            };
            await expect(settingsManager.updateUserSettings(mockUserId, invalidUpdates))
                .rejects.toThrow('Display name cannot be empty');
            expect(mockSettingsService.updateUserSettings).not.toHaveBeenCalled();
        });
        it('should throw error for empty updates', async () => {
            await expect(settingsManager.updateUserSettings(mockUserId, {}))
                .rejects.toThrow('Settings data is required');
        });
    });
    describe('deleteUserSettings', () => {
        beforeEach(() => {
            settingsManager['settingsCache'].set(mockUserId, mockUserSettings);
        });
        it('should delete settings successfully', async () => {
            mockSettingsService.deleteUserSettings.mockResolvedValue();
            await settingsManager.deleteUserSettings(mockUserId);
            expect(mockSettingsService.deleteUserSettings).toHaveBeenCalledWith(mockUserId);
            expect(settingsManager['settingsCache'].has(mockUserId)).toBe(false);
        });
        it('should clean up listeners on delete', async () => {
            const mockUnsubscribe = jest.fn();
            settingsManager['listeners'].set(mockUserId, [mockUnsubscribe]);
            mockSettingsService.deleteUserSettings.mockResolvedValue();
            await settingsManager.deleteUserSettings(mockUserId);
            expect(mockUnsubscribe).toHaveBeenCalled();
            expect(settingsManager['listeners'].has(mockUserId)).toBe(false);
        });
    });
    describe('userSettingsExist', () => {
        it('should return true if settings are cached', async () => {
            settingsManager['settingsCache'].set(mockUserId, mockUserSettings);
            const result = await settingsManager.userSettingsExist(mockUserId);
            expect(result).toBe(true);
            expect(mockSettingsService.getUserSettings).not.toHaveBeenCalled();
        });
        it('should check database if not cached', async () => {
            mockSettingsService.getUserSettings.mockResolvedValue(mockUserSettings);
            const result = await settingsManager.userSettingsExist(mockUserId);
            expect(result).toBe(true);
            expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith(mockUserId);
        });
        it('should return false if settings do not exist', async () => {
            mockSettingsService.getUserSettings.mockResolvedValue(null);
            const result = await settingsManager.userSettingsExist(mockUserId);
            expect(result).toBe(false);
        });
    });
    describe('batchUpdateSettings', () => {
        it('should process multiple updates successfully', async () => {
            const updates = [
                {
                    userId: 'user1',
                    settings: { profile: { displayName: 'User 1' } }
                },
                {
                    userId: 'user2',
                    settings: { profile: { displayName: 'User 2' } },
                    source: 'mobile'
                }
            ];
            // Mock the updateUserSettings method
            const updateSpy = jest.spyOn(settingsManager, 'updateUserSettings')
                .mockResolvedValue(mockUserSettings);
            await settingsManager.batchUpdateSettings(updates);
            expect(updateSpy).toHaveBeenCalledTimes(2);
            expect(updateSpy).toHaveBeenCalledWith('user1', { profile: { displayName: 'User 1' } }, 'web');
            expect(updateSpy).toHaveBeenCalledWith('user2', { profile: { displayName: 'User 2' } }, 'mobile');
            updateSpy.mockRestore();
        });
        it('should handle partial failures gracefully', async () => {
            const updates = [
                {
                    userId: 'user1',
                    settings: { profile: { displayName: 'User 1' } }
                },
                {
                    userId: 'user2',
                    settings: { profile: { displayName: '' } } // Invalid
                }
            ];
            const updateSpy = jest.spyOn(settingsManager, 'updateUserSettings')
                .mockResolvedValueOnce(mockUserSettings)
                .mockRejectedValueOnce(new Error('Validation error'));
            // Should not throw, but log warnings
            await expect(settingsManager.batchUpdateSettings(updates)).resolves.not.toThrow();
            expect(updateSpy).toHaveBeenCalledTimes(2);
            updateSpy.mockRestore();
        });
    });
    describe('retry logic', () => {
        it('should retry on retryable errors', async () => {
            const retryableError = {
                type: 'NETWORK_ERROR',
                message: 'Network error',
                retryable: true
            };
            mockSettingsService.getUserSettings
                .mockRejectedValueOnce(retryableError)
                .mockRejectedValueOnce(retryableError)
                .mockResolvedValueOnce(mockUserSettings);
            // Set faster retry for testing
            settingsManager.setRetryConfig({ baseDelay: 10, maxDelay: 50 });
            const result = await settingsManager.getUserSettings(mockUserId, mockRole);
            expect(result).toEqual(mockUserSettings);
            expect(mockSettingsService.getUserSettings).toHaveBeenCalledTimes(3);
        });
        it('should not retry on validation errors', async () => {
            const validationError = {
                type: 'VALIDATION_ERROR',
                message: 'Validation error',
                retryable: false
            };
            mockSettingsService.getUserSettings.mockRejectedValue(validationError);
            await expect(settingsManager.getUserSettings(mockUserId, mockRole))
                .rejects.toEqual(validationError);
            expect(mockSettingsService.getUserSettings).toHaveBeenCalledTimes(1);
        });
    });
    describe('cache management', () => {
        it('should clear all cache and listeners', () => {
            const mockUnsubscribe = jest.fn();
            settingsManager['settingsCache'].set(mockUserId, mockUserSettings);
            settingsManager['listeners'].set(mockUserId, [mockUnsubscribe]);
            settingsManager.clearCache();
            expect(settingsManager.getCacheSize()).toBe(0);
            expect(settingsManager.getListenerCount()).toBe(0);
            expect(mockUnsubscribe).toHaveBeenCalled();
        });
        it('should clear specific user cache', () => {
            const mockUnsubscribe = jest.fn();
            settingsManager['settingsCache'].set(mockUserId, mockUserSettings);
            settingsManager['listeners'].set(mockUserId, [mockUnsubscribe]);
            settingsManager.clearUserCache(mockUserId);
            expect(settingsManager['settingsCache'].has(mockUserId)).toBe(false);
            expect(settingsManager['listeners'].has(mockUserId)).toBe(false);
            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });
    describe('health check', () => {
        it('should return healthy status when database is accessible', async () => {
            mockSettingsService.getDefaultSettings.mockResolvedValue({
                role: mockRole,
                profile: mockUserSettings.profile,
                notifications: mockUserSettings.notifications,
                privacy: mockUserSettings.privacy,
                roleSpecific: mockUserSettings.roleSpecific,
                preferences: mockUserSettings.preferences
            });
            const health = await settingsManager.healthCheck();
            expect(health.status).toBe('healthy');
            expect(health.details.canConnectToDatabase).toBe(true);
            expect(health.details.lastError).toBeUndefined();
        });
        it('should return unhealthy status when database is not accessible', async () => {
            mockSettingsService.getDefaultSettings.mockRejectedValue(new Error('Connection failed'));
            const health = await settingsManager.healthCheck();
            expect(health.status).toBe('unhealthy');
            expect(health.details.canConnectToDatabase).toBe(false);
            expect(health.details.lastError).toBe('Connection failed');
        });
    });
});
