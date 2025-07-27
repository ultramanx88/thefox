'use client';

/**
 * InstallPrompt - Smart install prompt that appears at optimal times
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Download, 
  Smartphone, 
  Zap, 
  Shield,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOneClickInstall } from '@/contexts/OneClickInstallContext';
import { InstallButton } from './InstallButton';

interface InstallPromptProps {
  variant?: 'banner' | 'card' | 'minimal';
  position?: 'top' | 'bottom';
  showAfterDelay?: number; // milliseconds
  showAfterScrollPercent?: number; // 0-100
  showAfterPageViews?: number;
  autoHide?: boolean;
  className?: string;
}

export function InstallPrompt({
  variant = 'banner',
  position = 'bottom',
  showAfterDelay = 3000,
  showAfterScrollPercent = 25,
  showAfterPageViews = 2,
  autoHide = true,
  className
}: InstallPromptProps) {
  const {
    canInstall,
    isStandalone,
    deviceType,
    dismissInstallPrompt,
    trackInstallEvent
  } = useOneClickInstall();

  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false);
  const [pageViews, setPageViews] = useState(0);

  // Track page views
  useEffect(() => {
    const views = parseInt(localStorage.getItem('pwa_page_views') || '0') + 1;
    setPageViews(views);
    localStorage.setItem('pwa_page_views', views.toString());
  }, []);

  // Handle scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= showAfterScrollPercent) {
        setHasScrolledEnough(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScrollPercent]);

  // Determine if prompt should be shown
  useEffect(() => {
    if (!canInstall || isStandalone) {
      setIsVisible(false);
      return;
    }

    // Check all conditions
    const shouldShow = pageViews >= showAfterPageViews && hasScrolledEnough;

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        trackInstallEvent('install_prompt_shown', {
          variant,
          position,
          pageViews,
          scrollPercent: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        });
      }, showAfterDelay);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isStandalone, pageViews, hasScrolledEnough, showAfterDelay, variant, position, trackInstallEvent]);

  // Auto-hide after successful installation
  useEffect(() => {
    if (autoHide && isStandalone) {
      setIsVisible(false);
    }
  }, [autoHide, isStandalone]);

  const handleDismiss = () => {
    setIsVisible(false);
    dismissInstallPrompt();
  };

  if (!isVisible) {
    return null;
  }

  const getDeviceIcon = () => {
    return deviceType === 'desktop' ? 
      <Smartphone className="w-5 h-5" /> : 
      <Smartphone className="w-5 h-5" />;
  };

  const getBenefits = () => [
    { icon: <Zap className="w-4 h-4" />, text: 'Faster access' },
    { icon: <Shield className="w-4 h-4" />, text: 'Works offline' },
    { icon: <Clock className="w-4 h-4" />, text: 'Quick launch' }
  ];

  // Banner variant
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'fixed left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg',
          position === 'top' ? 'top-0' : 'bottom-0',
          className
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getDeviceIcon()}
              <div>
                <p className="font-medium text-sm">Install theFOX App</p>
                <p className="text-xs opacity-90">Get faster access and offline features</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <InstallButton
                variant="secondary"
                size="sm"
                showTooltip={false}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </InstallButton>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'fixed z-40 max-w-sm mx-4',
          position === 'top' ? 'top-4' : 'bottom-4',
          'right-4',
          className
        )}
      >
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getDeviceIcon()}
                <h3 className="font-semibold text-sm">Install theFOX</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Install our app for a better experience with offline access and faster loading.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {getBenefits().map((benefit, index) => (
                <div key={index} className="flex items-center space-x-1 text-xs text-gray-500">
                  {benefit.icon}
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
            
            <InstallButton
              variant="primary"
              size="sm"
              showTooltip={false}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Minimal variant
  return (
    <div
      className={cn(
        'fixed z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs',
        position === 'top' ? 'top-4' : 'bottom-4',
        'right-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getDeviceIcon()}
          <span className="text-sm font-medium">Install App</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <InstallButton
            variant="primary"
            size="sm"
            showTooltip={false}
          >
            Install
          </InstallButton>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Preset components for common use cases
export function TopBannerPrompt(props: Omit<InstallPromptProps, 'variant' | 'position'>) {
  return <InstallPrompt {...props} variant="banner" position="top" />;
}

export function BottomBannerPrompt(props: Omit<InstallPromptProps, 'variant' | 'position'>) {
  return <InstallPrompt {...props} variant="banner" position="bottom" />;
}

export function CardPrompt(props: Omit<InstallPromptProps, 'variant'>) {
  return <InstallPrompt {...props} variant="card" />;
}

export function MinimalPrompt(props: Omit<InstallPromptProps, 'variant'>) {
  return <InstallPrompt {...props} variant="minimal" />;
}