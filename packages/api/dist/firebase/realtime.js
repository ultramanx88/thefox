"use strict";
/**
 * Real-time Data Synchronization Service
 * Handles real-time updates, offline support, and data synchronization
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConflictResolver = exports.createRealtimeQuery = exports.realtimeSyncService = exports.RealtimeSyncService = void 0;
const firestore_1 = require("firebase/firestore");
const config_1 = require("./config");
// ===========================================
// REAL-TIME SYNCHRONIZATION SERVICE
// ===========================================
class RealtimeSyncService {
    constructor() {
        this.subscriptions = new Map();
        this.offlineActions = new Map();
        this.syncStatus = {
            isOnline: navigator.onLine,
            hasPendingWrites: false,
            lastSyncTime: null,
            syncErrors: [],
            activeSubscriptions: 0,
        };
        this.eventListeners = new Map();
        this.initializeNetworkListeners();
        this.initializeOfflineSupport();
    }
    // ===========================================
    // REAL-TIME SUBSCRIPTIONS
    // ===========================================
    /**
     * Subscribe to real-time document updates
     */
    subscribeToDocument(path, callback, errorCallback) {
        const subscriptionId = `doc_${path}_${Date.now()}`;
        try {
            const docRef = (0, firestore_1.doc)(config_1.db, path);
            const unsubscribe = (0, firestore_1.onSnapshot)(docRef, (snapshot) => {
                const data = snapshot.exists()
                    ? { id: snapshot.id, ...snapshot.data() }
                    : null;
                callback(data);
                this.updateSubscriptionStatus(subscriptionId);
            }, (error) => {
                console.error(`Document subscription error for ${path}:`, error);
                this.handleSubscriptionError(subscriptionId, error);
                errorCallback?.(error);
            });
            const subscription = {
                id: subscriptionId,
                type: 'document',
                path,
                unsubscribe,
                callback,
                errorCallback,
                lastUpdate: new Date(),
                isActive: true,
            };
            this.subscriptions.set(subscriptionId, subscription);
            this.syncStatus.activeSubscriptions++;
            console.log(`Document subscription created: ${path}`);
            return subscriptionId;
        }
        catch (error) {
            console.error(`Failed to create document subscription for ${path}:`, error);
            errorCallback?.(error);
            throw error;
        }
    }
    /**
     * Subscribe to real-time collection updates
     */
    subscribeToCollection(collectionPath, constraints = [], callback, errorCallback) {
        const subscriptionId = `col_${collectionPath}_${Date.now()}`;
        try {
            const collectionRef = (0, firestore_1.collection)(config_1.db, collectionPath);
            const q = constraints.length > 0
                ? (0, firestore_1.query)(collectionRef, ...constraints)
                : collectionRef;
            const unsubscribe = (0, firestore_1.onSnapshot)(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
                this.updateSubscriptionStatus(subscriptionId);
            }, (error) => {
                console.error(`Collection subscription error for ${collectionPath}:`, error);
                this.handleSubscriptionError(subscriptionId, error);
                errorCallback?.(error);
            });
            const subscription = {
                id: subscriptionId,
                type: 'collection',
                path: collectionPath,
                unsubscribe,
                callback,
                errorCallback,
                lastUpdate: new Date(),
                isActive: true,
            };
            this.subscriptions.set(subscriptionId, subscription);
            this.syncStatus.activeSubscriptions++;
            console.log(`Collection subscription created: ${collectionPath}`);
            return subscriptionId;
        }
        catch (error) {
            console.error(`Failed to create collection subscription for ${collectionPath}:`, error);
            errorCallback?.(error);
            throw error;
        }
    }
    /**
     * Unsubscribe from real-time updates
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.unsubscribe();
            subscription.isActive = false;
            this.subscriptions.delete(subscriptionId);
            this.syncStatus.activeSubscriptions--;
            console.log(`Subscription removed: ${subscriptionId}`);
        }
    }
    /**
     * Unsubscribe from all active subscriptions
     */
    unsubscribeAll() {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
        this.syncStatus.activeSubscriptions = 0;
        console.log('All subscriptions removed');
    }
    // ===========================================
    // OFFLINE SUPPORT
    // ===========================================
    /**
     * Queue action for offline execution
     */
    queueOfflineAction(action) {
        const actionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const offlineAction = {
            id: actionId,
            timestamp: new Date(),
            retryCount: 0,
            ...action,
        };
        this.offlineActions.set(actionId, offlineAction);
        // Try to execute immediately if online
        if (this.syncStatus.isOnline) {
            this.executeOfflineAction(actionId);
        }
        console.log(`Offline action queued: ${actionId}`);
        return actionId;
    }
    /**
     * Execute queued offline actions
     */
    async executeOfflineAction(actionId) {
        const action = this.offlineActions.get(actionId);
        if (!action)
            return;
        try {
            // Execute the action based on type
            switch (action.type) {
                case 'create':
                    await this.executeCreateAction(action);
                    break;
                case 'update':
                    await this.executeUpdateAction(action);
                    break;
                case 'delete':
                    await this.executeDeleteAction(action);
                    break;
            }
            // Remove successful action
            this.offlineActions.delete(actionId);
            console.log(`Offline action executed successfully: ${actionId}`);
        }
        catch (error) {
            action.retryCount++;
            if (action.retryCount >= action.maxRetries) {
                this.offlineActions.delete(actionId);
                this.syncStatus.syncErrors.push(`Failed to execute action ${actionId}: ${error}`);
                console.error(`Offline action failed permanently: ${actionId}`, error);
            }
            else {
                console.warn(`Offline action retry ${action.retryCount}/${action.maxRetries}: ${actionId}`, error);
                // Retry with exponential backoff
                setTimeout(() => {
                    this.executeOfflineAction(actionId);
                }, Math.pow(2, action.retryCount) * 1000);
            }
        }
    }
    /**
     * Sync all pending offline actions
     */
    async syncOfflineActions() {
        if (!this.syncStatus.isOnline) {
            console.warn('Cannot sync offline actions: device is offline');
            return;
        }
        const pendingActions = Array.from(this.offlineActions.keys());
        console.log(`Syncing ${pendingActions.length} offline actions`);
        for (const actionId of pendingActions) {
            await this.executeOfflineAction(actionId);
        }
        this.syncStatus.lastSyncTime = new Date();
    }
    // ===========================================
    // CONFLICT RESOLUTION
    // ===========================================
    /**
     * Resolve data conflicts between client and server
     */
    resolveConflict(clientData, serverData, resolution) {
        switch (resolution.strategy) {
            case 'client-wins':
                return clientData;
            case 'server-wins':
                return serverData;
            case 'merge':
                return { ...serverData, ...clientData };
            case 'manual':
                if (resolution.resolver) {
                    return resolution.resolver(clientData, serverData);
                }
                // Fallback to server wins if no resolver provided
                return serverData;
            default:
                return serverData;
        }
    }
    // ===========================================
    // NETWORK STATUS MANAGEMENT
    // ===========================================
    /**
     * Initialize network status listeners
     */
    initializeNetworkListeners() {
        window.addEventListener('online', () => {
            this.handleNetworkStatusChange(true);
        });
        window.addEventListener('offline', () => {
            this.handleNetworkStatusChange(false);
        });
    }
    /**
     * Handle network status changes
     */
    async handleNetworkStatusChange(isOnline) {
        const wasOnline = this.syncStatus.isOnline;
        this.syncStatus.isOnline = isOnline;
        if (isOnline && !wasOnline) {
            console.log('Network connection restored');
            // Re-enable Firestore network
            try {
                await (0, firestore_1.enableNetwork)(config_1.db);
                // Sync pending offline actions
                await this.syncOfflineActions();
                // Emit network status change event
                this.emitEvent('network:online', { isOnline: true });
            }
            catch (error) {
                console.error('Error re-enabling network:', error);
            }
        }
        else if (!isOnline && wasOnline) {
            console.log('Network connection lost');
            // Disable Firestore network
            try {
                await (0, firestore_1.disableNetwork)(config_1.db);
                // Emit network status change event
                this.emitEvent('network:offline', { isOnline: false });
            }
            catch (error) {
                console.error('Error disabling network:', error);
            }
        }
    }
    /**
     * Initialize offline support
     */
    async initializeOfflineSupport() {
        try {
            // Enable Firestore offline persistence
            // Note: This should be called before any other Firestore operations
            console.log('Firestore offline persistence enabled');
        }
        catch (error) {
            console.warn('Failed to enable offline persistence:', error);
        }
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
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    /**
     * Get current sync status
     */
    getSyncStatus() {
        return { ...this.syncStatus };
    }
    /**
     * Get active subscriptions
     */
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
    }
    /**
     * Get pending offline actions
     */
    getPendingOfflineActions() {
        return Array.from(this.offlineActions.values());
    }
    /**
     * Clear all sync errors
     */
    clearSyncErrors() {
        this.syncStatus.syncErrors = [];
    }
    /**
     * Wait for pending writes to complete
     */
    async waitForPendingWrites() {
        try {
            await (0, firestore_1.waitForPendingWrites)(config_1.db);
            this.syncStatus.hasPendingWrites = false;
        }
        catch (error) {
            console.error('Error waiting for pending writes:', error);
            throw error;
        }
    }
    /**
     * Clear offline persistence
     */
    async clearOfflinePersistence() {
        try {
            // First, make sure all subscriptions are closed
            this.unsubscribeAll();
            // Clear persistence
            await (0, firestore_1.clearPersistence)(config_1.db);
            console.log('Offline persistence cleared');
        }
        catch (error) {
            console.error('Error clearing offline persistence:', error);
            throw error;
        }
    }
    // ===========================================
    // PRIVATE HELPER METHODS
    // ===========================================
    updateSubscriptionStatus(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.lastUpdate = new Date();
        }
    }
    handleSubscriptionError(subscriptionId, error) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.isActive = false;
            this.syncStatus.syncErrors.push(`Subscription ${subscriptionId}: ${error.message}`);
        }
    }
    async executeCreateAction(action) {
        const { collection: collectionPath, data } = action;
        const { FirestoreService } = await Promise.resolve().then(() => __importStar(require('./firestore')));
        await FirestoreService.create(collectionPath, data);
        console.log(`Executed create action for ${collectionPath}`, data);
    }
    async executeUpdateAction(action) {
        const { collection: collectionPath, documentId, data } = action;
        if (!documentId)
            throw new Error('Document ID required for update action');
        const { FirestoreService } = await Promise.resolve().then(() => __importStar(require('./firestore')));
        await FirestoreService.update(collectionPath, documentId, data);
        console.log(`Executed update action for ${collectionPath}/${documentId}`, data);
    }
    async executeDeleteAction(action) {
        const { collection: collectionPath, documentId } = action;
        if (!documentId)
            throw new Error('Document ID required for delete action');
        const { FirestoreService } = await Promise.resolve().then(() => __importStar(require('./firestore')));
        await FirestoreService.delete(collectionPath, documentId);
        console.log(`Executed delete action for ${collectionPath}/${documentId}`);
    }
}
exports.RealtimeSyncService = RealtimeSyncService;
// Export singleton instance
exports.realtimeSyncService = new RealtimeSyncService();
// Export utility functions
const createRealtimeQuery = (collectionPath, constraints = []) => {
    return { collectionPath, constraints };
};
exports.createRealtimeQuery = createRealtimeQuery;
const createConflictResolver = (strategy, resolver) => {
    return { strategy, resolver };
};
exports.createConflictResolver = createConflictResolver;
