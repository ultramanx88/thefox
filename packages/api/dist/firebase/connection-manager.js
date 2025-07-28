"use strict";
/**
 * Connection State Manager
 * Handles network connectivity, connection state changes, and data conflicts
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
exports.connectionManager = exports.ConnectionManager = void 0;
const firestore_1 = require("firebase/firestore");
const config_1 = require("./config");
const realtime_1 = require("./realtime");
// ===========================================
// CONNECTION MANAGER
// ===========================================
class ConnectionManager {
    constructor() {
        this.networkQuality = null;
        this.eventListeners = new Map();
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.conflictQueue = new Map();
        this.connectionState = {
            isOnline: navigator.onLine,
            isFirestoreConnected: true,
            lastConnectedAt: new Date(),
            lastDisconnectedAt: null,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            pendingWrites: 0,
            syncErrors: [],
        };
        this.initializeNetworkMonitoring();
        this.initializeFirestoreMonitoring();
        this.startHeartbeat();
    }
    static getInstance() {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }
    // ===========================================
    // NETWORK MONITORING
    // ===========================================
    /**
     * Initialize network status monitoring
     */
    initializeNetworkMonitoring() {
        // Basic online/offline detection
        window.addEventListener('online', () => {
            this.handleNetworkChange(true);
        });
        window.addEventListener('offline', () => {
            this.handleNetworkChange(false);
        });
        // Network quality monitoring (if supported)
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.updateNetworkQuality();
            connection.addEventListener('change', () => {
                this.updateNetworkQuality();
            });
        }
        console.log('Network monitoring initialized');
    }
    /**
     * Update network quality information
     */
    updateNetworkQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.networkQuality = {
                type: connection.type || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
            };
            this.emitEvent('network:quality-change', this.networkQuality);
            console.log('Network quality updated:', this.networkQuality);
        }
    }
    /**
     * Handle network connectivity changes
     */
    async handleNetworkChange(isOnline) {
        const wasOnline = this.connectionState.isOnline;
        this.connectionState.isOnline = isOnline;
        if (isOnline && !wasOnline) {
            // Network restored
            this.connectionState.lastConnectedAt = new Date();
            this.connectionState.reconnectAttempts = 0;
            console.log('Network connection restored');
            try {
                // Re-enable Firestore network
                await this.enableFirestoreNetwork();
                // Sync pending offline actions
                await realtime_1.realtimeSyncService.syncOfflineActions();
                // Resolve any pending conflicts
                await this.resolveQueuedConflicts();
                this.emitEvent('connection:restored', {
                    timestamp: new Date(),
                    wasOfflineFor: this.connectionState.lastDisconnectedAt
                        ? Date.now() - this.connectionState.lastDisconnectedAt.getTime()
                        : 0
                });
            }
            catch (error) {
                console.error('Error handling network restoration:', error);
                this.connectionState.syncErrors.push(`Network restoration error: ${error}`);
            }
        }
        else if (!isOnline && wasOnline) {
            // Network lost
            this.connectionState.lastDisconnectedAt = new Date();
            console.log('Network connection lost');
            try {
                // Wait for pending writes before going offline
                await this.waitForPendingWrites();
                // Disable Firestore network
                await this.disableFirestoreNetwork();
                this.emitEvent('connection:lost', {
                    timestamp: new Date(),
                    pendingWrites: this.connectionState.pendingWrites
                });
            }
            catch (error) {
                console.error('Error handling network loss:', error);
                this.connectionState.syncErrors.push(`Network loss error: ${error}`);
            }
        }
    }
    // ===========================================
    // FIRESTORE CONNECTION MANAGEMENT
    // ===========================================
    /**
     * Initialize Firestore connection monitoring
     */
    initializeFirestoreMonitoring() {
        // Monitor Firestore connection state through snapshot listeners
        // This is a simplified approach - in production you might want more sophisticated monitoring
        console.log('Firestore monitoring initialized');
    }
    /**
     * Enable Firestore network connection
     */
    async enableFirestoreNetwork() {
        try {
            await (0, firestore_1.enableNetwork)(config_1.db);
            this.connectionState.isFirestoreConnected = true;
            console.log('Firestore network enabled');
        }
        catch (error) {
            console.error('Failed to enable Firestore network:', error);
            this.connectionState.isFirestoreConnected = false;
            throw error;
        }
    }
    /**
     * Disable Firestore network connection
     */
    async disableFirestoreNetwork() {
        try {
            await (0, firestore_1.disableNetwork)(config_1.db);
            this.connectionState.isFirestoreConnected = false;
            console.log('Firestore network disabled');
        }
        catch (error) {
            console.error('Failed to disable Firestore network:', error);
            throw error;
        }
    }
    /**
     * Wait for all pending writes to complete
     */
    async waitForPendingWrites() {
        try {
            await (0, firestore_1.waitForPendingWrites)(config_1.db);
            this.connectionState.pendingWrites = 0;
            console.log('All pending writes completed');
        }
        catch (error) {
            console.error('Error waiting for pending writes:', error);
            throw error;
        }
    }
    // ===========================================
    // CONFLICT RESOLUTION
    // ===========================================
    /**
     * Handle data conflict
     */
    async handleConflict(conflict, strategy = { strategy: 'server-wins' }) {
        console.log(`Handling conflict for ${conflict.collection}/${conflict.documentId}`, conflict);
        let resolvedData;
        switch (strategy.strategy) {
            case 'client-wins':
                resolvedData = conflict.clientData;
                break;
            case 'server-wins':
                resolvedData = conflict.serverData;
                break;
            case 'merge':
                resolvedData = this.mergeData(conflict.clientData, conflict.serverData);
                break;
            case 'timestamp-based':
                resolvedData = this.resolveByTimestamp(conflict);
                break;
            case 'manual':
                if (strategy.customResolver) {
                    resolvedData = strategy.customResolver(conflict);
                }
                else {
                    // Queue for manual resolution
                    this.conflictQueue.set(`${conflict.collection}/${conflict.documentId}`, conflict);
                    this.emitEvent('conflict:manual-resolution-required', conflict);
                    return conflict.serverData; // Fallback to server data
                }
                break;
            default:
                resolvedData = conflict.serverData;
        }
        // Apply the resolved data
        try {
            const { FirestoreService } = await Promise.resolve().then(() => __importStar(require('./firestore')));
            await FirestoreService.update(conflict.collection, conflict.documentId, resolvedData);
            this.emitEvent('conflict:resolved', {
                conflict,
                resolvedData,
                strategy: strategy.strategy
            });
            console.log(`Conflict resolved using ${strategy.strategy} strategy`);
            return resolvedData;
        }
        catch (error) {
            console.error('Error applying conflict resolution:', error);
            throw error;
        }
    }
    /**
     * Merge client and server data
     */
    mergeData(clientData, serverData) {
        if (typeof clientData === 'object' && typeof serverData === 'object') {
            return { ...serverData, ...clientData };
        }
        return clientData;
    }
    /**
     * Resolve conflict based on timestamp
     */
    resolveByTimestamp(conflict) {
        const clientTimestamp = conflict.clientData?.updatedAt || conflict.timestamp;
        const serverTimestamp = conflict.serverData?.updatedAt || new Date(0);
        return clientTimestamp > serverTimestamp ? conflict.clientData : conflict.serverData;
    }
    /**
     * Resolve all queued conflicts
     */
    async resolveQueuedConflicts() {
        if (this.conflictQueue.size === 0)
            return;
        console.log(`Resolving ${this.conflictQueue.size} queued conflicts`);
        for (const [key, conflict] of this.conflictQueue.entries()) {
            try {
                await this.handleConflict(conflict);
                this.conflictQueue.delete(key);
            }
            catch (error) {
                console.error(`Failed to resolve conflict for ${key}:`, error);
            }
        }
    }
    /**
     * Get pending conflicts
     */
    getPendingConflicts() {
        return Array.from(this.conflictQueue.values());
    }
    // ===========================================
    // RECONNECTION LOGIC
    // ===========================================
    /**
     * Attempt to reconnect to Firestore
     */
    async attemptReconnection() {
        if (this.connectionState.reconnectAttempts >= this.connectionState.maxReconnectAttempts) {
            console.warn('Max reconnection attempts reached');
            return false;
        }
        this.connectionState.reconnectAttempts++;
        try {
            console.log(`Reconnection attempt ${this.connectionState.reconnectAttempts}/${this.connectionState.maxReconnectAttempts}`);
            await this.enableFirestoreNetwork();
            // Test connection with a simple read
            await this.testConnection();
            this.connectionState.reconnectAttempts = 0;
            this.emitEvent('connection:reconnected', {
                attempts: this.connectionState.reconnectAttempts,
                timestamp: new Date()
            });
            return true;
        }
        catch (error) {
            console.error(`Reconnection attempt ${this.connectionState.reconnectAttempts} failed:`, error);
            // Schedule next attempt with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
            this.reconnectTimer = setTimeout(() => {
                this.attemptReconnection();
            }, delay);
            return false;
        }
    }
    /**
     * Test Firestore connection
     */
    async testConnection() {
        const { FirestoreService } = await Promise.resolve().then(() => __importStar(require('./firestore')));
        // Try to read a system document or create a test document
        await FirestoreService.read('system', 'connection-test');
    }
    // ===========================================
    // HEARTBEAT MONITORING
    // ===========================================
    /**
     * Start connection heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(async () => {
            if (this.connectionState.isOnline && this.connectionState.isFirestoreConnected) {
                try {
                    await this.testConnection();
                }
                catch (error) {
                    console.warn('Heartbeat failed, connection may be unstable:', error);
                    this.connectionState.isFirestoreConnected = false;
                    // Attempt reconnection
                    this.attemptReconnection();
                }
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Stop heartbeat monitoring
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
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
    // PUBLIC API
    // ===========================================
    /**
     * Get current connection state
     */
    getConnectionState() {
        return { ...this.connectionState };
    }
    /**
     * Get network quality information
     */
    getNetworkQuality() {
        return this.networkQuality;
    }
    /**
     * Force reconnection attempt
     */
    async forceReconnect() {
        this.connectionState.reconnectAttempts = 0;
        return this.attemptReconnection();
    }
    /**
     * Clear all sync errors
     */
    clearSyncErrors() {
        this.connectionState.syncErrors = [];
    }
    /**
     * Reset connection state
     */
    async reset() {
        // Stop timers
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopHeartbeat();
        // Clear queues
        this.conflictQueue.clear();
        // Reset state
        this.connectionState.reconnectAttempts = 0;
        this.connectionState.syncErrors = [];
        // Restart monitoring
        this.startHeartbeat();
        console.log('Connection manager reset');
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.eventListeners.clear();
        this.conflictQueue.clear();
        try {
            await (0, firestore_1.terminate)(config_1.db);
        }
        catch (error) {
            console.warn('Error terminating Firestore:', error);
        }
        console.log('Connection manager cleaned up');
    }
}
exports.ConnectionManager = ConnectionManager;
// Export singleton instance
exports.connectionManager = ConnectionManager.getInstance();
