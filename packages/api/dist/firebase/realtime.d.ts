/**
 * Real-time Data Synchronization Service
 * Handles real-time updates, offline support, and data synchronization
 */
import { Unsubscribe } from 'firebase/firestore';
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
export declare class RealtimeSyncService {
    private subscriptions;
    private offlineActions;
    private syncStatus;
    private eventListeners;
    constructor();
    /**
     * Subscribe to real-time document updates
     */
    subscribeToDocument<T>(path: string, callback: (data: T | null) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Subscribe to real-time collection updates
     */
    subscribeToCollection<T>(collectionPath: string, constraints: any[], callback: (data: T[]) => void, errorCallback?: (error: Error) => void): string;
    /**
     * Unsubscribe from real-time updates
     */
    unsubscribe(subscriptionId: string): void;
    /**
     * Unsubscribe from all active subscriptions
     */
    unsubscribeAll(): void;
    /**
     * Queue action for offline execution
     */
    queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): string;
    /**
     * Execute queued offline actions
     */
    private executeOfflineAction;
    /**
     * Sync all pending offline actions
     */
    syncOfflineActions(): Promise<void>;
    /**
     * Resolve data conflicts between client and server
     */
    resolveConflict<T>(clientData: T, serverData: T, resolution: ConflictResolution): T;
    /**
     * Initialize network status listeners
     */
    private initializeNetworkListeners;
    /**
     * Handle network status changes
     */
    private handleNetworkStatusChange;
    /**
     * Initialize offline support
     */
    private initializeOfflineSupport;
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
     * Get current sync status
     */
    getSyncStatus(): SyncStatus;
    /**
     * Get active subscriptions
     */
    getActiveSubscriptions(): RealtimeSubscription[];
    /**
     * Get pending offline actions
     */
    getPendingOfflineActions(): OfflineAction[];
    /**
     * Clear all sync errors
     */
    clearSyncErrors(): void;
    /**
     * Wait for pending writes to complete
     */
    waitForPendingWrites(): Promise<void>;
    /**
     * Clear offline persistence
     */
    clearOfflinePersistence(): Promise<void>;
    private updateSubscriptionStatus;
    private handleSubscriptionError;
    private executeCreateAction;
    private executeUpdateAction;
    private executeDeleteAction;
}
export declare const realtimeSyncService: RealtimeSyncService;
export declare const createRealtimeQuery: (collectionPath: string, constraints?: any[]) => {
    collectionPath: string;
    constraints: any[];
};
export declare const createConflictResolver: (strategy: ConflictResolution["strategy"], resolver?: ConflictResolution["resolver"]) => ConflictResolution;
