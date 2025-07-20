'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2">
      <div className="flex items-center justify-center space-x-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may not be available.</span>
      </div>
    </div>
  );
}

export function OnlineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      
      // Hide the "back online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustCameOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!justCameOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2">
      <div className="flex items-center justify-center space-x-2 text-sm">
        <Wifi className="h-4 w-4" />
        <span>You're back online!</span>
      </div>
    </div>
  );
}