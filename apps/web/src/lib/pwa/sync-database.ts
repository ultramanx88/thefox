/**
 * Sync Database Manager
 * Handles IndexedDB operations for background sync persistence
 */

export interface SyncDatabaseConfig {
  dbName: string;
  version: number;
  stores: {
    actions: string;
    conflicts: string;
    failed: string;
    history: string;
  };
}

export class SyncDatabase {
  private db: IDBDatabase | null = null;
  private config: SyncDatabaseConfig;

  constructor(config: Partial<SyncDatabaseConfig> = {}) {
    this.config = {
      dbName: 'SyncDatabase',
      version: 1,
      stores: {
        actions: 'sync_actions',
        conflicts: 'sync_conflicts',
        failed: 'sync_failed',
        history: 'sync_history'
      },
      ...config
    };
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Sync database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Store sync action
   */
  async storeAction(action: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.actions], 'readwrite');
      const store = transaction.objectStore(this.config.stores.actions);
      
      const request = store.put(action);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store action: ${request.error?.message}`));
    });
  }

  /**
   * Get all stored actions
   */
  async getAllActions(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.actions], 'readonly');
      const store = transaction.objectStore(this.config.stores.actions);
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get actions: ${request.error?.message}`));
    });
  }

  /**
   * Remove action by ID
   */
  async removeAction(actionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.actions], 'readwrite');
      const store = transaction.objectStore(this.config.stores.actions);
      
      const request = store.delete(actionId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to remove action: ${request.error?.message}`));
    });
  }

  /**
   * Clear all actions
   */
  async clearActions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.actions], 'readwrite');
      const store = transaction.objectStore(this.config.stores.actions);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear actions: ${request.error?.message}`));
    });
  }

  /**
   * Store conflict
   */
  async storeConflict(conflict: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.conflicts], 'readwrite');
      const store = transaction.objectStore(this.config.stores.conflicts);
      
      const request = store.put(conflict);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store conflict: ${request.error?.message}`));
    });
  }

  /**
   * Get conflicts by collection and document ID
   */
  async getConflicts(collection: string, documentId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.conflicts], 'readonly');
      const store = transaction.objectStore(this.config.stores.conflicts);
      const index = store.index('collection_document');
      
      const request = index.getAll([collection, documentId]);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get conflicts: ${request.error?.message}`));
    });
  }

  /**
   * Store failed action
   */
  async storeFailedAction(action: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const failedAction = {
      ...action,
      failedAt: Date.now(),
      id: `failed_${action.id}`
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.failed], 'readwrite');
      const store = transaction.objectStore(this.config.stores.failed);
      
      const request = store.put(failedAction);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store failed action: ${request.error?.message}`));
    });
  }

  /**
   * Get all failed actions
   */
  async getFailedActions(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.failed], 'readonly');
      const store = transaction.objectStore(this.config.stores.failed);
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get failed actions: ${request.error?.message}`));
    });
  }

  /**
   * Store sync history record
   */
  async storeHistoryRecord(record: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.history], 'readwrite');
      const store = transaction.objectStore(this.config.stores.history);
      
      const request = store.put(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store history record: ${request.error?.message}`));
    });
  }

  /**
   * Get sync history within date range
   */
  async getHistory(startDate: Date, endDate: Date): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.stores.history], 'readonly');
      const store = transaction.objectStore(this.config.stores.history);
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.bound(startDate.getTime(), endDate.getTime());
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get history: ${request.error?.message}`));
    });
  }

  /**
   * Clean up old records
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - maxAge;

    // Clean up old history records
    await this.cleanupStore(this.config.stores.history, 'timestamp', cutoffTime);
    
    // Clean up old conflicts
    await this.cleanupStore(this.config.stores.conflicts, 'timestamp', cutoffTime);
    
    // Clean up old failed actions (keep for longer)
    await this.cleanupStore(this.config.stores.failed, 'failedAt', cutoffTime);

    console.log('Database cleanup completed');
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    if (!this.db) throw new Error('Database not initialized');

    const [actions, conflicts, failed, history] = await Promise.all([
      this.getStoreCount(this.config.stores.actions),
      this.getStoreCount(this.config.stores.conflicts),
      this.getStoreCount(this.config.stores.failed),
      this.getStoreCount(this.config.stores.history)
    ]);

    return {
      actions,
      conflicts,
      failed,
      history,
      totalRecords: actions + conflicts + failed + history
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Sync database connection closed');
    }
  }

  // Private helper methods

  private createObjectStores(db: IDBDatabase): void {
    // Actions store
    if (!db.objectStoreNames.contains(this.config.stores.actions)) {
      const actionsStore = db.createObjectStore(this.config.stores.actions, { keyPath: 'id' });
      actionsStore.createIndex('priority', 'priority', { unique: false });
      actionsStore.createIndex('collection', 'collection', { unique: false });
      actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Conflicts store
    if (!db.objectStoreNames.contains(this.config.stores.conflicts)) {
      const conflictsStore = db.createObjectStore(this.config.stores.conflicts, { keyPath: 'id' });
      conflictsStore.createIndex('collection_document', ['collection', 'documentId'], { unique: false });
      conflictsStore.createIndex('timestamp', 'localTimestamp', { unique: false });
    }

    // Failed actions store
    if (!db.objectStoreNames.contains(this.config.stores.failed)) {
      const failedStore = db.createObjectStore(this.config.stores.failed, { keyPath: 'id' });
      failedStore.createIndex('collection', 'collection', { unique: false });
      failedStore.createIndex('failedAt', 'failedAt', { unique: false });
    }

    // History store
    if (!db.objectStoreNames.contains(this.config.stores.history)) {
      const historyStore = db.createObjectStore(this.config.stores.history, { keyPath: 'id' });
      historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      historyStore.createIndex('actionId', 'actionId', { unique: false });
    }

    console.log('Database object stores created');
  }

  private async cleanupStore(storeName: string, indexName: string, cutoffTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(new Error(`Failed to cleanup ${storeName}: ${request.error?.message}`));
    });
  }

  private async getStoreCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to count ${storeName}: ${request.error?.message}`));
    });
  }
}

interface DatabaseStats {
  actions: number;
  conflicts: number;
  failed: number;
  history: number;
  totalRecords: number;
}