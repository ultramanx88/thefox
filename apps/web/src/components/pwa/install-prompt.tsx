'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DeviceSpecificInstaller } from './DeviceSpecificInstaller';
import { isAppInstalled, shouldShowInstallPrompt } from '@/utils/device-detection';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from '@/types/pwa-install';
import type { InstallationPreferences } from '@/types/pwa-install';

export function InstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installationState, setInstallationState] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Don't show if already installed
    if (isAppInstalled()) {
      return;
    }

    // Check user preferences and dismiss history
    const preferences = getInstallationPreferences();
    
    if (shouldShowInstallPrompt(preferences.dismissCount, preferences.lastPromptDate)) {
      setShowInstallPrompt(true);
    }
  }, []);

  const getInstallationPreferences = (): InstallationPreferences => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSTALLATION_PREFERENCES);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  };

  const updateInstallationPreferences = (updates: Partial<InstallationPreferences>) => {
    const current = getInstallationPreferences();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.INSTALLATION_PREFERENCES, JSON.stringify(updated));
  };

  const handleInstallStart = () => {
    setInstallationState('installing');
    setError('');
  };

  const handleInstallSuccess = () => {
    setInstallationState('success');
    updateInstallationPreferences({
      permissionGranted: true,
      lastPromptDate: new Date().toISOString()
    });
    
    // Hide prompt after successful installation
    setTimeout(() => {
      setShowInstallPrompt(false);
    }, 2000);
  };

  const handleInstallError = (errorMessage: string) => {
    setInstallationState('error');
    setError(errorMessage);
    console.error('PWA Installation failed:', errorMessage);
  };

  const handleInstallCancel = () => {
    setInstallationState('idle');
    updateInstallationPreferences({
      dismissCount: getInstallationPreferences().dismissCount + 1,
      lastPromptDate: new Date().toISOString()
    });
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    updateInstallationPreferences({
      dismissCount: getInstallationPreferences().dismissCount + 1,
      lastPromptDate: new Date().toISOString()
    });
  };

  const handleBookmark = () => {
    // Track bookmark action
    console.log('User bookmarked the page');
    handleDismiss();
  };

  // Don't show if dismissed or already installed
  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-lg bg-white p-4 shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {installationState === 'success' && (
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                ✅ Installation successful!
              </div>
            )}
            {installationState === 'error' && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                ❌ Installation failed: {error}
              </div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <DeviceSpecificInstaller
          onInstallStart={handleInstallStart}
          onInstallSuccess={handleInstallSuccess}
          onInstallError={handleInstallError}
          onInstallCancel={handleInstallCancel}
          onDismiss={handleDismiss}
          onBookmark={handleBookmark}
        />
      </div>
    </div>
  );
}