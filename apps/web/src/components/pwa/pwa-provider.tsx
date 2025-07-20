'use client';

import { InstallPrompt } from './install-prompt';
import { OfflineIndicator, OnlineIndicator } from './offline-indicator';
import { UpdatePrompt } from './update-prompt';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InstallPrompt />
      <OfflineIndicator />
      <OnlineIndicator />
      <UpdatePrompt />
    </>
  );
}