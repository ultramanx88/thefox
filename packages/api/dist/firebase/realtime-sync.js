"use strict";
/**
 * Comprehensive Real-time Data Synchronization Service
 * Integrates order tracking, connection management, and real-time updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRealtimeSyncHealth = exports.getRealtimeSyncMetrics = exports.initializeRealtimeSync = exports.realtimeDataSyncService = exports.RealtimeDataSyncService = void 0;
const order_tracking_1 = require("./order-tracking");
const connection_manager_1 = require("./connection-manager");
const realtime_1 = require("./realtime");
// ===========================================
// REAL-TIME SYNC SERVICE
// ===========================================
class RealtimeDataSyncService {
    constructor(config = {}) {
        this.isInitialized = false;
        this.syncTimer = null;
        this.eventListeners = new Map();
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
    static getInstance(config) {
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
    async initialize() {
        if (this.isInitialized) {
            console.warn('RealtimeDataSyncService already initialized');
            return;
        }
        try {
            console.log('Initializing Real-time Data Sync Service...');
            // Initialize connection manager
            const connManager = connection_manager_1.connectionManager;
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
        }
        catch (error) {
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
    async subscribeToUserOrders(userId, callback, errorCallback) {
        if (!this.config.enableOrderTracking) {
            throw new Error('Order tracking is disabled');
        }
        return order_tracking_1.orderTrackingService.subscribeToUserOrders(userId, (orders) => {
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
        }, errorCallback);
    }
    /**
     * Subscribe to real-time order status updates
     */
    async subscribeToOrderStatus(orderId, callback, errorCallback) {
        if (!this.config.enableOrderTracking) {
            throw new Error('Order tracking is disabled');
        }
        return order_tracking_1.orderTrackingService.subscribeToOrderStatus(orderId, (order) => {
            // Emit update event
            this.emitDataUpdate({
                type: 'order',
                action: 'update',
                documentId: orderId,
                data: order,
                timestamp: new Date(),
            });
            callback(order);
        }, errorCallback);
    }
    /**
     * Update order status with real-time sync
     */
    async updateOrderStatus(update) {
        if (!this.config.enableOrderTracking) {
            throw new Error('Order tracking is disabled');
        }
        try {
            await order_tracking_1.orderTrackingService.updateOrderStatus(update);
            // Emit update event
            this.emitDataUpdate({
                type: 'order',
                action: 'update',
                documentId: update.orderId,
                data: update,
                timestamp: new Date(),
            });
        }
        catch (error) {
            console.error('Failed to update order status:', error);
            // Queue for offline sync if enabled
            if (this.config.enableOfflineSupport) {
                realtime_1.realtimeSyncService.queueOfflineAction({
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
    async subscribeToDeliveryTracking(orderId, callback, errorCallback) {
        if (!this.config.enableDeliveryTracking) {
            throw new Error('Delivery tracking is disabled');
        }
        return order_tracking_1.orderTrackingService.subscribeToDeliveryTracking(orderId, (locations) => {
            // Emit update event
            this.emitDataUpdate({
                type: 'delivery',
                action: 'update',
                documentId: orderId,
                data: locations,
                timestamp: new Date(),
            });
            callback(locations);
        }, errorCallback);
    }
    /**
     * Update delivery location with real-time sync
     */
    async updateDeliveryLocation(location) {
        if (!this.config.enableDeliveryTracking) {
            throw new Error('Delivery tracking is disabled');
        }
        try {
            await order_tracking_1.orderTrackingService.updateDeliveryLocation(location);
            // Emit update event
            this.emitDataUpdate({
                type: 'delivery',
                action: 'update',
                documentId: location.orderId,
                data: location,
                timestamp: new Date(),
            });
        }
        catch (error) {
            console.error('Failed to update delivery location:', error);
            // Queue for offline sync if enabled
            if (this.config.enableOfflineSupport) {
                realtime_1.realtimeSyncService.queueOfflineAction({
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
    async subscribeToMarketUpdates(marketId, callback, errorCallback) {
        return realtime_1.realtimeSyncService.subscribeToDocument(`markets/${marketId}`, (market) => {
            // Emit update event
            this.emitDataUpdate({
                type: 'market',
                action: 'update',
                documentId: marketId,
                data: market,
                timestamp: new Date(),
            });
            callback(market);
        }, errorCallback);
    }
    /**
     * Subscribe to real-time product updates
     */
    async subscribeToProductUpdates(marketId, callback, errorCallback) {
        return realtime_1.realtimeSyncService.subscribeToCollection('products', [
            { field: 'marketId', operator: '==', value: marketId }
        ], (products) => {
            // Emit update event
            this.emitDataUpdate({
                type: 'product',
                action: 'update',
                documentId: marketId,
                data: products,
                timestamp: new Date(),
            });
            callback(products);
        }, errorCallback);
    }
    // ===========================================
    // CONNECTION MANAGEMENT
    // ===========================================
    /**
     * Handle connection restored event
     */
    async handleConnectionRestored(data) {
        console.log('Connection restored, syncing data...', data);
        try {
            // Sync offline actions
            await realtime_1.realtimeSyncService.syncOfflineActions();
            // Emit connection restored event
            this.emitEvent('sync:connection-restored', data);
        }
        catch (error) {
            console.error('Error handling connection restoration:', error);
        }
    }
    /**
     * Handle connection lost event
     */
    handleConnectionLost(data) {
        console.log('Connection lost, enabling offline mode...', data);
        // Emit connection lost event
        this.emitEvent('sync:connection-lost', data);
    }
    /**
     * Handle manual conflict resolution
     */
    handleManualConflictResolution(conflict) {
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
    startPeriodicSync() {
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
    async performPeriodicSync() {
        try {
            // Check connection state
            const connectionState = connection_manager_1.connectionManager.getConnectionState();
            if (!connectionState.isOnline || !connectionState.isFirestoreConnected) {
                console.log('Skipping periodic sync - offline');
                return;
            }
            // Sync offline actions
            await realtime_1.realtimeSyncService.syncOfflineActions();
            // Emit sync completed event
            this.emitEvent('sync:periodic-completed', {
                timestamp: new Date(),
                connectionState,
            });
        }
        catch (error) {
            console.error('Error during periodic sync:', error);
            this.emitEvent('sync:error', { error, timestamp: new Date() });
        }
    }
    /**
     * Stop periodic sync
     */
    stopPeriodicSync() {
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
    getSyncMetrics() {
        const realtimeStatus = realtime_1.realtimeSyncService.getSyncStatus();
        const connectionState = connection_manager_1.connectionManager.getConnectionState();
        const networkQuality = connection_manager_1.connectionManager.getNetworkQuality();
        const pendingConflicts = connection_manager_1.connectionManager.getPendingConflicts();
        return {
            totalSubscriptions: realtimeStatus.activeSubscriptions,
            activeOrderTracking: order_tracking_1.orderTrackingService.getActiveSubscriptionsCount(),
            activeDeliveryTracking: 0, // Would need to track this separately
            pendingOfflineActions: realtime_1.realtimeSyncService.getPendingOfflineActions().length,
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
    getHealthStatus() {
        const metrics = this.getSyncMetrics();
        const issues = [];
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
        let status;
        if (issues.length === 0) {
            status = 'healthy';
        }
        else if (issues.length <= 2) {
            status = 'degraded';
        }
        else {
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
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }
    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    /**
     * Emit event to all listeners
     */
    emitEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                }
                catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    /**
     * Emit data update event
     */
    emitDataUpdate(update) {
        this.emitEvent('data:update', update);
        this.emitEvent(`data:${update.type}:${update.action}`, update);
    }
    // ===========================================
    // CLEANUP
    // ===========================================
    /**
     * Unsubscribe from all real-time updates
     */
    unsubscribeAll() {
        order_tracking_1.orderTrackingService.unsubscribeAll();
        realtime_1.realtimeSyncService.unsubscribeAll();
        console.log('All real-time subscriptions removed');
    }
    /**
     * Cleanup and shutdown the service
     */
    async cleanup() {
        console.log('Cleaning up Real-time Data Sync Service...');
        // Stop periodic sync
        this.stopPeriodicSync();
        // Unsubscribe from all updates
        this.unsubscribeAll();
        // Clear event listeners
        this.eventListeners.clear();
        // Cleanup connection manager
        await connection_manager_1.connectionManager.cleanup();
        this.isInitialized = false;
        console.log('Real-time Data Sync Service cleaned up');
    }
}
exports.RealtimeDataSyncService = RealtimeDataSyncService;
// Export singleton instance
exports.realtimeDataSyncService = RealtimeDataSyncService.getInstance();
// Export utility functions
const initializeRealtimeSync = async (config) => {
    const service = RealtimeDataSyncService.getInstance(config);
    await service.initialize();
    return service;
};
exports.initializeRealtimeSync = initializeRealtimeSync;
const getRealtimeSyncMetrics = () => {
    return exports.realtimeDataSyncService.getSyncMetrics();
};
exports.getRealtimeSyncMetrics = getRealtimeSyncMetrics;
const getRealtimeSyncHealth = () => {
    return exports.realtimeDataSyncService.getHealthStatus();
};
exports.getRealtimeSyncHealth = getRealtimeSyncHealth;
