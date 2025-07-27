'use client';

/**
 * PermissionDialog - Dialog for requesting PWA installation permission
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Shield, 
  Zap,
  CheckCircle,
  X
} from 'lucide-react';
import type { PermissionDialogProps, DeviceType } from '@/types/pwa-install';
import { getInstallationInstructions } from '@/utils/device-detection';

export function PermissionDialog({
  isOpen,
  onGrant,
  onDeny,
  onDismiss,
  deviceType
}: PermissionDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset animation state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleGrant = () => {
    onGrant();
  };

  const handleDeny = () => {
    onDeny();
  };

  const handleDismiss = () => {
    onDismiss();
  };

  // Get device-specific content
  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'android':
      case 'ios':
        return <Smartphone className="w-8 h-8 text-blue-500" />;
      case 'desktop':
        return <Monitor className="w-8 h-8 text-blue-500" />;
      default:
        return <Download className="w-8 h-8 text-blue-500" />;
    }
  };

  const getDeviceName = () => {
    switch (deviceType) {
      case 'android':
        return 'Android device';
      case 'ios':
        return 'iPhone/iPad';
      case 'desktop':
        return 'computer';
      default:
        return 'device';
    }
  };

  const getBenefits = () => [
    {
      icon: <Zap className="w-5 h-5 text-green-500" />,
      title: 'Faster Access',
      description: 'Launch instantly from your home screen'
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: 'Works Offline',
      description: 'Access key features without internet'
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-purple-500" />,
      title: 'Native Experience',
      description: 'App-like experience with notifications'
    }
  ];

  const instructions = getInstallationInstructions(deviceType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            {getDeviceIcon()}
          </div>
          <DialogTitle className="text-xl font-semibold">
            Install theFOX App
          </DialogTitle>
          <DialogDescription className="text-base">
            Get the best experience by installing our app on your {getDeviceName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <div className="space-y-3">
            {getBenefits().map((benefit, index) => (
              <div 
                key={benefit.title}
                className={`flex items-start space-x-3 p-3 rounded-lg bg-gray-50 transition-all duration-300 ${
                  isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Installation method info */}
          {deviceType === 'ios' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Manual Installation Required
              </p>
              <ol className="text-xs text-amber-700 space-y-1">
                {instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="font-medium mr-2">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Remember choice */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="remember"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
            />
            <label
              htmlFor="remember"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Remember my choice for future visits
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Not Now
          </Button>
          <Button
            onClick={handleGrant}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {deviceType === 'ios' ? 'Show Instructions' : 'Install App'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}