'use client';

/**
 * PWA Installation Test Page
 * Test page for One-Click PWA Install functionality
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  InstallButton, 
  PrimaryInstallButton, 
  SecondaryInstallButton,
  useInstallButton 
} from '@/components/pwa/InstallButton';
import { 
  InstallPrompt,
  TopBannerPrompt,
  BottomBannerPrompt,
  CardPrompt,
  MinimalPrompt 
} from '@/components/pwa/InstallPrompt';
import { PermissionSettings } from '@/components/pwa/PermissionSettings';
import { useOneClickInstall } from '@/contexts/OneClickInstallContext';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function TestPWAPage() {
  const installContext = useOneClickInstall();
  const installButton = useInstallButton();

  const getStatusBadge = (status: string, isPositive?: boolean) => {
    const variant = isPositive ? 'default' : status === 'error' ? 'destructive' : 'secondary';
    const icon = isPositive ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                 status === 'error' ? <XCircle className="w-3 h-3 mr-1" /> :
                 <Clock className="w-3 h-3 mr-1" />;
    
    return (
      <Badge variant={variant} className={isPositive ? 'bg-green-100 text-green-800' : ''}>
        {icon}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center">
          <TestTube className="w-8 h-8 mr-3" />
          PWA Installation Test Page
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the One-Click PWA Installation system with different components and scenarios.
          This page helps verify that all PWA installation features work correctly.
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            System Status
          </CardTitle>
          <CardDescription>
            Current state of the PWA installation system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Device Type</span>
              <div className="flex items-center space-x-2">
                {installContext.deviceType === 'desktop' ? 
                  <Monitor className="w-4 h-4" /> : 
                  <Smartphone className="w-4 h-4" />
                }
                {getStatusBadge(installContext.deviceType)}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Installation State</span>
              <div>
                {getStatusBadge(
                  installContext.installationState, 
                  installContext.installationState === 'success'
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Permission State</span>
              <div>
                {getStatusBadge(
                  installContext.permissionState,
                  installContext.permissionState === 'granted'
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Can Install</span>
              <div>
                {getStatusBadge(
                  installContext.canInstall ? 'Yes' : 'No',
                  installContext.canInstall
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Is Standalone</span>
              <div>
                {getStatusBadge(
                  installContext.isStandalone ? 'Yes' : 'No',
                  installContext.isStandalone
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Has Deferred Prompt</span>
              <div>
                {getStatusBadge(
                  installContext.deferredPrompt ? 'Yes' : 'No',
                  !!installContext.deferredPrompt
                )}
              </div>
            </div>
          </div>

          {installContext.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{installContext.error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Install Button Variants</CardTitle>
          <CardDescription>
            Test different install button styles and behaviors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Primary Button</h4>
              <PrimaryInstallButton size="md" />
            </div>

            <div>
              <h4 className="font-medium mb-2">Secondary Button</h4>
              <SecondaryInstallButton size="md" />
            </div>

            <div>
              <h4 className="font-medium mb-2">Small Button</h4>
              <InstallButton variant="primary" size="sm" />
            </div>

            <div>
              <h4 className="font-medium mb-2">Large Button</h4>
              <InstallButton variant="primary" size="lg" />
            </div>

            <div>
              <h4 className="font-medium mb-2">Custom Button</h4>
              <InstallButton variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Custom Install Button
              </InstallButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Install Button Hook Data */}
      <Card>
        <CardHeader>
          <CardTitle>Install Button Hook Data</CardTitle>
          <CardDescription>
            Data from useInstallButton hook for debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Can Show Button:</span>
              <span className="ml-2">{installButton.canShowButton ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="font-medium">Is Installing:</span>
              <span className="ml-2">{installButton.isInstalling ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="font-medium">Is Success:</span>
              <span className="ml-2">{installButton.isSuccess ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="font-medium">Is Error:</span>
              <span className="ml-2">{installButton.isError ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="font-medium">Has Permission:</span>
              <span className="ml-2">{installButton.hasPermission ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Install Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Install Prompts</CardTitle>
          <CardDescription>
            Different prompt styles (these will show based on conditions)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Install prompts will automatically appear based on:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Page views (≥2 views)</li>
              <li>Scroll percentage (≥25%)</li>
              <li>Time delay (3 seconds)</li>
              <li>Installation eligibility</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Scroll down and navigate between pages to trigger the smart prompts.
              The floating install button should also be visible in the bottom-right corner.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permission Settings */}
      <PermissionSettings />

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
          <CardDescription>
            How to test the PWA installation system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">1. Device Testing</h4>
              <p className="text-sm text-gray-600">
                Test on different devices and browsers (Chrome, Edge, Safari, Firefox) to see device-specific behavior.
              </p>
            </div>

            <div>
              <h4 className="font-medium">2. Permission Flow</h4>
              <p className="text-sm text-gray-600">
                Click install buttons to test the permission dialog flow. Try granting, denying, and dismissing permissions.
              </p>
            </div>

            <div>
              <h4 className="font-medium">3. One-Click Installation</h4>
              <p className="text-sm text-gray-600">
                After granting permission once, subsequent install attempts should work with one click.
              </p>
            </div>

            <div>
              <h4 className="font-medium">4. Smart Prompts</h4>
              <p className="text-sm text-gray-600">
                Navigate between pages and scroll to trigger automatic install prompts based on user behavior.
              </p>
            </div>

            <div>
              <h4 className="font-medium">5. Settings Management</h4>
              <p className="text-sm text-gray-600">
                Use the Permission Settings card above to reset preferences and test different scenarios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacer for floating button testing */}
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          Scroll area to test floating install button positioning
        </p>
      </div>
    </div>
  );
}