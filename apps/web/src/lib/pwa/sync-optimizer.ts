/**
 * Sync Optimizer
 * Implements bandwidth-aware sync optimization and intelligent scheduling
 */

export interface NetworkConditions {
  connectionType: string;
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // milliseconds
  saveData: boolean;
}

export interface SyncOptimizationConfig {
  minBandwidthThreshold: number; // Mbps
  maxConcurrentSyncs: number;
  priorityThresholds: {
    high: number; // seconds to wait before syncing high priority
    medium: number;
    low: number;
  };
  compressionEnabled: boolean;
  batchingEnabled: boolean;
  adaptiveScheduling: boolean;
}

export interface SyncSchedule {
  immediate: string[]; // Action IDs to sync immediately
  delayed: Array<{
    actionId: string;
    delay: number;
    reason: string;
  }>;
  deferred: Array<{
    actionId: string;
    deferUntil: 'better-network' | 'wifi' | 'charging';
    reason: string;
  }>;
}

export class SyncOptimizer {
  private config: SyncOptimizationConfig;
  private networkMonitor: NetworkConditionsMonitor;
  private syncHistory: SyncHistoryTracker;
  private currentSyncs = new Set<string>();

  constructor(config: Partial<SyncOptimizationConfig> = {}) {
    this.config = {
      minBandwidthThreshold: 0.5, // 500 kbps
      maxConcurrentSyncs: 3,
      priorityThresholds: {
        high: 0, // Sync immediately
        medium: 30, // Wait 30 seconds
        low: 300 // Wait 5 minutes
      },
      compressionEnabled: true,
      batchingEnabled: true,
      adaptiveScheduling: true,
      ...config
    };

    this.networkMonitor = new NetworkConditionsMonitor();
    this.syncHistory = new SyncHistoryTracker();
  }

  /**
   * Optimize sync schedule based on network conditions and priorities
   */
  optimizeSyncSchedule(actions: any[]): SyncSchedule {
    const networkConditions = this.networkMonitor.getCurrentConditions();
    const schedule: SyncSchedule = {
      immediate: [],
      delayed: [],
      deferred: []
    };

    // Check if we should defer all syncs due to poor conditions
    if (this.shouldDeferAllSyncs(networkConditions)) {
      actions.forEach(action => {
        schedule.deferred.push({
          actionId: action.id,
          deferUntil: 'better-network',
          reason: 'Poor network conditions detected'
        });
      });
      return schedule;
    }

    // Sort actions by priority and age
    const sortedActions = this.sortActionsByPriority(actions);

    for (const action of sortedActions) {
      const optimization = this.optimizeAction(action, networkConditions);
      
      switch (optimization.decision) {
        case 'immediate':
          if (this.canSyncImmediately()) {
            schedule.immediate.push(action.id);
          } else {
            schedule.delayed.push({
              actionId: action.id,
              delay: 1000, // 1 second delay
              reason: 'Too many concurrent syncs'
            });
          }
          break;

        case 'delayed':
          schedule.delayed.push({
            actionId: action.id,
            delay: optimization.delay || 30000,
            reason: optimization.reason || 'Optimizing for network conditions'
          });
          break;

        case 'deferred':
          schedule.deferred.push({
            actionId: action.id,
            deferUntil: optimization.deferUntil || 'better-network',
            reason: optimization.reason || 'Waiting for better conditions'
          });
          break;
      }
    }

    return schedule;
  }

  /**
   * Optimize individual action based on various factors
   */
  private optimizeAction(action: any, networkConditions: NetworkConditions): ActionOptimization {
    const actionSize = this.estimateActionSize(action);
    const priority = action.priority;
    const age = Date.now() - action.timestamp;

    // High priority actions with small size - sync immediately
    if (priority === 'high' && actionSize < 10000) { // 10KB
      return {
        decision: 'immediate',
        reason: 'High priority small action'
      };
    }

    // Check network conditions
    if (networkConditions.saveData && actionSize > 50000) { // 50KB
      return {
        decision: 'deferred',
        deferUntil: 'wifi',
        reason: 'Large action deferred due to data saver mode'
      };
    }

    // Slow network conditions
    if (networkConditions.effectiveType === 'slow-2g' || networkConditions.effectiveType === '2g') {
      if (priority === 'low') {
        return {
          decision: 'deferred',
          deferUntil: 'better-network',
          reason: 'Low priority action deferred on slow network'
        };
      }
      
      if (actionSize > 20000) { // 20KB
        return {
          decision: 'delayed',
          delay: 60000, // 1 minute
          reason: 'Large action delayed on slow network'
        };
      }
    }

    // Age-based optimization
    const priorityThreshold = this.config.priorityThresholds[priority] * 1000;
    if (age < priorityThreshold) {
      return {
        decision: 'delayed',
        delay: priorityThreshold - age,
        reason: `Waiting for priority threshold (${priority})`
      };
    }

    // Battery optimization
    if (this.isBatteryLow() && priority === 'low') {
      return {
        decision: 'deferred',
        deferUntil: 'charging',
        reason: 'Low priority action deferred due to low battery'
      };
    }

    // Default to immediate if no optimization needed
    return {
      decision: 'immediate',
      reason: 'No optimization needed'
    };
  }

  /**
   * Reduce bandwidth usage through various techniques
   */
  async reduceBandwidthUsage(actions: any[]): Promise<any[]> {
    let optimizedActions = [...actions];

    // 1. Compress action data
    if (this.config.compressionEnabled) {
      optimizedActions = await this.compressActions(optimizedActions);
    }

    // 2. Batch similar actions
    if (this.config.batchingEnabled) {
      optimizedActions = this.batchSimilarActions(optimizedActions);
    }

    // 3. Remove redundant actions
    optimizedActions = this.removeRedundantActions(optimizedActions);

    // 4. Delta sync for updates
    optimizedActions = await this.applyDeltaSync(optimizedActions);

    return optimizedActions;
  }

  /**
   * Prioritize critical sync operations
   */
  prioritizeCriticalSync(actions: any[]): any[] {
    const criticalCollections = ['orders', 'payments', 'user_sessions'];
    const criticalActions = ['create', 'update'];

    return actions.sort((a, b) => {
      // Critical collection and action type
      const aIsCritical = criticalCollections.includes(a.collection) && 
                         criticalActions.includes(a.type);
      const bIsCritical = criticalCollections.includes(b.collection) && 
                         criticalActions.includes(b.type);

      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;

      // Priority level
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Age (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): OptimizationStats {
    const history = this.syncHistory.getRecentHistory();
    
    return {
      totalSyncs: history.length,
      averageSyncTime: this.calculateAverageSyncTime(history),
      bandwidthSaved: this.calculateBandwidthSaved(history),
      successRate: this.calculateSuccessRate(history),
      networkConditions: this.networkMonitor.getCurrentConditions(),
      currentConcurrentSyncs: this.currentSyncs.size,
      optimizationEffectiveness: this.calculateOptimizationEffectiveness(history)
    };
  }

  // Private helper methods

  private shouldDeferAllSyncs(conditions: NetworkConditions): boolean {
    // Defer if extremely poor network conditions
    if (conditions.effectiveType === 'slow-2g' && conditions.downlink < 0.1) {
      return true;
    }

    // Defer if data saver is on and network is slow
    if (conditions.saveData && conditions.downlink < this.config.minBandwidthThreshold) {
      return true;
    }

    return false;
  }

  private sortActionsByPriority(actions: any[]): any[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return actions.sort((a, b) => {
      // Priority first
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by age (older first)
      return a.timestamp - b.timestamp;
    });
  }

  private canSyncImmediately(): boolean {
    return this.currentSyncs.size < this.config.maxConcurrentSyncs;
  }

  private estimateActionSize(action: any): number {
    // Rough estimation based on JSON string length
    try {
      return JSON.stringify(action.data).length;
    } catch {
      return 1000; // Default estimate
    }
  }

  private isBatteryLow(): boolean {
    // Use Battery API if available
    if ('getBattery' in navigator) {
      // This would need to be implemented with proper battery API usage
      return false; // Placeholder
    }
    return false;
  }

  private async compressActions(actions: any[]): Promise<any[]> {
    // Implement compression logic
    // For now, just remove unnecessary fields
    return actions.map(action => ({
      ...action,
      data: this.removeUnnecessaryFields(action.data)
    }));
  }

  private removeUnnecessaryFields(data: any): any {
    const unnecessaryFields = ['_temp', '_cache', '_ui', 'clientMetadata'];
    const cleaned = { ...data };
    
    unnecessaryFields.forEach(field => {
      delete cleaned[field];
    });
    
    return cleaned;
  }

  private batchSimilarActions(actions: any[]): any[] {
    const batches = new Map<string, any[]>();
    
    // Group actions by collection and type
    actions.forEach(action => {
      const key = `${action.collection}:${action.type}`;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(action);
    });

    const batchedActions: any[] = [];
    
    batches.forEach((actionGroup, key) => {
      if (actionGroup.length > 1 && this.canBatchActions(actionGroup)) {
        // Create a batch action
        batchedActions.push(this.createBatchAction(actionGroup));
      } else {
        // Add individual actions
        batchedActions.push(...actionGroup);
      }
    });

    return batchedActions;
  }

  private canBatchActions(actions: any[]): boolean {
    // Only batch if all actions are of the same type and collection
    const firstAction = actions[0];
    return actions.every(action => 
      action.type === firstAction.type && 
      action.collection === firstAction.collection &&
      action.type !== 'delete' // Don't batch deletes for safety
    );
  }

  private createBatchAction(actions: any[]): any {
    const firstAction = actions[0];
    
    return {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'batch',
      collection: firstAction.collection,
      batchType: firstAction.type,
      data: {
        actions: actions.map(a => ({ id: a.id, data: a.data }))
      },
      timestamp: Date.now(),
      priority: this.getHighestPriority(actions),
      retryCount: 0,
      maxRetries: firstAction.maxRetries
    };
  }

  private getHighestPriority(actions: any[]): 'high' | 'medium' | 'low' {
    const priorities = actions.map(a => a.priority);
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  private removeRedundantActions(actions: any[]): any[] {
    const seen = new Map<string, any>();
    const result: any[] = [];

    // Process actions in reverse chronological order (newest first)
    const sortedActions = actions.sort((a, b) => b.timestamp - a.timestamp);

    for (const action of sortedActions) {
      const key = `${action.collection}:${action.data?.id || action.id}`;
      
      if (!seen.has(key)) {
        seen.set(key, action);
        result.unshift(action); // Add to beginning to maintain chronological order
      } else {
        // Check if this action is more important than the existing one
        const existing = seen.get(key)!;
        if (this.isMoreImportant(action, existing)) {
          // Replace the existing action
          const index = result.findIndex(a => a.id === existing.id);
          if (index !== -1) {
            result[index] = action;
            seen.set(key, action);
          }
        }
      }
    }

    return result;
  }

  private isMoreImportant(action1: any, action2: any): boolean {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    // Higher priority wins
    if (priorityOrder[action1.priority] > priorityOrder[action2.priority]) {
      return true;
    }
    
    // If same priority, newer wins
    if (action1.priority === action2.priority) {
      return action1.timestamp > action2.timestamp;
    }
    
    return false;
  }

  private async applyDeltaSync(actions: any[]): Promise<any[]> {
    // For update actions, only sync changed fields
    return actions.map(action => {
      if (action.type === 'update' && action.data) {
        // This would require comparing with last known state
        // For now, just return the action as-is
        return action;
      }
      return action;
    });
  }

  private calculateAverageSyncTime(history: any[]): number {
    if (history.length === 0) return 0;
    
    const totalTime = history.reduce((sum, sync) => sum + (sync.duration || 0), 0);
    return totalTime / history.length;
  }

  private calculateBandwidthSaved(history: any[]): number {
    // Calculate bandwidth saved through optimizations
    return history.reduce((saved, sync) => {
      return saved + (sync.bandwidthSaved || 0);
    }, 0);
  }

  private calculateSuccessRate(history: any[]): number {
    if (history.length === 0) return 0;
    
    const successful = history.filter(sync => sync.success).length;
    return successful / history.length;
  }

  private calculateOptimizationEffectiveness(history: any[]): number {
    // Calculate how effective our optimizations are
    // This would compare optimized vs non-optimized sync performance
    return 0.85; // Placeholder
  }

  // Track sync operations
  startSync(actionId: string): void {
    this.currentSyncs.add(actionId);
  }

  endSync(actionId: string, success: boolean, duration: number): void {
    this.currentSyncs.delete(actionId);
    this.syncHistory.recordSync({
      actionId,
      success,
      duration,
      timestamp: Date.now()
    });
  }
}

// Supporting classes and interfaces

class NetworkConditionsMonitor {
  getCurrentConditions(): NetworkConditions {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 1,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };
  }
}

class SyncHistoryTracker {
  private history: any[] = [];
  private maxHistorySize = 1000;

  recordSync(syncRecord: any): void {
    this.history.push(syncRecord);
    
    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  getRecentHistory(hours: number = 24): any[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.history.filter(record => record.timestamp > cutoff);
  }
}

interface ActionOptimization {
  decision: 'immediate' | 'delayed' | 'deferred';
  delay?: number;
  deferUntil?: 'better-network' | 'wifi' | 'charging';
  reason: string;
}

interface OptimizationStats {
  totalSyncs: number;
  averageSyncTime: number;
  bandwidthSaved: number;
  successRate: number;
  networkConditions: NetworkConditions;
  currentConcurrentSyncs: number;
  optimizationEffectiveness: number;
}