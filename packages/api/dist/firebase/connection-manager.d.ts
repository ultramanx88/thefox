/**
 * Connection State Manager
 * Handles network connectivity, connection state changes, and data conflicts
 */
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
export declare class ConnectionManager {
    private static instance;
    private connectionState;
    private networkQuality;
    private eventListeners;
    private reconnectTimer;
    private heartbeatTimer;
    private conflictQueue;
    private constructor();
    static getInstance(): ConnectionManager;
    /**
     * Initialize network status monitoring
     */
    private initializeNetworkMonitoring;
    /**
     * Update network quality information
     */
    private updateNetworkQuality;
    /**
     * Handle network connectivity changes
     */
    private handleNetworkChange;
    /**
     * Initialize Firestore connection monitoring
     */
    private initializeFirestoreMonitoring;
    /**
     * Enable Firestore network connection
     */
    enableFirestoreNetwork(): Promise<void>;
    /**
     * Disable Firestore network connection
     */
    disableFirestoreNetwork(): Promise<void>;
    /**
     * Wait for all pending writes to complete
     */
    waitForPendingWrites(): Promise<void>;
    /**
     * Handle data conflict
     */
    handleConflict<T>(conflict: ConflictData<T>, strategy?: ConflictResolutionStrategy): Promise<T>;
    /**
     * Merge client and server data
     */
    private mergeData;
    /**
     * Resolve conflict based on timestamp
     */
    private resolveByTimestamp;
    /**
     * Resolve all queued conflicts
     */
    resolveQueuedConflicts(): Promise<void>;
    /**
     * Get pending conflicts
     */
    getPendingConflicts(): ConflictData[];
    /**
     * Attempt to reconnect to Firestore
     */
    attemptReconnection(): Promise<boolean>;
    /**
     * Test Firestore connection
     */
    private testConnection;
    /**
     * Start connection heartbeat
     */
    private startHeartbeat;
    /**
     * Stop heartbeat monitoring
     */
    private stopHeartbeat;
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
     * Get current connection state
     */
    getConnectionState(): ConnectionState;
    /**
     * Get network quality information
     */
    getNetworkQuality(): NetworkQuality | null;
    /**
     * Force reconnection attempt
     */
    forceReconnect(): Promise<boolean>;
    /**
     * Clear all sync errors
     */
    clearSyncErrors(): void;
    /**
     * Reset connection state
     */
    reset(): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare const connectionManager: ConnectionManager;
