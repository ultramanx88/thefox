'use client';

import { useEffect, useState } from 'react';
import { detectDeviceType } from '@/utils/device-detection';
import { AndroidInstallMethod, IOSInstallMethod, DesktopInstallMethod, UnsupportedInstallMethod } from './installation-methods';
import { BrowserCapabilityDetector } from './BrowserCapabilityDetector';
import type { DeviceType, BeforeInstallPromptEvent, DeviceCapabilities } from '@/types/pwa-install';

interface DeviceSpecificInstallerProps {
  onInstallStart: () => void;
  onInstallSuccess: () => void;
  onInstallError: (error: string) => void;
  onInstallCancel: () => void;
  onDismiss: () => void;
  onBookmark?: () => void;
}

export function DeviceSpecificInstaller({
  onInstallStart,
  onInstallSuccess,
  onInstallError,
  onInstallCancel,
  onDismiss,
  onBookmark = () => {}
}: DeviceSpecificInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <BrowserCapabilityDetector>
      {(capabilities: DeviceCapabilities) => {
        // If already installed, dismiss installer
        if (capabilities.isStandalone) {
          onDismiss();
          return null;
        }

        const deviceType = detectDeviceType();

        // Render appropriate installation method based on device type
        switch (deviceType) {
          case 'android':
            return (
              <AndroidInstallMethod
                deferredPrompt={deferredPrompt}
                onInstallStart={onInstallStart}
                onInstallSuccess={onInstallSuccess}
                onInstallError={onInstallError}
                onInstallCancel={onInstallCancel}
              />
            );

          case 'ios':
            return (
              <IOSInstallMethod
                onDismiss={onDismiss}
              />
            );

          case 'desktop':
            return (
              <DesktopInstallMethod
                deferredPrompt={deferredPrompt}
                onInstallStart={onInstallStart}
                onInstallSuccess={onInstallSuccess}
                onInstallError={onInstallError}
                onInstallCancel={onInstallCancel}
                onDismiss={onDismiss}
              />
            );

          default:
            return (
              <UnsupportedInstallMethod
                onDismiss={onDismiss}
                onBookmark={onBookmark}
              />
            );
        }
      }}
    </BrowserCapabilityDetector>
  );
}