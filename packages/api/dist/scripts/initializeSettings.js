#!/usr/bin/env node
/**
 * Script to initialize default settings in Firebase
 * Run this script after setting up Firebase to populate default settings
 */
import { SettingsService } from '../firebase/settings';
async function initializeSettings() {
    try {
        console.log('🚀 Initializing default settings...');
        // Initialize default settings for all roles
        await SettingsService.initializeDefaultSettings();
        console.log('✅ Default settings initialized successfully!');
        // Initialize default mobile appearance config
        console.log('🎨 Initializing default mobile appearance...');
        await SettingsService.updateMobileAppearanceConfig({
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
        });
        console.log('✅ Default mobile appearance initialized successfully!');
        console.log('🎉 Settings system initialization complete!');
    }
    catch (error) {
        console.error('❌ Error initializing settings:', error);
        process.exit(1);
    }
}
// Run the initialization if this script is executed directly
if (require.main === module) {
    initializeSettings();
}
export { initializeSettings };
