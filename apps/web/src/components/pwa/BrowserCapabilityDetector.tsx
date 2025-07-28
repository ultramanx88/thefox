'use client';

import { useEffect, useState } from 'react';
import { detectDeviceCapabilities } from '@/utils/device-detection';
import type { DeviceCapabilities } from '@/types/pwa-install';

interface BrowserCapabilityDetectorProps {
  children: (capabilities: DeviceCapabilities) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function BrowserCapabilityDetector({ 
  children, 
  fallback = null 
}: BrowserCapabilityDetectorProps) {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect capabilities on client side only
    const detectedCapabilities = detectDeviceCapabilities();
    setCapabilities(detectedCapabilities);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!capabilities) {
    return <>{fallback}</>;
  }

  return <>{children(capabilities)}</>;
}