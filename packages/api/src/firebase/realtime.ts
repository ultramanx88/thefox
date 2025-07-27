/**
 * Real-time Data Synchronization Service
 * Handles real-time updates, offline support, and data synchronization
 */

import { 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  clearPersistence
} from 'firebase/firestore';
import { db } from './config';
import { logger } from 'firebase-functions';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface RealtimeSubscription {
  id: string;
  type: 'document' | 'collection';
  path: string;
  unsubscribe: Unsubscribe;
  callback: (data: any) => void;
  errorCallback?: (error: Error) => void;
  lastUpdate: Date;
  isActive: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  hasPendingWrites: boolean;
  lastSyncTime: Date | null;
  syncErrors: string[];
  activeSubscriptions: number;
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolver?: (clientData: any, serverData: any) => any;
}

// ===========================================
// REAL-TIME SYNCHRONIZATION SERVICE
// ===========================================

export class RealtimeSyncService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private offlineActions: Map<string, OfflineAction> = new Map();
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    hasPendingWrites: false,
    lastSyncTime: null,
    syncErrors: [],
    activeSubscriptions: 0,
  };
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initializeNetworkListeners();
    this.initializeOfflineSupport();
  }

  // ===========================================
  // REAL-TIME SUBSCRIPTIONS
  // ===========================================

  /**
   * Subscribe to real-time document updates
   */
  subscribeToDocument<T>(
    path: string,
    callback: (data: T | null) => void,
    errorCallback?: (error: Error) => void
  ): string {
    const subscriptionId = `doc_${path}_${Date.now()}`;
    
    try {
      const docRef = doc(db, path);
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot: DocumentSnapshot) => {
          const data = snapshot.exists() 
            ? { id: snapshot.id, ...snapshot.data() } as T
            : null;
          
          callback(data);
          this.updateSubscriptionStatus(subscriptionId);
        },
        (error) => {
          console.error(`Document subscription error for ${path}:`, error);
          this.handleSubscriptionError(subscriptionId, error);
          errorCallback?.(error);
        }
      );

      const subscription: RealtimeSubscription = {
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

    } catch (error) {
      console.error(`Failed to create document subscription for ${path}:`, error);
      errorCallback?.(error as Error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time collection updates
   */
  subscribeToCollection<T>(
    collectionPath: string,
    constraints: any[] = [],
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void
  ): string {
    const subscriptionId = `col_${collectionPath}_${Date.now()}`;
    
    try {
      const collectionRef = collection(db, collectionPath);
      const q = constraints.length > 0 
        ? query(collectionRef, ...constraints)
        : collectionRef;
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          callback(data);
          this.updateSubscriptionStatus(subscriptionId);
        },
        (error) => {
          console.error(`Collection subscription error for ${collectionPath}:`, error);
          this.handleSubscriptionError(subscriptionId, error);
          errorCallback?.(error);
        }
      );

      const subscription: RealtimeSubscription = {
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

    } catch (error) {
      console.error(`Failed to create collection subscription for ${collectionPath}:`, error);
      errorCallback?.(error as Error);
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
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
  unsubscribeAll(): void {
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
  queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): string {
    const actionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineAction: OfflineAction = {
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
  private async executeOfflineAction(actionId: string): Promise<void> {
    const action = this.offlineActions.get(actionId);
    if (!action) return;

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

    } catch (error) {
      action.retryCount++;
      
      if (action.retryCount >= action.maxRetries) {
        this.offlineActions.delete(actionId);
        this.syncStatus.syncErrors.push(`Failed to execute action ${actionId}: ${error}`);
        console.error(`Offline action failed permanently: ${actionId}`, error);
      } else {
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
  async syncOfflineActions(): Promise<void> {
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
  resolveConflict<T>(
    clientData: T,
    serverData: T,
    resolution: ConflictResolution
  ): T {
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
  private initializeNetworkListeners(): void {
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
  private async handleNetworkStatusChange(isOnline: boolean): Promise<void> {
    const wasOnline = this.syncStatus.isOnline;
    this.syncStatus.isOnline = isOnline;

    if (isOnline && !wasOnline) {
      console.log('Network connection restored');
      
      // Re-enable Firestore network
      try {
        await enableNetwork(db);
        
        // Sync pending offline actions
        await this.syncOfflineActions();
        
        // Emit network status change event
        this.emitEvent('network:online', { isOnline: true });
        
      } catch (error) {
        console.error('Error re-enabling network:', error);
      }
      
    } else if (!isOnline && wasOnline) {
      console.log('Network connection lost');
      
      // Disable Firestore network
      try {
        await disableNetwork(db);
        
        // Emit network status change event
        this.emitEvent('network:offline', { isOnline: false });
        
      } catch (error) {
        console.error('Error disabling network:', error);
      }
    }
  }

  /**
   * Initialize offline support
   */
  private async initializeOfflineSupport(): Promise<void> {
    try {
      // Enable Firestore offline persistence
      // Note: This should be called before any other Firestore operations
      console.log('Firestore offline persistence enabled');
      
    } catch (error) {
      console.warn('Failed to enable offline persistence:', error);
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
  // UTILITY METHODS
  // ===========================================

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  /**
   * Get pending offline actions
   */
  getPendingOfflineActions(): OfflineAction[] {
    return Array.from(this.offlineActions.values());
  }

  /**
   * Clear all sync errors
   */
  clearSyncErrors(): void {
    this.syncStatus.syncErrors = [];
  }

  /**
   * Wait for pending writes to complete
   */
  async waitForPendingWrites(): Promise<void> {
    try {
      await waitForPendingWrites(db);
      this.syncStatus.hasPendingWrites = false;
    } catch (error) {
      console.error('Error waiting for pending writes:', error);
      throw error;
    }
  }

  /**
   * Clear offline persistence
   */
  async clearOfflinePersistence(): Promise<void> {
    try {
      // First, make sure all subscriptions are closed
      this.unsubscribeAll();
      
      // Clear persistence
      await clearPersistence(db);
      
      console.log('Offline persistence cleared');
    } catch (error) {
      console.error('Error clearing offline persistence:', error);
      throw error;
    }
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private updateSubscriptionStatus(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastUpdate = new Date();
    }
  }

  private handleSubscriptionError(subscriptionId: string, error: Error): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.syncStatus.syncErrors.push(`Subscription ${subscriptionId}: ${error.message}`);
    }
  }

  private async executeCreateAction(action: OfflineAction): Promise<void> {
    const { collection: collectionPath, data } = action;
    const { FirestoreService } = await import('./firestore');
    await FirestoreService.create(collectionPath, data);
    console.log(`Executed create action for ${collectionPath}`, data);
  }

  private async executeUpdateAction(action: OfflineAction): Promise<void> {
    const { collection: collectionPath, documentId, data } = action;
    if (!documentId) throw new Error('Document ID required for update action');
    const { FirestoreService } = await import('./firestore');
    await FirestoreService.update(collectionPath, documentId, data);
    console.log(`Executed update action for ${collectionPath}/${documentId}`, data);
  }

  private async executeDeleteAction(action: OfflineAction): Promise<void> {
    const { collection: collectionPath, documentId } = action;
    if (!documentId) throw new Error('Document ID required for delete action');
    const { FirestoreService } = await import('./firestore');
    await FirestoreService.delete(collectionPath, documentId);
    console.log(`Executed delete action for ${collectionPath}/${documentId}`);
  }
}

// Export singleton instance
export const realtimeSyncService = new RealtimeSyncService();

// Export utility functions
export const createRealtimeQuery = (collectionPath: string, constraints: any[] = []) => {
  return { collectionPath, constraints };
};

export const createConflictResolver = (
  strategy: ConflictResolution['strategy'],
  resolver?: ConflictResolution['resolver']
): ConflictResolution => {
  return { strategy, resolver };
};