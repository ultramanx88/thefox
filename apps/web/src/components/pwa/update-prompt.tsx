'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-lg bg-blue-50 p-4 shadow-lg border border-blue-200 dark:bg-blue-900 dark:border-blue-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <RefreshCw className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Update Available
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                A new version of theFOX is available. Update now for the latest features.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Now
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}