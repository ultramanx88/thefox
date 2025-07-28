'use client';

import { Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IOSInstallMethodProps {
  onDismiss: () => void;
}

export function IOSInstallMethod({ onDismiss }: IOSInstallMethodProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Smartphone className="h-6 w-6 text-orange-500" />
        <div>
          <h3 className="font-medium">Install theFOX App</h3>
          <p className="text-sm text-muted-foreground">
            Add to your home screen for the best experience
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Tap the Share button</span>
              <Share className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Located at the bottom of your Safari browser
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Select "Add to Home Screen"</span>
              <Plus className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Scroll down in the share menu to find this option
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium">Tap "Add" to install</span>
            <p className="text-xs text-muted-foreground mt-1">
              The app will be added to your home screen
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="flex-1"
        >
          Maybe Later
        </Button>
        <Button
          onClick={onDismiss}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
        >
          Got It
        </Button>
      </div>
    </div>
  );
}