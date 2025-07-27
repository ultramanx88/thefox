/**
 * Comprehensive Real-time Data Synchronization Service
 * Integrates order tracking, connection management, and real-time updates
 */

import { orderTrackingService, OrderStatusUpdate, DeliveryLocation } from './order-tracking';
import { connectionManager } from './connection-manager';
import { realtimeSyncService } from './realtime';
import { FirestoreService } from './firestore';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface SyncConfiguration {
  enableOrderTracking: boolean;
  enableDeliveryTracking: boolean;
  enableOfflineSupport: boolean;
  enableConflictResolution: boolean;
  maxRetries: number;
  syncInterval: number;
  heartbeatInterval: number;
}

export interface SyncMetrics {
  totalSubscriptions: number;
  activeOrderTracking: number;
  activeDeliveryTracking: number;
  pendingOfflineActions: number;
  pendingConflicts: number;
  lastSyncTime: Date | null;
  syncErrors: string[];
  connectionState: any;
  networkQuality: any;
}

export interface RealtimeDataUpdate {
  type: 'order' | 'delivery' | 'market' | 'product' | 'user';
  action: 'create' | 'update' | 'delete';
  documentId: string;
  data: any;
  timestamp: Date;
  userId?: string;
  metadata?: any;
}

// ===========================================
// REAL-TIME SYNC SERVICE
// ===========================================

export class RealtimeDataSyncService {
  private static instance: RealtimeDataSyncService;
  private config: SyncConfiguration;
  private isInitialized: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor(config: Partial<SyncConfiguration> = {}) {
    this.config = {
      enableOrderTracking: true,
      enableDeliveryTracking: true,
      enableOfflineSupport: true,
      enableConflictResolution: true,
      maxRetries: 3,
      syncInterval: 30000, // 30 seconds
      heartbeatInterval: 60000, // 1 minute
      ...config
    };
  }

  static getInstance(config?: Partial<SyncConfiguration>): RealtimeDataSyncService {
    if (!RealtimeDataSyncService.instance) {
      RealtimeDataSyncService.instance = new RealtimeDataSyncService(config);
    }
    return RealtimeDataSyncService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  /**
   * Initialize the real-time sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('RealtimeDataSyncService already initialized');
      return;
    }

    try {
      console.log('Initializing Real-time Data Sync Service...');

      // Initialize connection manager
      const connManager = connectionManager;
      
      // Set up connection event listeners
      connManager.addEventListener('connection:restored', (data) => {
        this.handleConnectionRestored(data);
      });

      connManager.addEventListener('connection:lost', (data) => {
        this.handleConnectionLost(data);
      });

      connManager.addEventListener('conflict:manual-resolution-required', (conflict) => {
        this.handleManualConflictResolution(conflict);
      });

      // Start periodic sync
      this.startPeriodicSync();

      this.isInitialized = true;
      console.log('Real-time Data Sync Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Real-time Data Sync Service:', error);
      throw error;
    }
  }

  // ===========================================
  // ORDER TRACKING INTEGRATION
  // ===========================================

  /**
   * Subscribe to real-time order updates for a user
   */
  async subscribeToUserOrders(
    userId: string,
    callback: (orders: any[]) => void,
    errorCallback?: (error: Error) => void
  ): Promise<string> {
    if (!this.config.enableOrderTracking) {
      throw new Error('Order tracking is disabled');
    }

    return orderTrackingService.subscribeToUserOrders(
      userId,
      (orders) => {
        // Emit update event
        this.emitDataUpdate({
          type: 'order',
          action: 'update',
          documentId: userId,
          data: orders,
          timestamp: new Date(),
          userId,
        });

        callback(orders);
      },
      errorCallback
    );
  }

  /**
   * Subscribe to real-time order status updates
   */
  async subscribeToOrderStatus(
    orderId: string,
    callback: (order: any) => void,
    errorCallback?: (error: Error) => void
  ): Promise<string> {
    if (!this.config.enableOrderTracking) {
      throw new Error('Order tracking is disabled');
    }

    return orderTrackingService.subscribeToOrderStatus(
      orderId,
      (order) => {
        // Emit update event
        this.emitDataUpdate({
          type: 'order',
          action: 'update',
          documentId: orderId,
          data: order,
          timestamp: new Date(),
        });

        callback(order);
      },
      errorCallback
    );
  }

  /**
   * Update order status with real-time sync
   */
  async updateOrderStatus(update: OrderStatusUpdate): Promise<void> {
    if (!this.config.enableOrderTracking) {
      throw new Error('Order tracking is disabled');
    }

    try {
      await orderTrackingService.updateOrderStatus(update);
      
      // Emit update event
      this.emitDataUpdate({
        type: 'order',
        action: 'update',
        documentId: update.orderId,
        data: update,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Failed to update order status:', error);
      
      // Queue for offline sync if enabled
      if (this.config.enableOfflineSupport) {
        realtimeSyncService.queueOfflineAction({
          type: 'update',
          collection: 'orders',
          documentId: update.orderId,
          data: update,
          maxRetries: this.config.maxRetries,
        });
      }
      
      throw error;
    }
  }

  // ===========================================
  // DELIVERY TRACKING INTEGRATION
  // ===========================================

  /**
   * Subscribe to real-time delivery tracking
   */
  async subscribeToDeliveryTracking(
    orderId: string,
    callback: (locations: DeliveryLocation[]) => void,
    errorCallback?: (error: Error) => void
  ): Promise<string> {
    if (!this.config.enableDeliveryTracking) {
      throw new Error('Delivery tracking is disabled');
    }

    return orderTrackingService.subscribeToDeliveryTracking(
      orderId,
      (locations) => {
        // Emit update event
        this.emitDataUpdate({
          type: 'delivery',
          action: 'update',
          documentId: orderId,
          data: locations,
          timestamp: new Date(),
        });

        callback(locations);
      },
      errorCallback
    );
  }

  /**
   * Update delivery location with real-time sync
   */
  async updateDeliveryLocation(location: DeliveryLocation): Promise<void> {
    if (!this.config.enableDeliveryTracking) {
      throw new Error('Delivery tracking is disabled');
    }

    try {
      await orderTrackingService.updateDeliveryLocation(location);
      
      // Emit update event
      this.emitDataUpdate({
        type: 'delivery',
        action: 'update',
        documentId: location.orderId,
        data: location,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Failed to update delivery location:', error);
      
      // Queue for offline sync if enabled
      if (this.config.enableOfflineSupport) {
        realtimeSyncService.queueOfflineAction({
          type: 'create',
          collection: 'deliveryTracking',
          data: location,
          maxRetries: this.config.maxRetries,
        });
      }
      
      throw error;
    }
  }

  // ===========================================
  // MARKET AND PRODUCT UPDATES
  // ===========================================

  /**
   * Subscribe to real-time market updates
   */
  async subscribeToMarketUpdates(
    marketId: string,
    callback: (market: any) => void,
    errorCallback?: (error: Error) => void
  ): Promise<string> {
    return realtimeSyncService.subscribeToDocument(
      `markets/${marketId}`,
      (market) => {
        // Emit update event
        this.emitDataUpdate({
          type: 'market',
          action: 'update',
          documentId: marketId,
          data: market,
          timestamp: new Date(),
        });

        callback(market);
      },
      errorCallback
    );
  }

  /**
   * Subscribe to real-time product updates
   */
  async subscribeToProductUpdates(
    marketId: string,
    callback: (products: any[]) => void,
    errorCallback?: (error: Error) => void
  ): Promise<string> {
    return realtimeSyncService.subscribeToCollection(
      'products',
      [
        { field: 'marketId', operator: '==', value: marketId }
      ],
      (products) => {
        // Emit update event
        this.emitDataUpdate({
          type: 'product',
          action: 'update',
          documentId: marketId,
          data: products,
          timestamp: new Date(),
        });

        callback(products);
      },
      errorCallback
    );
  }

  // ===========================================
  // CONNECTION MANAGEMENT
  // ===========================================

  /**
   * Handle connection restored event
   */
  private async handleConnectionRestored(data: any): Promise<void> {
    console.log('Connection restored, syncing data...', data);

    try {
      // Sync offline actions
      await realtimeSyncService.syncOfflineActions();
      
      // Emit connection restored event
      this.emitEvent('sync:connection-restored', data);
      
    } catch (error) {
      console.error('Error handling connection restoration:', error);
    }
  }

  /**
   * Handle connection lost event
   */
  private handleConnectionLost(data: any): void {
    console.log('Connection lost, enabling offline mode...', data);
    
    // Emit connection lost event
    this.emitEvent('sync:connection-lost', data);
  }

  /**
   * Handle manual conflict resolution
   */
  private handleManualConflictResolution(conflict: any): void {
    console.log('Manual conflict resolution required:', conflict);
    
    // Emit conflict event for UI handling
    this.emitEvent('sync:conflict-resolution-required', conflict);
  }

  // ===========================================
  // PERIODIC SYNC
  // ===========================================

  /**
   * Start periodic sync process
   */
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      await this.performPeriodicSync();
    }, this.config.syncInterval);

    console.log(`Periodic sync started (interval: ${this.config.syncInterval}ms)`);
  }

  /**
   * Perform periodic sync operations
   */
  private async performPeriodicSync(): Promise<void> {
    try {
      // Check connection state
      const connectionState = connectionManager.getConnectionState();
      
      if (!connectionState.isOnline || !connectionState.isFirestoreConnected) {
        console.log('Skipping periodic sync - offline');
        return;
      }

      // Sync offline actions
      await realtimeSyncService.syncOfflineActions();
      
      // Emit sync completed event
      this.emitEvent('sync:periodic-completed', {
        timestamp: new Date(),
        connectionState,
      });

    } catch (error) {
      console.error('Error during periodic sync:', error);
      this.emitEvent('sync:error', { error, timestamp: new Date() });
    }
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Periodic sync stopped');
    }
  }

  // ===========================================
  // METRICS AND MONITORING
  // ===========================================

  /**
   * Get comprehensive sync metrics
   */
  getSyncMetrics(): SyncMetrics {
    const realtimeStatus = realtimeSyncService.getSyncStatus();
    const connectionState = connectionManager.getConnectionState();
    const networkQuality = connectionManager.getNetworkQuality();
    const pendingConflicts = connectionManager.getPendingConflicts();

    return {
      totalSubscriptions: realtimeStatus.activeSubscriptions,
      activeOrderTracking: orderTrackingService.getActiveSubscriptionsCount(),
      activeDeliveryTracking: 0, // Would need to track this separately
      pendingOfflineActions: realtimeSyncService.getPendingOfflineActions().length,
      pendingConflicts: pendingConflicts.length,
      lastSyncTime: realtimeStatus.lastSyncTime,
      syncErrors: [...realtimeStatus.syncErrors, ...connectionState.syncErrors],
      connectionState,
      networkQuality,
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: SyncMetrics;
  } {
    const metrics = this.getSyncMetrics();
    const issues: string[] = [];
    
    // Check for issues
    if (!metrics.connectionState.isOnline) {
      issues.push('Device is offline');
    }
    
    if (!metrics.connectionState.isFirestoreConnected) {
      issues.push('Firestore connection lost');
    }
    
    if (metrics.pendingOfflineActions > 10) {
      issues.push('High number of pending offline actions');
    }
    
    if (metrics.pendingConflicts > 0) {
      issues.push('Unresolved data conflicts');
    }
    
    if (metrics.syncErrors.length > 5) {
      issues.push('Multiple sync errors detected');
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (issues.length <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, issues, metrics };
  }

  // ===========================================
  // EVENT SYSTEM
  // ===========================================

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Emit data update event
   */
  private emitDataUpdate(update: RealtimeDataUpdate): void {
    this.emitEvent('data:update', update);
    this.emitEvent(`data:${update.type}:${update.action}`, update);
  }

  // ===========================================
  // CLEANUP
  // ===========================================

  /**
   * Unsubscribe from all real-time updates
   */
  unsubscribeAll(): void {
    orderTrackingService.unsubscribeAll();
    realtimeSyncService.unsubscribeAll();
    console.log('All real-time subscriptions removed');
  }

  /**
   * Cleanup and shutdown the service
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up Real-time Data Sync Service...');

    // Stop periodic sync
    this.stopPeriodicSync();

    // Unsubscribe from all updates
    this.unsubscribeAll();

    // Clear event listeners
    this.eventListeners.clear();

    // Cleanup connection manager
    await connectionManager.cleanup();

    this.isInitialized = false;
    console.log('Real-time Data Sync Service cleaned up');
  }
}

// Export singleton instance
export const realtimeDataSyncService = RealtimeDataSyncService.getInstance();

// Export utility functions
export const initializeRealtimeSync = async (config?: Partial<SyncConfiguration>) => {
  const service = RealtimeDataSyncService.getInstance(config);
  await service.initialize();
  return service;
};

export const getRealtimeSyncMetrics = () => {
  return realtimeDataSyncService.getSyncMetrics();
};

export const getRealtimeSyncHealth = () => {
  return realtimeDataSyncService.getHealthStatus();
};