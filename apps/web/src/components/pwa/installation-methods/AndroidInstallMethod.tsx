'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import type { BeforeInstallPromptEvent } from '@/types/pwa-install';

interface AndroidInstallMethodProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallStart: () => void;
  onInstallSuccess: () => void;
  onInstallError: (error: string) => void;
  onInstallCancel: () => void;
}

export function AndroidInstallMethod({
  deferredPrompt,
  onInstallStart,
  onInstallSuccess,
  onInstallError,
  onInstallCancel
}: AndroidInstallMethodProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) {
      onInstallError('Installation prompt not available');
      return;
    }

    try {
      setIsInstalling(true);
      onInstallStart();

      // Show the native install prompt
      await deferredPrompt.prompt();
      
      // Wait for user choice
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

  // If no deferred prompt, show manual instructions
  if (!deferredPrompt) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Smartphone className="h-6 w-6 text-orange-500" />
          <div>
            <h3 className="font-medium">Install theFOX App</h3>
            <p className="text-sm text-muted-foreground">
              Add to your home screen for quick access
            </p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="font-medium">Manual Installation:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Tap the menu button (⋮) in your browser</li>
            <li>Select "Add to Home screen" or "Install app"</li>
            <li>Tap "Add" to install the app</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Smartphone className="h-6 w-6 text-orange-500" />
        <div>
          <h3 className="font-medium">Install theFOX App</h3>
          <p className="text-sm text-muted-foreground">
            Get quick access to your local marketplace
          </p>
        </div>
      </div>
      
      <Button
        onClick={handleNativeInstall}
        disabled={isInstalling}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        <Download className="h-4 w-4 mr-2" />
        {isInstalling ? 'Installing...' : 'Install App'}
      </Button>
    </div>
  );
}