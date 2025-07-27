'use client';

/**
 * PermissionSettings - Component for managing PWA installation preferences
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  RotateCcw, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { permissionManager } from '@/utils/permission-manager';
import { useOneClickInstall } from '@/contexts/OneClickInstallContext';
import type { InstallationPreferences } from '@/types/pwa-install';
import { pwaStorage } from '@/utils/pwa-storage';

export function PermissionSettings() {
  const { toast } = useToast();
  const { resetPermissions, trackInstallEvent } = useOneClickInstall();
  const [preferences, setPreferences] = useState<InstallationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const prefs = pwaStorage.getInstallationPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to load installation preferences',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [toast]);

  const handleResetPermissions = () => {
    try {
      resetPermissions();
      
      // Reload preferences
      const newPrefs = pwaStorage.getInstallationPreferences();
      setPreferences(newPrefs);
      
      toast({
        title: 'Permissions Reset',
        description: 'Your PWA installation preferences have been reset',
      });
      
      trackInstallEvent('permissions_reset_manual');
    } catch (error) {
      console.error('Failed to reset permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset permissions',
        variant: 'destructive'
      });
    }
  };

  const handleToggleAutoInstall = (enabled: boolean) => {
    if (!preferences) return;

    try {
      const updatedPrefs = {
        ...preferences,
        autoInstallEnabled: enabled
      };
      
      pwaStorage.setInstallationPreferences(updatedPrefs);
      setPreferences(updatedPrefs);
      
      toast({
        title: enabled ? 'Auto-install Enabled' : 'Auto-install Disabled',
        description: enabled 
          ? 'The app will install automatically after permission is granted'
          : 'You will be prompted before each installation'
      });
      
      trackInstallEvent('auto_install_toggled', { enabled });
    } catch (error) {
      console.error('Failed to update auto-install preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preference',
        variant: 'destructive'
      });
    }
  };

  const getPermissionStatusBadge = () => {
    if (!preferences) return null;

    if (preferences.permissionGranted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Granted
        </Badge>
      );
    }

    if (preferences.dismissCount > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <XCircle className="w-3 h-3 mr-1" />
          Dismissed ({preferences.dismissCount}x)
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <Info className="w-3 h-3 mr-1" />
        Not Set
      </Badge>
    );
  };

  const formatLastPromptDate = () => {
    if (!preferences?.lastPromptDate) return 'Never';
    
    try {
      const date = new Date(preferences.lastPromptDate);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  };

  const getNextPromptInfo = () => {
    if (!preferences) return null;

    if (preferences.permissionGranted) {
      return 'Permission granted - no more prompts needed';
    }

    if (preferences.dismissCount >= 3) {
      return 'Maximum dismissals reached - prompts disabled';
    }

    if (preferences.lastPromptDate) {
      const lastPrompt = new Date(preferences.lastPromptDate);
      const cooldownEnd = new Date(lastPrompt.getTime() + (7 * 24 * 60 * 60 * 1000));
      const now = new Date();

      if (now < cooldownEnd) {
        return `Next prompt available after ${cooldownEnd.toLocaleDateString()}`;
      }
    }

    return 'Prompt available now';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            PWA Installation Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Error Loading Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Unable to load PWA installation preferences. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          PWA Installation Settings
        </CardTitle>
        <CardDescription>
          Manage your Progressive Web App installation preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Permission Status</span>
            </div>
            {getPermissionStatusBadge()}
          </div>
          
          <div className="text-sm text-gray-600 pl-6">
            {preferences.permissionGranted 
              ? 'You have granted permission for one-click PWA installation'
              : 'Permission has not been granted for automatic installation'
            }
          </div>
        </div>

        <Separator />

        {/* Auto-install Setting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Auto-install</span>
              </div>
              <p className="text-sm text-gray-600">
                Automatically install the app after granting permission
              </p>
            </div>
            <Switch
              checked={preferences.autoInstallEnabled}
              onCheckedChange={handleToggleAutoInstall}
            />
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Installation History
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Last Prompt:</span>
              <div className="font-medium">{formatLastPromptDate()}</div>
            </div>
            
            <div>
              <span className="text-gray-500">Dismiss Count:</span>
              <div className="font-medium">{preferences.dismissCount}</div>
            </div>
            
            <div className="md:col-span-2">
              <span className="text-gray-500">Next Prompt:</span>
              <div className="font-medium">{getNextPromptInfo()}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Reset Button */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Reset Preferences</span>
              <p className="text-sm text-gray-600">
                Clear all installation preferences and start fresh
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPermissions}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Device Info */}
        <div className="pt-4 border-t border-gray-100">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Device Information
            </summary>
            <div className="mt-2 space-y-1 text-xs text-gray-500 pl-4">
              <div>Device ID: {preferences.deviceFingerprint || 'Not set'}</div>
              <div>Version: {preferences.version}</div>
              <div>User ID: {preferences.userId || 'Anonymous'}</div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}