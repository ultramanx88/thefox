/**
 * Real-time Status Components
 * Components for displaying sync status, network status, and offline actions
 */

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  Sync, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  useSyncStatus, 
  useNetworkStatus, 
  useOfflineActions,
  usePendingWrites 
} from '@/hooks/useRealtime';

// ===========================================
// NETWORK STATUS INDICATOR
// ===========================================

interface NetworkStatusProps {
  className?: string;
  showText?: boolean;
}

export function NetworkStatus({ className = '', showText = false }: NetworkStatusProps) {
  const { isOnline, connectionQuality } = useNetworkStatus();

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (connectionQuality === 'poor') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (connectionQuality === 'poor') return <Wifi className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (connectionQuality === 'poor') return 'Poor Connection';
    return 'Online';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      {showText && (
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}

// ===========================================
// SYNC STATUS INDICATOR
// ===========================================

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatus({ className = '', showDetails = false }: SyncStatusProps) {
  const { 
    isOnline, 
    hasPendingWrites, 
    lastSyncTime, 
    syncErrors, 
    activeSubscriptions,
    syncOfflineActions,
    clearErrors 
  } = useSyncStatus();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineActions();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (syncErrors.length > 0) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (hasPendingWrites) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (isOnline) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <CloudOff className="h-4 w-4 text-gray-500" />;
  };

  const getSyncStatus = () => {
    if (isSyncing) return 'Syncing...';
    if (syncErrors.length > 0) return `${syncErrors.length} sync errors`;
    if (hasPendingWrites) return 'Pending writes';
    if (isOnline) return 'Synced';
    return 'Offline';
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        {getSyncIcon()}
        <span className="text-sm text-gray-700">{getSyncStatus()}</span>
        
        {showDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}

        {!isOnline && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        )}
      </div>

      {showDetails && isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active subscriptions:</span>
              <span className="font-medium">{activeSubscriptions}</span>
            </div>
            
            {lastSyncTime && (
              <div className="flex justify-between">
                <span>Last sync:</span>
                <span className="font-medium">
                  {lastSyncTime.toLocaleTimeString()}
                </span>
              </div>
            )}

            {syncErrors.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-red-600">Sync errors:</span>
                  <button
                    onClick={clearErrors}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-20 overflow-y-auto">
                  {syncErrors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-1 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// OFFLINE ACTIONS INDICATOR
// ===========================================

interface OfflineActionsProps {
  className?: string;
}

export function OfflineActions({ className = '' }: OfflineActionsProps) {
  const { offlineActions, pendingCount } = useOfflineActions();
  const [isExpanded, setIsExpanded] = useState(false);

  if (pendingCount === 0) return null;

  return (
    <div className={`${className}`}>
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Clock className="h-4 w-4 text-yellow-500" />
        <span className="text-sm text-yellow-700">
          {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {offlineActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium capitalize">{action.type}</span>
                  <span className="text-gray-600 ml-2">{action.collection}</span>
                  {action.documentId && (
                    <span className="text-gray-500 ml-1">/{action.documentId}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Retry {action.retryCount}/{action.maxRetries}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// PENDING WRITES INDICATOR
// ===========================================

export function PendingWrites({ className = '' }: { className?: string }) {
  const { hasPendingWrites, waitForWrites } = usePendingWrites();
  const [isWaiting, setIsWaiting] = useState(false);

  if (!hasPendingWrites) return null;

  const handleWaitForWrites = async () => {
    setIsWaiting(true);
    try {
      await waitForWrites();
    } catch (error) {
      console.error('Error waiting for writes:', error);
    } finally {
      setIsWaiting(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Sync className="h-4 w-4 text-blue-500 animate-pulse" />
      <span className="text-sm text-blue-700">Saving changes...</span>
      <button
        onClick={handleWaitForWrites}
        disabled={isWaiting}
        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        {isWaiting ? 'Waiting...' : 'Wait'}
      </button>
    </div>
  );
}

// ===========================================
// COMPREHENSIVE REALTIME STATUS
// ===========================================

interface RealtimeStatusBarProps {
  className?: string;
  position?: 'top' | 'bottom';
}

export function RealtimeStatusBar({ 
  className = '', 
  position = 'bottom' 
}: RealtimeStatusBarProps) {
  const { isOnline } = useNetworkStatus();
  const { pendingCount } = useOfflineActions();
  const { hasPendingWrites } = usePendingWrites();
  const { syncErrors } = useSyncStatus();

  // Don't show if everything is normal
  if (isOnline && pendingCount === 0 && !hasPendingWrites && syncErrors.length === 0) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-0 border-b' 
    : 'bottom-0 border-t';

  return (
    <div className={`
      fixed left-0 right-0 z-50 bg-white border-gray-200 px-4 py-2
      ${positionClasses} ${className}
    `}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <NetworkStatus showText />
          <SyncStatus />
          <OfflineActions />
          <PendingWrites />
        </div>

        {syncErrors.length > 0 && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Sync issues detected</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// REALTIME CONNECTION INDICATOR
// ===========================================

interface ConnectionIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectionIndicator({ 
  className = '', 
  size = 'md' 
}: ConnectionIndicatorProps) {
  const { isOnline, connectionQuality } = useNetworkStatus();

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (connectionQuality === 'poor') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`
        rounded-full ${sizeClasses[size]} ${getStatusColor()}
        ${isOnline ? 'animate-pulse' : ''}
      `} />
      {size !== 'sm' && (
        <span className="text-xs text-gray-600">
          {isOnline ? 'Connected' : 'Offline'}
        </span>
      )}
    </div>
  );
}

// ===========================================
// SYNC PROGRESS INDICATOR
// ===========================================

interface SyncProgressProps {
  className?: string;
}

export function SyncProgress({ className = '' }: SyncProgressProps) {
  const { pendingCount } = useOfflineActions();
  const { hasPendingWrites } = usePendingWrites();
  const { isOnline } = useNetworkStatus();

  if (!hasPendingWrites && pendingCount === 0) return null;

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
        <span className="text-xs text-gray-600">
          {hasPendingWrites ? 'Saving...' : `${pendingCount} pending`}
        </span>
      </div>
    </div>
  );
}

export default RealtimeStatusBar;