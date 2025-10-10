'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Monitor, Chrome, Globe } from 'lucide-react';
import { detectBrowser } from '@/utils/device-detection';
import type { BeforeInstallPromptEvent } from '@/types/pwa-install';

interface DesktopInstallMethodProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallStart: () => void;
  onInstallSuccess: () => void;
  onInstallError: (error: string) => void;
  onInstallCancel: () => void;
  onDismiss: () => void;
}

export function DesktopInstallMethod({
  deferredPrompt,
  onInstallStart,
  onInstallSuccess,
  onInstallError,
  onInstallCancel,
  onDismiss
}: DesktopInstallMethodProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const browser = detectBrowser();

  const handleNativeInstall = async () => {
    if (!deferredPrompt) {
      onInstallError('Installation prompt not available');
      return;
    }

    try {
      setIsInstalling(true);
      onInstallStart();

      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        onInstallSuccess();
      } else {
        onInstallCancel();
      }
    } catch (error) {
      console.error('Installation failed:', error);
      onInstallError(error instanceof Error ? error.message : 'Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const getBrowserIcon = () => {
    switch (browser.name) {
      case 'chrome':
        return <Chrome className="h-4 w-4" />;
      case 'firefox':
        return <Globe className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getManualInstructions = () => {
    switch (browser.name) {
      case 'chrome':
      case 'edge':
        return [
          'Look for the install icon (⊕) in your address bar',
          'Or click the three dots menu → "Install theFOX App"',
          'Click "Install" to add the app to your desktop'
        ];
      case 'firefox':
        return [
          'Firefox doesn\'t support PWA installation',
          'You can bookmark this page for quick access',
          'Or use Chrome/Edge for the full app experience'
        ];
      default:
        return [
          'Your browser may not support PWA installation',
          'Try using Chrome or Edge for the best experience',
          'You can bookmark this page for quick access'
        ];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Monitor className="h-6 w-6 text-orange-500" />
        <div>
          <h3 className="font-medium">Install theFOX App</h3>
          <p className="text-sm text-muted-foreground">
            Add to your desktop for quick access
          </p>
        </div>
      </div>

      {deferredPrompt && (browser.name === 'chrome' || browser.name === 'edge') ? (
        <div className="space-y-3">
          <Button
            onClick={handleNativeInstall}
            disabled={isInstalling}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {isInstalling ? 'Installing...' : 'Install App'}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            Or look for the install icon in your address bar
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            {getBrowserIcon()}
            <span className="text-sm font-medium">
              {browser.name === 'firefox' ? 'Firefox Browser' : `${browser.name} Browser`}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-medium">Installation Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              {getManualInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
          
          {browser.name === 'firefox' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 For the best experience, try using Chrome or Edge which support full PWA installation.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="flex-1"
        >
          Maybe Later
        </Button>
        {!deferredPrompt && (
          <Button
            onClick={onDismiss}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Got It
          </Button>
        )}
      </div>
    </div>
  );
}