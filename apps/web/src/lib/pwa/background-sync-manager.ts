/**
 * Scalable Background Sync Manager
 * Handles intelligent queue management for offline actions with batch processing
 * and exponential backoff retry logic
 */

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
  error?: string;
}

export interface SyncConfig {
  batchSize: number;
  processingInterval: number;
  maxRetries: number;
  exponentialBackoff: boolean;
  baseDelay: number;
  maxDelay: number;
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  mergeFunction?: (local: any, remote: any) => any;
}

export class BackgroundSyncManager {
  private queue: OfflineAction[] = [];
  private processing = false;
  private config: SyncConfig;
  private syncDatabase: SyncDatabase;
  private networkMonitor: NetworkMonitor;
  private conflictResolver: ConflictResolver;
  private syncOptimizer: SyncOptimizer;
  private priorityProcessor: PrioritySyncProcessor;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      batchSize: 10,
      processingInterval: 5000,
      maxRetries: 3,
      exponentialBackoff: true,
      baseDelay: 1000,
      maxDelay: 30000,
      priorityWeights: {
        high: 3,
        medium: 2,
        low: 1
      },
      ...config
    };

    this.syncDatabase = new SyncDatabase();
    this.networkMonitor = new NetworkMonitor();
    this.conflictResolver = new ConflictResolver();
    this.syncOptimizer = new SyncOptimizer();
    this.priorityProcessor = new PrioritySyncProcessor();
    this.initializeDatabase();
    this.startProcessing();
  }

  /**
   * Add action to sync queue with intelligent prioritization
   */
  async addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queueAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || this.config.maxRetries
    };

    // Add to memory queue
    this.queue.push(queueAction);
    
    // Persist to IndexedDB
    await this.persistAction(queueAction);
    
    // Sort queue by priority
    this.prioritizeQueue();
    
    console.log(`Added action to sync queue: ${queueAction.type} ${queueAction.collection}`, queueAction);
  }

  /**
   * Process sync queue with batch processing and intelligent retry logic
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    // Check network connectivity
    if (!this.networkMonitor.isOnline()) {
      console.log('Network offline, skipping sync processing');
      return;
    }

    this.processing = true;

    try {
      // Get batch of actions to process
      const batch = this.getBatch();
      
      if (batch.length === 0) {
        this.processing = false;
        return;
      }

      console.log(`Processing sync batch of ${batch.length} actions`);

      // Process batch with bandwidth awareness
      const results = await this.processBatch(batch);
      
      // Handle results and update queue
      await this.handleBatchResults(results);
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get optimal batch size based on network conditions
   */
  private getBatch(): OfflineAction[] {
    const networkSpeed = this.networkMonitor.getConnectionSpeed();
    let batchSize = this.config.batchSize;

    // Adjust batch size based on network conditions
    if (networkSpeed === 'slow') {
      batchSize = Math.max(1, Math.floor(batchSize / 2));
    } else if (networkSpeed === 'fast') {
      batchSize = Math.floor(batchSize * 1.5);
    }

    // Get actions that are ready for retry
    const readyActions = this.queue.filter(action => this.isReadyForRetry(action));
    
    return readyActions.slice(0, batchSize);
  }

  /**
   * Check if action is ready for retry based on exponential backoff
   */
  private isReadyForRetry(action: OfflineAction): boolean {
    if (action.retryCount === 0) return true;
    if (action.retryCount >= action.maxRetries) return false;
    
    if (!action.lastAttempt) return true;

    const delay = this.calculateBackoffDelay(action.retryCount);
    const timeSinceLastAttempt = Date.now() - action.lastAttempt;
    
    return timeSinceLastAttempt >= delay;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.baseDelay;
    }

    const delay = this.config.baseDelay * Math.pow(2, retryCount - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Process batch of actions with conflict detection
   */
  private async processBatch(batch: OfflineAction[]): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    // Optimize batch for bandwidth usage
    const optimizedBatch = await this.syncOptimizer.reduceBandwidthUsage(batch);

    for (const action of optimizedBatch) {
      try {
        // Check for conflicts before processing
        const conflict = await this.conflictResolver.detectConflict(
          action.collection,
          action.data?.id || action.id,
          action.data,
          null, // Would need to fetch remote data
          action.timestamp,
          Date.now()
        );
        
        if (conflict) {
          const resolution = await this.conflictResolver.resolveConflict(conflict);
          if (resolution.action === 'skip') {
            results.push({
              action,
              success: true,
              skipped: true,
              reason: 'Conflict resolved by skipping'
            });
            continue;
          } else if (resolution.action === 'merge') {
            action.data = resolution.resolvedData;
          }
        }

        // Process the action
        const result = await this.processAction(action);
        results.push(result);
        
      } catch (error) {
        results.push({
          action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Process individual action
   */
  private async processAction(action: OfflineAction): Promise<BatchResult> {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (action.type) {
        case 'create':
          result = await this.createDocument(action.collection, action.data);
          break;
        case 'update':
          result = await this.updateDocument(action.collection, action.data);
          break;
        case 'delete':
          result = await this.deleteDocument(action.collection, action.data.id);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      const duration = Date.now() - startTime;
      
      return {
        action,
        success: true,
        result,
        duration
      };
      
    } catch (error) {
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Handle batch processing results
   */
  private async handleBatchResults(results: BatchResult[]): Promise<void> {
    for (const result of results) {
      const actionIndex = this.queue.findIndex(a => a.id === result.action.id);
      
      if (actionIndex === -1) continue;

      if (result.success || result.skipped) {
        // Remove successful action from queue
        this.queue.splice(actionIndex, 1);
        await this.removePersistedAction(result.action.id);
        
        console.log(`Successfully synced action: ${result.action.type} ${result.action.collection}`);
        
      } else {
        // Update retry count and last attempt
        const action = this.queue[actionIndex];
        action.retryCount++;
        action.lastAttempt = Date.now();
        action.error = result.error;
        
        if (action.retryCount >= action.maxRetries) {
          // Move to failed actions or remove
          console.error(`Action failed after ${action.maxRetries} retries:`, action);
          this.queue.splice(actionIndex, 1);
          await this.removePersistedAction(action.id);
          
          // Optionally store in failed actions collection
          await this.storeFailedAction(action);
        } else {
          // Update persisted action
          await this.persistAction(action);
          console.log(`Action retry ${action.retryCount}/${action.maxRetries}: ${action.type} ${action.collection}`);
        }
      }
    }
  }

  /**
   * Prioritize queue based on priority weights and timestamp
   */
  private prioritizeQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by priority weight
      const priorityDiff = this.config.priorityWeights[b.priority] - this.config.priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);

    // Also process when network comes back online
    this.networkMonitor.onOnline(() => {
      setTimeout(() => this.processQueue(), 1000);
    });
  }

  /**
   * Get queue status and statistics
   */
  getQueueStatus(): QueueStatus {
    const priorityCounts = this.queue.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const retryingActions = this.queue.filter(a => a.retryCount > 0).length;
    const readyActions = this.queue.filter(a => this.isReadyForRetry(a)).length;

    return {
      totalActions: this.queue.length,
      readyActions,
      retryingActions,
      priorityCounts,
      processing: this.processing,
      networkOnline: this.networkMonitor.isOnline()
    };
  }

  /**
   * Clear all actions from queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.clearPersistedActions();
    console.log('Sync queue cleared');
  }

  // Database operations
  private async initializeDatabase(): Promise<void> {
    try {
      await this.syncDatabase.initialize();
      
      // Load persisted actions into memory queue
      const persistedActions = await this.syncDatabase.getAllActions();
      this.queue = persistedActions;
      this.prioritizeQueue();
      
      console.log(`Loaded ${persistedActions.length} persisted actions from database`);
    } catch (error) {
      console.error('Failed to initialize sync database:', error);
    }
  }

  private async persistAction(action: OfflineAction): Promise<void> {
    try {
      await this.syncDatabase.storeAction(action);
    } catch (error) {
      console.error('Failed to persist action:', error);
    }
  }

  private async removePersistedAction(actionId: string): Promise<void> {
    try {
      await this.syncDatabase.removeAction(actionId);
    } catch (error) {
      console.error('Failed to remove persisted action:', error);
    }
  }

  private async clearPersistedActions(): Promise<void> {
    try {
      await this.syncDatabase.clearActions();
    } catch (error) {
      console.error('Failed to clear persisted actions:', error);
    }
  }

  private async storeFailedAction(action: OfflineAction): Promise<void> {
    try {
      await this.syncDatabase.storeFailedAction(action);
    } catch (error) {
      console.error('Failed to store failed action:', error);
    }
  }

  // Firebase operations
  private async createDocument(collection: string, data: any): Promise<any> {
    // Implementation for creating document in Firebase
    throw new Error('Not implemented');
  }

  private async updateDocument(collection: string, data: any): Promise<any> {
    // Implementation for updating document in Firebase
    throw new Error('Not implemented');
  }

  private async deleteDocument(collection: string, id: string): Promise<any> {
    // Implementation for deleting document from Firebase
    throw new Error('Not implemented');
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

import { ConflictResolver } from './conflict-resolver';
import { SyncOptimizer } from './sync-optimizer';
import { PrioritySyncProcessor } from './priority-sync-processor';
import { SyncDatabase } from './sync-database';

// Supporting interfaces
interface BatchResult {
  action: OfflineAction;
  success: boolean;
  skipped?: boolean;
  result?: any;
  error?: string;
  reason?: string;
  duration?: number;
}

interface QueueStatus {
  totalActions: number;
  readyActions: number;
  retryingActions: number;
  priorityCounts: Record<string, number>;
  processing: boolean;
  networkOnline: boolean;
}

// Network Monitor class
class NetworkMonitor {
  private online = navigator.onLine;
  private connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium';
  private onlineCallbacks: (() => void)[] = [];

  constructor() {
    this.setupEventListeners();
    this.detectConnectionSpeed();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.online = true;
      this.onlineCallbacks.forEach(callback => callback());
    });

    window.addEventListener('offline', () => {
      this.online = false;
    });
  }

  private detectConnectionSpeed(): void {
    // Use Network Information API if available
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        this.connectionSpeed = 'slow';
      } else if (effectiveType === '3g') {
        this.connectionSpeed = 'medium';
      } else {
        this.connectionSpeed = 'fast';
      }
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    return this.connectionSpeed;
  }

  onOnline(callback: () => void): void {
    this.onlineCallbacks.push(callback);
  }
}