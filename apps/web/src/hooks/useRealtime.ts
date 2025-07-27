/**
 * Real-time Data Hooks
 * React hooks for real-time data synchronization and offline support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  realtimeSyncService, 
  SyncStatus, 
  OfflineAction, 
  ConflictResolution,
  createConflictResolver 
} from '@/packages/api/src/firebase/realtime';
import { where, orderBy, limit, QueryConstraint } from 'firebase/firestore';

// ===========================================
// REAL-TIME DOCUMENT HOOK
// ===========================================

export function useRealtimeDocument<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const subscriptionId = realtimeSyncService.subscribeToDocument<T>(
      path,
      (documentData) => {
        setData(documentData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    subscriptionRef.current = subscriptionId;

    return () => {
      if (subscriptionRef.current) {
        realtimeSyncService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [path]);

  return {
    data,
    loading,
    error,
    refetch: useCallback(() => {
      if (path && subscriptionRef.current) {
        realtimeSyncService.unsubscribe(subscriptionRef.current);
        const newSubscriptionId = realtimeSyncService.subscribeToDocument<T>(
          path,
          setData,
          setError
        );
        subscriptionRef.current = newSubscriptionId;
      }
    }, [path]),
  };
}

// ===========================================
// REAL-TIME COLLECTION HOOK
// ===========================================

export function useRealtimeCollection<T>(
  collectionPath: string | null,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!collectionPath) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const subscriptionId = realtimeSyncService.subscribeToCollection<T>(
      collectionPath,
      constraints,
      (collectionData) => {
        setData(collectionData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    subscriptionRef.current = subscriptionId;

    return () => {
      if (subscriptionRef.current) {
        realtimeSyncService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [collectionPath, JSON.stringify(constraints)]);

  return {
    data,
    loading,
    error,
    refetch: useCallback(() => {
      if (collectionPath && subscriptionRef.current) {
        realtimeSyncService.unsubscribe(subscriptionRef.current);
        const newSubscriptionId = realtimeSyncService.subscribeToCollection<T>(
          collectionPath,
          constraints,
          setData,
          setError
        );
        subscriptionRef.current = newSubscriptionId;
      }
    }, [collectionPath, constraints]),
  };
}

// ===========================================
// SYNC STATUS HOOK
// ===========================================

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    realtimeSyncService.getSyncStatus()
  );

  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(realtimeSyncService.getSyncStatus());
    };

    // Listen for network status changes
    realtimeSyncService.addEventListener('network:online', updateSyncStatus);
    realtimeSyncService.addEventListener('network:offline', updateSyncStatus);

    // Update status periodically
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      realtimeSyncService.removeEventListener('network:online', updateSyncStatus);
      realtimeSyncService.removeEventListener('network:offline', updateSyncStatus);
      clearInterval(interval);
    };
  }, []);

  const syncOfflineActions = useCallback(async () => {
    try {
      await realtimeSyncService.syncOfflineActions();
      setSyncStatus(realtimeSyncService.getSyncStatus());
    } catch (error) {
      console.error('Failed to sync offline actions:', error);
    }
  }, []);

  const clearErrors = useCallback(() => {
    realtimeSyncService.clearSyncErrors();
    setSyncStatus(realtimeSyncService.getSyncStatus());
  }, []);

  return {
    ...syncStatus,
    syncOfflineActions,
    clearErrors,
  };
}

// ===========================================
// OFFLINE ACTIONS HOOK
// ===========================================

export function useOfflineActions() {
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);

  useEffect(() => {
    const updateOfflineActions = () => {
      setOfflineActions(realtimeSyncService.getPendingOfflineActions());
    };

    // Update initially
    updateOfflineActions();

    // Update periodically
    const interval = setInterval(updateOfflineActions, 2000);

    return () => clearInterval(interval);
  }, []);

  const queueAction = useCallback((
    type: OfflineAction['type'],
    collection: string,
    data: any,
    documentId?: string,
    maxRetries: number = 3
  ) => {
    const actionId = realtimeSyncService.queueOfflineAction({
      type,
      collection,
      documentId,
      data,
      maxRetries,
    });

    setOfflineActions(realtimeSyncService.getPendingOfflineActions());
    return actionId;
  }, []);

  return {
    offlineActions,
    queueAction,
    pendingCount: offlineActions.length,
  };
}

// ===========================================
// SPECIALIZED REAL-TIME HOOKS
// ===========================================

// Real-time order tracking
export function useRealtimeOrder(orderId: string | null) {
  return useRealtimeDocument<any>(orderId ? `orders/${orderId}` : null);
}

// Real-time order status updates
export function useRealtimeOrderStatus(orderId: string | null) {
  const { data: order, loading, error } = useRealtimeOrder(orderId);
  
  return {
    status: order?.status || null,
    statusHistory: order?.statusHistory || [],
    estimatedDeliveryTime: order?.estimatedDeliveryTime || null,
    driverId: order?.driverId || null,
    loading,
    error,
  };
}

// Real-time user notifications
export function useRealtimeNotifications(userId: string | null, unreadOnly: boolean = false) {
  const constraints = userId ? [
    where('userId', '==', userId),
    ...(unreadOnly ? [where('isRead', '==', false)] : []),
    orderBy('createdAt', 'desc'),
    limit(50)
  ] : [];

  return useRealtimeCollection<any>(
    userId ? 'notifications' : null,
    constraints
  );
}

// Real-time market orders
export function useRealtimeMarketOrders(marketId: string | null, status?: string) {
  const constraints = marketId ? [
    where('marketId', '==', marketId),
    ...(status ? [where('status', '==', status)] : []),
    orderBy('createdAt', 'desc'),
    limit(100)
  ] : [];

  return useRealtimeCollection<any>(
    marketId ? 'orders' : null,
    constraints
  );
}

// Real-time driver orders
export function useRealtimeDriverOrders(driverId: string | null, status?: string) {
  const constraints = driverId ? [
    where('driverId', '==', driverId),
    ...(status ? [where('status', '==', status)] : []),
    orderBy('createdAt', 'desc'),
    limit(50)
  ] : [];

  return useRealtimeCollection<any>(
    driverId ? 'orders' : null,
    constraints
  );
}

// Real-time delivery tracking
export function useRealtimeDeliveryTracking(orderId: string | null) {
  const constraints = orderId ? [
    where('orderId', '==', orderId),
    orderBy('timestamp', 'desc'),
    limit(20)
  ] : [];

  return useRealtimeCollection<any>(
    orderId ? 'deliveryTracking' : null,
    constraints
  );
}

// Real-time market availability
export function useRealtimeMarketAvailability(marketId: string | null) {
  const { data: market, loading, error } = useRealtimeDocument<any>(
    marketId ? `markets/${marketId}` : null
  );

  return {
    isOpen: market?.isOpen || false,
    operatingHours: market?.operatingHours || {},
    lastUpdate: market?.updatedAt || null,
    loading,
    error,
  };
}

// Real-time product stock
export function useRealtimeProductStock(productId: string | null) {
  const { data: product, loading, error } = useRealtimeDocument<any>(
    productId ? `products/${productId}` : null
  );

  return {
    inStock: product?.inStock || false,
    quantity: product?.quantity || 0,
    lastUpdate: product?.updatedAt || null,
    loading,
    error,
  };
}

// ===========================================
// CONFLICT RESOLUTION HOOK
// ===========================================

export function useConflictResolution<T>() {
  const [conflicts, setConflicts] = useState<Array<{
    id: string;
    clientData: T;
    serverData: T;
    resolver: (resolution: ConflictResolution) => void;
  }>>([]);

  const addConflict = useCallback((
    id: string,
    clientData: T,
    serverData: T,
    resolver: (resolution: ConflictResolution) => void
  ) => {
    setConflicts(prev => [...prev, { id, clientData, serverData, resolver }]);
  }, []);

  const resolveConflict = useCallback((
    id: string,
    strategy: ConflictResolution['strategy'],
    customResolver?: ConflictResolution['resolver']
  ) => {
    const conflict = conflicts.find(c => c.id === id);
    if (conflict) {
      const resolution = createConflictResolver(strategy, customResolver);
      conflict.resolver(resolution);
      setConflicts(prev => prev.filter(c => c.id !== id));
    }
  }, [conflicts]);

  return {
    conflicts,
    addConflict,
    resolveConflict,
    hasConflicts: conflicts.length > 0,
  };
}

// ===========================================
// NETWORK STATUS HOOK
// ===========================================

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Listen for network events
    realtimeSyncService.addEventListener('network:online', handleOnline);
    realtimeSyncService.addEventListener('network:offline', handleOffline);

    // Monitor connection quality
    const checkConnectionQuality = () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      // Simple connection quality check
      const start = Date.now();
      fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
        .then(() => {
          const duration = Date.now() - start;
          setConnectionQuality(duration > 1000 ? 'poor' : 'good');
        })
        .catch(() => {
          setConnectionQuality('poor');
        });
    };

    const qualityInterval = setInterval(checkConnectionQuality, 10000);

    return () => {
      realtimeSyncService.removeEventListener('network:online', handleOnline);
      realtimeSyncService.removeEventListener('network:offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  return {
    isOnline,
    connectionQuality,
    isGoodConnection: connectionQuality === 'good',
    isPoorConnection: connectionQuality === 'poor',
  };
}

// ===========================================
// OPTIMISTIC UPDATES HOOK
// ===========================================

export function useOptimisticUpdates<T>() {
  const [optimisticData, setOptimisticData] = useState<Map<string, T>>(new Map());
  const { queueAction } = useOfflineActions();

  const applyOptimisticUpdate = useCallback((
    id: string,
    data: T,
    action: {
      type: OfflineAction['type'];
      collection: string;
      documentId?: string;
    }
  ) => {
    // Apply optimistic update immediately
    setOptimisticData(prev => new Map(prev).set(id, data));

    // Queue the actual action
    queueAction(action.type, action.collection, data, action.documentId);

    // Remove optimistic update after a timeout (fallback)
    setTimeout(() => {
      setOptimisticData(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }, 10000);
  }, [queueAction]);

  const removeOptimisticUpdate = useCallback((id: string) => {
    setOptimisticData(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getOptimisticData = useCallback((id: string): T | undefined => {
    return optimisticData.get(id);
  }, [optimisticData]);

  return {
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    getOptimisticData,
    hasOptimisticUpdates: optimisticData.size > 0,
  };
}

// ===========================================
// UTILITY HOOKS
// ===========================================

export function useRealtimeCleanup() {
  useEffect(() => {
    return () => {
      // Cleanup all subscriptions when component unmounts
      realtimeSyncService.unsubscribeAll();
    };
  }, []);
}

export function usePendingWrites() {
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  const waitForWrites = useCallback(async () => {
    try {
      setHasPendingWrites(true);
      await realtimeSyncService.waitForPendingWrites();
      setHasPendingWrites(false);
    } catch (error) {
      setHasPendingWrites(false);
      throw error;
    }
  }, []);

  return {
    hasPendingWrites,
    waitForWrites,
  };
}