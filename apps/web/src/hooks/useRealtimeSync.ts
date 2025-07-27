/**
 * React Hook for Real-time Data Synchronization
 * Provides easy access to real-time sync features in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  realtimeDataSyncService, 
  initializeRealtimeSync,
  getRealtimeSyncMetrics,
  getRealtimeSyncHealth
} from '@repo/api/firebase/config';
import type { 
  SyncConfiguration, 
  SyncMetrics, 
  OrderStatusUpdate, 
  DeliveryLocation 
} from '@repo/api/firebase/realtime-sync';

// ===========================================
// HOOK TYPES
// ===========================================

interface UseRealtimeSyncOptions {
  autoInitialize?: boolean;
  config?: Partial<SyncConfiguration>;
}

interface SyncState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  metrics: SyncMetrics | null;
  health: any | null;
}

// ===========================================
// MAIN HOOK
// ===========================================

export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const { autoInitialize = true, config } = options;
  
  const [state, setState] = useState<SyncState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    metrics: null,
    health: null,
  });

  const subscriptionsRef = useRef<Set<string>>(new Set());

  // Initialize the service
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await initializeRealtimeSync(config);
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        metrics: getRealtimeSyncMetrics(),
        health: getRealtimeSyncHealth(),
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [config, state.isInitialized, state.isLoading]);

  // Update metrics periodically
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        metrics: getRealtimeSyncMetrics(),
        health: getRealtimeSyncHealth(),
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [state.isInitialized]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isLoading]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subscriptionId => {
        // Cleanup would be handled by the service
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    ...state,
    initialize,
    service: realtimeDataSyncService,
  };
}

// ===========================================
// ORDER TRACKING HOOKS
// ===========================================

export function useRealtimeOrderStatus(orderId: string | null) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    setError(null);

    const subscribe = async () => {
      try {
        const subscriptionId = await realtimeDataSyncService.subscribeToOrderStatus(
          orderId,
          (orderData) => {
            setOrder(orderData);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          }
        );

        subscriptionRef.current = subscriptionId;

      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        // Cleanup subscription
        subscriptionRef.current = null;
      }
    };
  }, [orderId]);

  const updateOrderStatus = useCallback(async (update: OrderStatusUpdate) => {
    try {
      await realtimeDataSyncService.updateOrderStatus(update);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    order,
    loading,
    error,
    updateOrderStatus,
  };
}

export function useRealtimeUserOrders(userId: string | null) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    const subscribe = async () => {
      try {
        const subscriptionId = await realtimeDataSyncService.subscribeToUserOrders(
          userId,
          (ordersData) => {
            setOrders(ordersData);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          }
        );

        subscriptionRef.current = subscriptionId;

      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current = null;
      }
    };
  }, [userId]);

  return {
    orders,
    loading,
    error,
  };
}

// ===========================================
// DELIVERY TRACKING HOOKS
// ===========================================

export function useRealtimeDeliveryTracking(orderId: string | null) {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLocations([]);
      return;
    }

    setLoading(true);
    setError(null);

    const subscribe = async () => {
      try {
        const subscriptionId = await realtimeDataSyncService.subscribeToDeliveryTracking(
          orderId,
          (locationsData) => {
            setLocations(locationsData);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          }
        );

        subscriptionRef.current = subscriptionId;

      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current = null;
      }
    };
  }, [orderId]);

  const updateDeliveryLocation = useCallback(async (location: DeliveryLocation) => {
    try {
      await realtimeDataSyncService.updateDeliveryLocation(location);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    locations,
    currentLocation: locations[0] || null,
    loading,
    error,
    updateDeliveryLocation,
  };
}

// ===========================================
// MARKET AND PRODUCT HOOKS
// ===========================================

export function useRealtimeMarket(marketId: string | null) {
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!marketId) {
      setMarket(null);
      return;
    }

    setLoading(true);
    setError(null);

    const subscribe = async () => {
      try {
        const subscriptionId = await realtimeDataSyncService.subscribeToMarketUpdates(
          marketId,
          (marketData) => {
            setMarket(marketData);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          }
        );

        subscriptionRef.current = subscriptionId;

      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current = null;
      }
    };
  }, [marketId]);

  return {
    market,
    loading,
    error,
  };
}

export function useRealtimeProducts(marketId: string | null) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!marketId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    const subscribe = async () => {
      try {
        const subscriptionId = await realtimeDataSyncService.subscribeToProductUpdates(
          marketId,
          (productsData) => {
            setProducts(productsData);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          }
        );

        subscriptionRef.current = subscriptionId;

      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current = null;
      }
    };
  }, [marketId]);

  return {
    products,
    loading,
    error,
  };
}

// ===========================================
// CONNECTION STATUS HOOK
// ===========================================

export function useConnectionStatus() {
  const [connectionState, setConnectionState] = useState<any>(null);
  const [networkQuality, setNetworkQuality] = useState<any>(null);

  useEffect(() => {
    // Set up event listeners for connection changes
    const handleConnectionRestored = (data: any) => {
      setConnectionState(prev => ({ ...prev, isOnline: true, isFirestoreConnected: true }));
    };

    const handleConnectionLost = (data: any) => {
      setConnectionState(prev => ({ ...prev, isOnline: false }));
    };

    const handleNetworkQualityChange = (quality: any) => {
      setNetworkQuality(quality);
    };

    // Add event listeners
    realtimeDataSyncService.addEventListener('sync:connection-restored', handleConnectionRestored);
    realtimeDataSyncService.addEventListener('sync:connection-lost', handleConnectionLost);
    realtimeDataSyncService.addEventListener('network:quality-change', handleNetworkQualityChange);

    // Get initial state
    const metrics = getRealtimeSyncMetrics();
    setConnectionState(metrics.connectionState);
    setNetworkQuality(metrics.networkQuality);

    return () => {
      // Remove event listeners
      realtimeDataSyncService.removeEventListener('sync:connection-restored', handleConnectionRestored);
      realtimeDataSyncService.removeEventListener('sync:connection-lost', handleConnectionLost);
      realtimeDataSyncService.removeEventListener('network:quality-change', handleNetworkQualityChange);
    };
  }, []);

  return {
    connectionState,
    networkQuality,
    isOnline: connectionState?.isOnline ?? true,
    isFirestoreConnected: connectionState?.isFirestoreConnected ?? true,
  };
}

// ===========================================
// SYNC METRICS HOOK
// ===========================================

export function useSyncMetrics() {
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getRealtimeSyncMetrics());
      setHealth(getRealtimeSyncHealth());
    };

    // Initial update
    updateMetrics();

    // Update periodically
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    health,
    isHealthy: health?.status === 'healthy',
    issues: health?.issues || [],
  };
}