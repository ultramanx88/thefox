'use client';

/**
 * InstallButton - Enhanced PWA installation button with multiple variants
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Monitor,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InstallButtonProps } from '@/types/pwa-install';
import { useOneClickInstall } from '@/contexts/OneClickInstallContext';
import { PermissionDialog } from './PermissionDialog';

export function InstallButton({
  variant = 'primary',
  size = 'md',
  showTooltip = true,
  autoHide = true,
  position = 'relative',
  className,
  children
}: InstallButtonProps) {
  const {
    installationState,
    permissionState,
    deviceType,
    canInstall,
    isStandalone,
    error,
    requestInstallation,
    grantPermission,
    denyPermission,
    dismissInstallPrompt,
    trackInstallEvent
  } = useOneClickInstall();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-hide if app is already installed
  useEffect(() => {
    if (autoHide && isStandalone) {
      return;
    }
  }, [autoHide, isStandalone]);

  // Handle permission dialog state
  useEffect(() => {
    if (installationState === 'requesting-permission') {
      setShowPermissionDialog(true);
    } else {
      setShowPermissionDialog(false);
    }
  }, [installationState]);

  // Don't render if conditions aren't met
  if (autoHide && (isStandalone || !canInstall)) {
    return null;
  }

  const handleClick = async () => {
    setHasInteracted(true);
    trackInstallEvent('install_button_clicked', {
      variant,
      size,
      deviceType,
      hasPermission: permissionState === 'granted'
    });

    await requestInstallation();
  };

  const handlePermissionGrant = () => {
    grantPermission(true);
    setShowPermissionDialog(false);
  };

  const handlePermissionDeny = () => {
    denyPermission(true);
    setShowPermissionDialog(false);
  };

  const handlePermissionDismiss = () => {
    dismissInstallPrompt();
    setShowPermissionDialog(false);
  };

  // Get button content based on state
  const getButtonContent = () => {
    if (installationState === 'installing') {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Installing...
        </>
      );
    }

    if (installationState === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Installed!
        </>
      );
    }

    if (installationState === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          Try Again
        </>
      );
    }

    if (children) {
      return children;
    }

    // Default content based on device type
    const deviceIcon = deviceType === 'desktop' ? 
      <Monitor className="w-4 h-4 mr-2" /> : 
      <Smartphone className="w-4 h-4 mr-2" />;

    return (
      <>
        {variant === 'floating' ? <Download className="w-4 h-4" /> : deviceIcon}
        {variant !== 'floating' && 'Install App'}
      </>
    );
  };

  // Get tooltip content
  const getTooltipContent = () => {
    if (installationState === 'success') {
      return 'App installed successfully!';
    }

    if (installationState === 'error') {
      return error || 'Installation failed. Click to try again.';
    }

    if (permissionState === 'granted') {
      return 'Click to install the app instantly';
    }

    return 'Install this app for faster access and offline features';
  };

  // Get button variant styles
  const getButtonVariant = () => {
    if (installationState === 'success') return 'default';
    if (installationState === 'error') return 'destructive';
    
    switch (variant) {
      case 'secondary':
        return 'secondary';
      case 'floating':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get button size
  const getButtonSize = () => {
    if (variant === 'floating') return 'icon';
    return size;
  };

  // Get button classes
  const getButtonClasses = () => {
    const baseClasses = cn(
      'transition-all duration-200 ease-in-out',
      {
        // Position classes
        'fixed bottom-4 right-4 z-50 shadow-lg': position === 'fixed' && variant === 'floating',
        'relative': position === 'relative',
        
        // Variant-specific classes
        'bg-blue-600 hover:bg-blue-700 text-white': variant === 'primary' && installationState !== 'error',
        'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700': 
          variant === 'primary' && isHovered && installationState === 'idle',
        
        // State classes
        'opacity-50 cursor-not-allowed': installationState === 'installing',
        'bg-green-600 hover:bg-green-700': installationState === 'success',
        
        // Floating variant classes
        'rounded-full w-14 h-14 shadow-xl hover:shadow-2xl': variant === 'floating',
        'animate-pulse': variant === 'floating' && !hasInteracted && canInstall,
        
        // Hover effects
        'hover:scale-105': variant === 'floating' && installationState === 'idle',
        'hover:shadow-md': variant !== 'floating' && installationState === 'idle',
      },
      className
    );

    return baseClasses;
  };

  const button = (
    <Button
      variant={getButtonVariant()}
      size={getButtonSize()}
      onClick={handleClick}
      disabled={installationState === 'installing'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={getButtonClasses()}
      aria-label={variant === 'floating' ? 'Install App' : undefined}
    >
      {getButtonContent()}
      
      {/* Floating variant pulse effect */}
      {variant === 'floating' && !hasInteracted && canInstall && (
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
      )}
    </Button>
  );

  return (
    <>
      {showTooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>{getTooltipContent()}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      {/* Permission Dialog */}
      <PermissionDialog
        isOpen={showPermissionDialog}
        onGrant={handlePermissionGrant}
        onDeny={handlePermissionDeny}
        onDismiss={handlePermissionDismiss}
        deviceType={deviceType}
      />
    </>
  );
}

// Preset variants for common use cases
export function PrimaryInstallButton(props: Omit<InstallButtonProps, 'variant'>) {
  return <InstallButton {...props} variant="primary" />;
}

export function SecondaryInstallButton(props: Omit<InstallButtonProps, 'variant'>) {
  return <InstallButton {...props} variant="secondary" />;
}

export function FloatingInstallButton(props: Omit<InstallButtonProps, 'variant' | 'position'>) {
  return <InstallButton {...props} variant="floating" position="fixed" />;
}

// Hook for programmatic installation
export function useInstallButton() {
  const context = useOneClickInstall();
  
  return {
    ...context,
    canShowButton: context.canInstall && !context.isStandalone,
    isInstalling: context.installationState === 'installing',
    isSuccess: context.installationState === 'success',
    isError: context.installationState === 'error',
    hasPermission: context.permissionState === 'granted'
  };
}