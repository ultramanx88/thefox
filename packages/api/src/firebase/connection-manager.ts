/**
 * Connection State Manager
 * Handles network connectivity, connection state changes, and data conflicts
 */

import { 
  enableNetwork, 
  disableNetwork, 
  waitForPendingWrites,
  clearPersistence,
  terminate,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from './config';
import { realtimeSyncService } from './realtime';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface ConnectionState {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  pendingWrites: number;
  syncErrors: string[];
}

export interface NetworkQuality {
  type: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export interface ConflictData<T = any> {
  documentId: string;
  collection: string;
  clientData: T;
  serverData: T;
  timestamp: Date;
  conflictType: 'update' | 'delete' | 'create';
}

export interface ConflictResolutionStrategy {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual' | 'timestamp-based';
  customResolver?: <T>(conflict: ConflictData<T>) => T;
}

// ===========================================
// CONNECTION MANAGER
// ===========================================

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connectionState: ConnectionState;
  private networkQuality: NetworkQuality | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private conflictQueue: Map<string, ConflictData> = new Map();

  private constructor() {
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

  static getInstance(): ConnectionManager {
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
  private initializeNetworkMonitoring(): void {
    // Basic online/offline detection
    window.addEventListener('online', () => {
      this.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false);
    });

    // Network quality monitoring (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
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
  private updateNetworkQuality(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
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
  private async handleNetworkChange(isOnline: boolean): Promise<void> {
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
        await realtimeSyncService.syncOfflineActions();
        
        // Resolve any pending conflicts
        await this.resolveQueuedConflicts();
        
        this.emitEvent('connection:restored', {
          timestamp: new Date(),
          wasOfflineFor: this.connectionState.lastDisconnectedAt 
            ? Date.now() - this.connectionState.lastDisconnectedAt.getTime()
            : 0
        });
        
      } catch (error) {
        console.error('Error handling network restoration:', error);
        this.connectionState.syncErrors.push(`Network restoration error: ${error}`);
      }
      
    } else if (!isOnline && wasOnline) {
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
        
      } catch (error) {
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
  private initializeFirestoreMonitoring(): void {
    // Monitor Firestore connection state through snapshot listeners
    // This is a simplified approach - in production you might want more sophisticated monitoring
    console.log('Firestore monitoring initialized');
  }

  /**
   * Enable Firestore network connection
   */
  async enableFirestoreNetwork(): Promise<void> {
    try {
      await enableNetwork(db);
      this.connectionState.isFirestoreConnected = true;
      console.log('Firestore network enabled');
    } catch (error) {
      console.error('Failed to enable Firestore network:', error);
      this.connectionState.isFirestoreConnected = false;
      throw error;
    }
  }

  /**
   * Disable Firestore network connection
   */
  async disableFirestoreNetwork(): Promise<void> {
    try {
      await disableNetwork(db);
      this.connectionState.isFirestoreConnected = false;
      console.log('Firestore network disabled');
    } catch (error) {
      console.error('Failed to disable Firestore network:', error);
      throw error;
    }
  }

  /**
   * Wait for all pending writes to complete
   */
  async waitForPendingWrites(): Promise<void> {
    try {
      await waitForPendingWrites(db);
      this.connectionState.pendingWrites = 0;
      console.log('All pending writes completed');
    } catch (error) {
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
  async handleConflict<T>(
    conflict: ConflictData<T>,
    strategy: ConflictResolutionStrategy = { strategy: 'server-wins' }
  ): Promise<T> {
    console.log(`Handling conflict for ${conflict.collection}/${conflict.documentId}`, conflict);

    let resolvedData: T;

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
        } else {
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
      const { FirestoreService } = await import('./firestore');
      await FirestoreService.update(conflict.collection, conflict.documentId, resolvedData);
      
      this.emitEvent('conflict:resolved', {
        conflict,
        resolvedData,
        strategy: strategy.strategy
      });

      console.log(`Conflict resolved using ${strategy.strategy} strategy`);
      return resolvedData;

    } catch (error) {
      console.error('Error applying conflict resolution:', error);
      throw error;
    }
  }

  /**
   * Merge client and server data
   */
  private mergeData<T>(clientData: T, serverData: T): T {
    if (typeof clientData === 'object' && typeof serverData === 'object') {
      return { ...serverData, ...clientData };
    }
    return clientData;
  }

  /**
   * Resolve conflict based on timestamp
   */
  private resolveByTimestamp<T>(conflict: ConflictData<T>): T {
    const clientTimestamp = (conflict.clientData as any)?.updatedAt || conflict.timestamp;
    const serverTimestamp = (conflict.serverData as any)?.updatedAt || new Date(0);

    return clientTimestamp > serverTimestamp ? conflict.clientData : conflict.serverData;
  }

  /**
   * Resolve all queued conflicts
   */
  async resolveQueuedConflicts(): Promise<void> {
    if (this.conflictQueue.size === 0) return;

    console.log(`Resolving ${this.conflictQueue.size} queued conflicts`);

    for (const [key, conflict] of this.conflictQueue.entries()) {
      try {
        await this.handleConflict(conflict);
        this.conflictQueue.delete(key);
      } catch (error) {
        console.error(`Failed to resolve conflict for ${key}:`, error);
      }
    }
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): ConflictData[] {
    return Array.from(this.conflictQueue.values());
  }

  // ===========================================
  // RECONNECTION LOGIC
  // ===========================================

  /**
   * Attempt to reconnect to Firestore
   */
  async attemptReconnection(): Promise<boolean> {
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

    } catch (error) {
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
  private async testConnection(): Promise<void> {
    const { FirestoreService } = await import('./firestore');
    // Try to read a system document or create a test document
    await FirestoreService.read('system', 'connection-test');
  }

  // ===========================================
  // HEARTBEAT MONITORING
  // ===========================================

  /**
   * Start connection heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (this.connectionState.isOnline && this.connectionState.isFirestoreConnected) {
        try {
          await this.testConnection();
        } catch (error) {
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
  private stopHeartbeat(): void {
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

  // ===========================================
  // PUBLIC API
  // ===========================================

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get network quality information
   */
  getNetworkQuality(): NetworkQuality | null {
    return this.networkQuality;
  }

  /**
   * Force reconnection attempt
   */
  async forceReconnect(): Promise<boolean> {
    this.connectionState.reconnectAttempts = 0;
    return this.attemptReconnection();
  }

  /**
   * Clear all sync errors
   */
  clearSyncErrors(): void {
    this.connectionState.syncErrors = [];
  }

  /**
   * Reset connection state
   */
  async reset(): Promise<void> {
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
  async cleanup(): Promise<void> {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.eventListeners.clear();
    this.conflictQueue.clear();
    
    try {
      await terminate(db);
    } catch (error) {
      console.warn('Error terminating Firestore:', error);
    }
    
    console.log('Connection manager cleaned up');
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();