'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check, Loader2 } from 'lucide-react';
import { DeviceSpecificInstaller } from './DeviceSpecificInstaller';
import { isAppInstalled, shouldShowInstallPrompt } from '@/utils/device-detection';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from '@/types/pwa-install';
import type { InstallationPreferences, InstallButtonProps } from '@/types/pwa-install';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function InstallButton({ 
  variant = 'primary',
  size = 'md',
  showTooltip = true,
  autoHide = true,
  position = 'relative',
  className = '',
  children
}: InstallButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [installationState, setInstallationState] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed and autoHide is enabled
    if (autoHide && isAppInstalled()) {
      setCanShow(false);
      return;
    }

    // Check user preferences
    const preferences = getInstallationPreferences();
    
    if (shouldShowInstallPrompt(preferences.dismissCount, preferences.lastPromptDate)) {
      setCanShow(true);
    }
  }, [autoHide]);

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
    
    // Close dialog and hide button after successful installation
    setTimeout(() => {
      setShowDialog(false);
      if (autoHide) {
        setCanShow(false);
      }
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
    setShowDialog(false);
    setInstallationState('idle');
    updateInstallationPreferences({
      dismissCount: getInstallationPreferences().dismissCount + 1,
      lastPromptDate: new Date().toISOString()
    });
  };

  const handleBookmark = () => {
    console.log('User bookmarked the page');
    handleDismiss();
  };

  const getButtonIcon = () => {
    switch (installationState) {
      case 'installing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    switch (installationState) {
      case 'installing':
        return 'Installing...';
      case 'success':
        return 'Installed!';
      default:
        return children || 'Install App';
    }
  };

  // Don't render if can't show and autoHide is enabled
  if (autoHide && !canShow) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant === 'primary' ? 'default' : variant === 'secondary' ? 'secondary' : 'outline'}
        size={size}
        onClick={() => setShowDialog(true)}
        disabled={installationState === 'installing' || installationState === 'success'}
        className={`${position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : ''} ${className}`}
        title={showTooltip ? 'Install theFOX App for quick access' : undefined}
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install theFOX App</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {installationState === 'success' && (
              <div className="text-green-600 dark:text-green-400 text-sm font-medium text-center">
                ✅ Installation successful!
              </div>
            )}
            {installationState === 'error' && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                ❌ Installation failed: {error}
              </div>
            )}
            
            <DeviceSpecificInstaller
              onInstallStart={handleInstallStart}
              onInstallSuccess={handleInstallSuccess}
              onInstallError={handleInstallError}
              onInstallCancel={handleInstallCancel}
              onDismiss={handleDismiss}
              onBookmark={handleBookmark}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}