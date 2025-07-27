/**
 * Comprehensive Real-time Data Synchronization Service
 * Integrates order tracking, connection management, and real-time updates
 */
import { OrderStatusUpdate, DeliveryLocation } from './order-tracking';
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
export declare class RealtimeDataSyncService {
    private static instance;
    private config;
    private isInitialized;
    private syncTimer;
    private eventListeners;
    private constructor();
    static getInstance(config?: Partial<SyncConfiguration>): RealtimeDataSyncService;
    /**
     * Initialize the real-time sync service
     */
    initialize(): Promise<void>;
    /**
     * Subscribe to real-time order updates for a user
     */
    subscribeToUserOrders(userId: string, callback: (orders: any[]) => void, errorCallback?: (error: Error) => void): Promise<string>;
    /**
     * Subscribe to real-time order status updates
     */
    subscribeToOrderStatus(orderId: string, callback: (order: any) => void, errorCallback?: (error: Error) => void): Promise<string>;
    /**
     * Update order status with real-time sync
     */
    updateOrderStatus(update: OrderStatusUpdate): Promise<void>;
    /**
     * Subscribe to real-time delivery tracking
     */
    subscribeToDeliveryTracking(orderId: string, callback: (locations: DeliveryLocation[]) => void, errorCallback?: (error: Error) => void): Promise<string>;
    /**
     * Update delivery location with real-time sync
     */
    updateDeliveryLocation(location: DeliveryLocation): Promise<void>;
    /**
     * Subscribe to real-time market updates
     */
    subscribeToMarketUpdates(marketId: string, callback: (market: any) => void, errorCallback?: (error: Error) => void): Promise<string>;
    /**
     * Subscribe to real-time product updates
     */
    subscribeToProductUpdates(marketId: string, callback: (products: any[]) => void, errorCallback?: (error: Error) => void): Promise<string>;
    /**
     * Handle connection restored event
     */
    private handleConnectionRestored;
    /**
     * Handle connection lost event
     */
    private handleConnectionLost;
    /**
     * Handle manual conflict resolution
     */
    private handleManualConflictResolution;
    /**
     * Start periodic sync process
     */
    private startPeriodicSync;
    /**
     * Perform periodic sync operations
     */
    private performPeriodicSync;
    /**
     * Stop periodic sync
     */
    private stopPeriodicSync;
    /**
     * Get comprehensive sync metrics
     */
    getSyncMetrics(): SyncMetrics;
    /**
     * Get health status
     */
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        issues: string[];
        metrics: SyncMetrics;
    };
    /**
     * Add event listener
     */
    addEventListener(event: string, callback: (data: any) => void): void;
    /**
     * Remove event listener
     */
    removeEventListener(event: string, callback: (data: any) => void): void;
    /**
     * Emit event to all listeners
     */
    private emitEvent;
    /**
     * Emit data update event
     */
    private emitDataUpdate;
    /**
     * Unsubscribe from all real-time updates
     */
    unsubscribeAll(): void;
    /**
     * Cleanup and shutdown the service
     */
    cleanup(): Promise<void>;
}
export declare const realtimeDataSyncService: RealtimeDataSyncService;
export declare const initializeRealtimeSync: (config?: Partial<SyncConfiguration>) => Promise<RealtimeDataSyncService>;
export declare const getRealtimeSyncMetrics: () => SyncMetrics;
export declare const getRealtimeSyncHealth: () => {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
    metrics: SyncMetrics;
};
