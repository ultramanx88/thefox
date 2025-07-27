/**
 * Conflict Resolution System
 * Handles data synchronization conflicts with intelligent resolution strategies
 */

export interface Conflict {
  id: string;
  actionId: string;
  collection: string;
  documentId: string;
  conflictType: 'data' | 'version' | 'deleted' | 'concurrent';
  localData: any;
  remoteData: any;
  localTimestamp: number;
  remoteTimestamp: number;
  conflictFields: string[];
}

export interface ConflictResolutionStrategy {
  name: string;
  priority: number;
  canResolve: (conflict: Conflict) => boolean;
  resolve: (conflict: Conflict) => Promise<ConflictResolution>;
}

export interface ConflictResolution {
  action: 'skip' | 'merge' | 'overwrite-local' | 'overwrite-remote' | 'manual';
  resolvedData?: any;
  reason: string;
  confidence: number; // 0-1, how confident we are in this resolution
  requiresUserInput?: boolean;
}

export interface MergeRule {
  field: string;
  strategy: 'latest-wins' | 'local-wins' | 'remote-wins' | 'merge-arrays' | 'custom';
  customMerger?: (local: any, remote: any) => any;
}

export class ConflictResolver {
  private strategies: ConflictResolutionStrategy[] = [];
  private mergeRules: Map<string, MergeRule[]> = new Map();
  private conflictHistory: Map<string, Conflict[]> = new Map();

  constructor() {
    this.initializeDefaultStrategies();
    this.initializeDefaultMergeRules();
  }

  /**
   * Detect conflicts between local and remote data
   */
  async detectConflict(
    collection: string,
    documentId: string,
    localData: any,
    remoteData: any,
    localTimestamp: number,
    remoteTimestamp: number
  ): Promise<Conflict | null> {
    // No conflict if remote data doesn't exist
    if (!remoteData) {
      return null;
    }

    // No conflict if local data is newer and no concurrent modifications
    if (localTimestamp > remoteTimestamp && !this.hasConcurrentModifications(collection, documentId)) {
      return null;
    }

    // Detect conflict type and fields
    const conflictType = this.determineConflictType(localData, remoteData, localTimestamp, remoteTimestamp);
    const conflictFields = this.findConflictingFields(localData, remoteData);

    if (conflictType === 'data' && conflictFields.length === 0) {
      return null; // No actual data conflicts
    }

    const conflict: Conflict = {
      id: this.generateConflictId(),
      actionId: `${collection}_${documentId}_${Date.now()}`,
      collection,
      documentId,
      conflictType,
      localData,
      remoteData,
      localTimestamp,
      remoteTimestamp,
      conflictFields
    };

    // Store conflict in history
    this.addToConflictHistory(conflict);

    return conflict;
  }

  /**
   * Resolve conflict using available strategies
   */
  async resolveConflict(conflict: Conflict): Promise<ConflictResolution> {
    // Sort strategies by priority
    const applicableStrategies = this.strategies
      .filter(strategy => strategy.canResolve(conflict))
      .sort((a, b) => b.priority - a.priority);

    if (applicableStrategies.length === 0) {
      return {
        action: 'manual',
        reason: 'No automatic resolution strategy available',
        confidence: 0,
        requiresUserInput: true
      };
    }

    // Try strategies in order of priority
    for (const strategy of applicableStrategies) {
      try {
        const resolution = await strategy.resolve(conflict);
        
        // Log resolution for analytics
        this.logResolution(conflict, resolution, strategy.name);
        
        return resolution;
      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed to resolve conflict:`, error);
        continue;
      }
    }

    // Fallback to manual resolution
    return {
      action: 'manual',
      reason: 'All automatic resolution strategies failed',
      confidence: 0,
      requiresUserInput: true
    };
  }

  /**
   * Merge data using field-specific rules
   */
  mergeData(conflict: Conflict): any {
    const { localData, remoteData, collection } = conflict;
    const mergeRules = this.mergeRules.get(collection) || this.mergeRules.get('default') || [];
    
    const merged = { ...localData };

    for (const field of conflict.conflictFields) {
      const rule = mergeRules.find(r => r.field === field) || 
                   mergeRules.find(r => r.field === '*'); // Wildcard rule

      if (!rule) {
        // Default to latest wins
        if (conflict.remoteTimestamp > conflict.localTimestamp) {
          merged[field] = remoteData[field];
        }
        continue;
      }

      switch (rule.strategy) {
        case 'latest-wins':
          merged[field] = conflict.remoteTimestamp > conflict.localTimestamp 
            ? remoteData[field] 
            : localData[field];
          break;

        case 'local-wins':
          merged[field] = localData[field];
          break;

        case 'remote-wins':
          merged[field] = remoteData[field];
          break;

        case 'merge-arrays':
          if (Array.isArray(localData[field]) && Array.isArray(remoteData[field])) {
            merged[field] = this.mergeArrays(localData[field], remoteData[field]);
          } else {
            merged[field] = remoteData[field]; // Fallback
          }
          break;

        case 'custom':
          if (rule.customMerger) {
            merged[field] = rule.customMerger(localData[field], remoteData[field]);
          }
          break;
      }
    }

    return merged;
  }

  /**
   * Add merge rules for specific collections
   */
  addMergeRules(collection: string, rules: MergeRule[]): void {
    this.mergeRules.set(collection, rules);
  }

  /**
   * Get conflict statistics
   */
  getConflictStats(): ConflictStats {
    const allConflicts = Array.from(this.conflictHistory.values()).flat();
    
    const typeStats = allConflicts.reduce((acc, conflict) => {
      acc[conflict.conflictType] = (acc[conflict.conflictType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const collectionStats = allConflicts.reduce((acc, conflict) => {
      acc[conflict.collection] = (acc[conflict.collection] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConflicts: allConflicts.length,
      typeDistribution: typeStats,
      collectionDistribution: collectionStats,
      averageResolutionTime: this.calculateAverageResolutionTime(),
      successRate: this.calculateSuccessRate()
    };
  }

  // Private methods

  private initializeDefaultStrategies(): void {
    // Timestamp-based strategy
    this.strategies.push({
      name: 'timestamp-based',
      priority: 100,
      canResolve: (conflict) => conflict.localTimestamp !== conflict.remoteTimestamp,
      resolve: async (conflict) => {
        const useRemote = conflict.remoteTimestamp > conflict.localTimestamp;
        return {
          action: useRemote ? 'overwrite-local' : 'overwrite-remote',
          resolvedData: useRemote ? conflict.remoteData : conflict.localData,
          reason: `Using ${useRemote ? 'remote' : 'local'} data based on timestamp`,
          confidence: 0.8
        };
      }
    });

    // Field-level merge strategy
    this.strategies.push({
      name: 'field-merge',
      priority: 90,
      canResolve: (conflict) => conflict.conflictType === 'data' && conflict.conflictFields.length > 0,
      resolve: async (conflict) => {
        const mergedData = this.mergeData(conflict);
        return {
          action: 'merge',
          resolvedData: mergedData,
          reason: 'Merged conflicting fields using field-specific rules',
          confidence: 0.7
        };
      }
    });

    // Deletion conflict strategy
    this.strategies.push({
      name: 'deletion-handling',
      priority: 95,
      canResolve: (conflict) => conflict.conflictType === 'deleted',
      resolve: async (conflict) => {
        // If remote is deleted but local has changes, keep local
        if (!conflict.remoteData && conflict.localData) {
          return {
            action: 'overwrite-remote',
            resolvedData: conflict.localData,
            reason: 'Keeping local changes over remote deletion',
            confidence: 0.6
          };
        }
        
        // If local is deleted but remote has changes, use remote
        if (!conflict.localData && conflict.remoteData) {
          return {
            action: 'overwrite-local',
            resolvedData: conflict.remoteData,
            reason: 'Using remote data over local deletion',
            confidence: 0.6
          };
        }

        return {
          action: 'skip',
          reason: 'Both versions deleted',
          confidence: 1.0
        };
      }
    });

    // User preference strategy (for user-specific data)
    this.strategies.push({
      name: 'user-preference',
      priority: 85,
      canResolve: (conflict) => conflict.collection.includes('user') || conflict.collection.includes('profile'),
      resolve: async (conflict) => {
        // For user data, prefer local changes (user knows best)
        return {
          action: 'overwrite-remote',
          resolvedData: conflict.localData,
          reason: 'Preferring local user data changes',
          confidence: 0.75
        };
      }
    });
  }

  private initializeDefaultMergeRules(): void {
    // Default rules for common patterns
    const defaultRules: MergeRule[] = [
      {
        field: 'updatedAt',
        strategy: 'latest-wins'
      },
      {
        field: 'version',
        strategy: 'latest-wins'
      },
      {
        field: 'tags',
        strategy: 'merge-arrays'
      },
      {
        field: 'categories',
        strategy: 'merge-arrays'
      },
      {
        field: '*', // Wildcard for unspecified fields
        strategy: 'latest-wins'
      }
    ];

    this.mergeRules.set('default', defaultRules);

    // Specific rules for orders
    this.mergeRules.set('orders', [
      {
        field: 'status',
        strategy: 'remote-wins' // Server status is authoritative
      },
      {
        field: 'items',
        strategy: 'remote-wins' // Server item list is authoritative
      },
      {
        field: 'notes',
        strategy: 'local-wins' // User notes should be preserved
      },
      ...defaultRules
    ]);

    // Specific rules for user profiles
    this.mergeRules.set('users', [
      {
        field: 'preferences',
        strategy: 'local-wins' // User preferences should be local
      },
      {
        field: 'settings',
        strategy: 'local-wins'
      },
      {
        field: 'lastLoginAt',
        strategy: 'latest-wins'
      },
      ...defaultRules
    ]);
  }

  private determineConflictType(
    localData: any,
    remoteData: any,
    localTimestamp: number,
    remoteTimestamp: number
  ): Conflict['conflictType'] {
    if (!localData && !remoteData) return 'deleted';
    if (!localData || !remoteData) return 'deleted';
    
    // Check for concurrent modifications (both modified around the same time)
    const timeDiff = Math.abs(localTimestamp - remoteTimestamp);
    if (timeDiff < 5000) { // 5 seconds threshold
      return 'concurrent';
    }

    return 'data';
  }

  private findConflictingFields(localData: any, remoteData: any): string[] {
    const conflictFields: string[] = [];
    const allFields = new Set([...Object.keys(localData || {}), ...Object.keys(remoteData || {})]);

    for (const field of allFields) {
      if (field === 'updatedAt' || field === 'version') continue; // Skip metadata fields
      
      const localValue = localData?.[field];
      const remoteValue = remoteData?.[field];

      if (!this.deepEqual(localValue, remoteValue)) {
        conflictFields.push(field);
      }
    }

    return conflictFields;
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => this.deepEqual(item, b[index]));
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  }

  private mergeArrays(localArray: any[], remoteArray: any[]): any[] {
    // Simple merge strategy: combine and deduplicate
    const combined = [...localArray, ...remoteArray];
    
    // Remove duplicates based on id field if available
    if (combined.length > 0 && typeof combined[0] === 'object' && combined[0].id) {
      const seen = new Set();
      return combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    }
    
    // For primitive arrays, use Set to remove duplicates
    return Array.from(new Set(combined));
  }

  private hasConcurrentModifications(collection: string, documentId: string): boolean {
    // Check if there are recent conflicts for this document
    const key = `${collection}:${documentId}`;
    const conflicts = this.conflictHistory.get(key) || [];
    
    const recentConflicts = conflicts.filter(
      conflict => Date.now() - conflict.localTimestamp < 60000 // 1 minute
    );
    
    return recentConflicts.length > 0;
  }

  private addToConflictHistory(conflict: Conflict): void {
    const key = `${conflict.collection}:${conflict.documentId}`;
    const conflicts = this.conflictHistory.get(key) || [];
    conflicts.push(conflict);
    
    // Keep only recent conflicts (last 100 or last 24 hours)
    const filtered = conflicts
      .filter(c => Date.now() - c.localTimestamp < 24 * 60 * 60 * 1000)
      .slice(-100);
    
    this.conflictHistory.set(key, filtered);
  }

  private logResolution(conflict: Conflict, resolution: ConflictResolution, strategyName: string): void {
    console.log(`Conflict resolved using ${strategyName}:`, {
      conflictId: conflict.id,
      collection: conflict.collection,
      documentId: conflict.documentId,
      resolution: resolution.action,
      confidence: resolution.confidence,
      reason: resolution.reason
    });
  }

  private calculateAverageResolutionTime(): number {
    // Placeholder - would track actual resolution times
    return 0;
  }

  private calculateSuccessRate(): number {
    // Placeholder - would track resolution success rates
    return 0;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface ConflictStats {
  totalConflicts: number;
  typeDistribution: Record<string, number>;
  collectionDistribution: Record<string, number>;
  averageResolutionTime: number;
  successRate: number;
}