/**
 * PWA Background Sync System
 * Main export file for all background sync components
 */

// Core components
export { BackgroundSyncManager } from './background-sync-manager';
export { ConflictResolver } from './conflict-resolver';
export { SyncOptimizer } from './sync-optimizer';
export { PrioritySyncProcessor } from './priority-sync-processor';
export { SyncDatabase } from './sync-database';

// Enhanced components from previous tasks
export { CacheManager } from './cache-manager';
export { PerformanceMonitor } from './advanced-performance-monitor';
export { ResourceOptimizer } from './resource-optimizer';

// Memory and resource optimization components
export { MemoryOptimizer } from './memory-optimizer';
export { StorageQuotaManager } from './storage-quota-manager';
export { CPUOptimizer } from './cpu-optimizer';
export { ResourceManager } from './resource-manager';

// Real-time update system components
export { RealtimeManager } from './realtime-manager';
export { AdaptiveFrequencyManager } from './adaptive-frequency-manager';
export { RealtimeFallbackManager } from './realtime-fallback-manager';
export { EnhancedRealtimeSystem } from './enhanced-realtime-system';

// Cost-effective scaling components
export { CDNOptimizer } from './cdn-optimizer';
export { CompressionOptimizer } from './compression-optimizer';
export { FirebaseQuotaOptimizer } from './firebase-quota-optimizer';
export { CostMonitoringSystem } from './cost-monitoring-system';
export { CostEffectiveScalingSystem } from './cost-effective-scaling-system';

// Device and network adaptive components
export { DeviceAdaptiveOptimizer } from './device-adaptive-optimizer';
export { NetworkAdaptiveLoader } from './network-adaptive-loader';
export { ResponsiveCacheManager } from './responsive-cache-manager';
export { DeviceNetworkAdaptiveSystem } from './device-network-adaptive-system';

// Memory and resource optimization components
export { MemoryManager } from './memory-manager';
export { ResourceAllocator } from './resource-allocator';
export { StorageQuotaManager } from './storage-quota-manager';
export { CPUOptimizer } from './cpu-optimizer';
export { ResourceOptimizationSystem } from './resource-optimization-system';

// Types and interfaces
export type {
  OfflineAction,
  SyncConfig,
  ConflictResolution,
  NetworkConditions,
  SyncOptimizationConfig,
  SyncPriority,
  ProcessorStats
} from './background-sync-manager';

export type {
  Conflict,
  ConflictResolutionStrategy,
  MergeRule
} from './conflict-resolver';

export type {
  SyncSchedule,
  OptimizationStats
} from './sync-optimizer';

export type {
  SyncOperation,
  ResourceRequirements
} from './priority-sync-processor';

// Utility function to create a complete sync system
export function createBackgroundSyncSystem(config?: {
  syncConfig?: any;
  optimizerConfig?: any;
  databaseConfig?: any;
}) {
  const syncManager = new BackgroundSyncManager(config?.syncConfig);
  const conflictResolver = new ConflictResolver();
  const syncOptimizer = new SyncOptimizer(config?.optimizerConfig);
  const priorityProcessor = new PrioritySyncProcessor();
  const syncDatabase = new SyncDatabase(config?.databaseConfig);

  return {
    syncManager,
    conflictResolver,
    syncOptimizer,
    priorityProcessor,
    syncDatabase,
    
    // Convenience methods
    async initialize() {
      await syncDatabase.initialize();
      console.log('Background sync system initialized');
    },
    
    async addAction(action: any, priority: 'critical' | 'high' | 'medium' | 'low' = 'medium') {
      return await syncManager.addToQueue({
        ...action,
        priority,
        maxRetries: 3
      });
    },
    
    getStats() {
      return {
        sync: syncManager.getQueueStatus(),
        optimizer: syncOptimizer.getOptimizationStats(),
        processor: priorityProcessor.getStats(),
        conflicts: conflictResolver.getConflictStats()
      };
    },
    
    async cleanup() {
      await syncDatabase.cleanup();
      console.log('Background sync system cleanup completed');
    }
  };
}

// Utility function to create a complete resource management system
export function createResourceManagementSystem(config?: {
  memoryConfig?: any;
  storageConfig?: any;
  cpuConfig?: any;
  resourceConfig?: any;
}) {
  const memoryOptimizer = new MemoryOptimizer(config?.memoryConfig);
  const storageManager = new StorageQuotaManager(config?.storageConfig);
  const cpuOptimizer = new CPUOptimizer(config?.cpuConfig);
  const resourceManager = new ResourceManager({
    memoryConfig: config?.memoryConfig,
    storageConfig: config?.storageConfig,
    cpuConfig: config?.cpuConfig,
    ...config?.resourceConfig
  });

  return {
    memoryOptimizer,
    storageManager,
    cpuOptimizer,
    resourceManager,
    
    // Convenience methods
    async getSystemStatus() {
      return await resourceManager.getSystemResources();
    },
    
    async optimizeAll(aggressive: boolean = false) {
      return await resourceManager.optimizeResources(aggressive);
    },
    
    async scheduleTask(name: string, execute: () => Promise<any>, priority: 'critical' | 'high' | 'medium' | 'low' | 'idle' = 'medium') {
      return await resourceManager.scheduleTask(name, execute, priority);
    },
    
    async reserveResources(memoryBytes: number, storageBytes: number) {
      return await resourceManager.reserveResources(memoryBytes, storageBytes);
    },
    
    getTrends(hours: number = 1) {
      return resourceManager.getResourceTrends(hours);
    },
    
    cleanup() {
      resourceManager.destroy();
      console.log('Resource management system cleanup completed');
    }
  };
}

// Utility function to create a complete real-time system
export function createRealtimeSystem(config?: {
  realtimeConfig?: any;
  frequencyConfig?: any;
  fallbackConfig?: any;
  enhancedConfig?: any;
}) {
  const realtimeManager = new RealtimeManager(config?.realtimeConfig);
  const frequencyManager = new AdaptiveFrequencyManager(config?.frequencyConfig);
  const fallbackManager = new RealtimeFallbackManager(config?.fallbackConfig);
  const enhancedSystem = new EnhancedRealtimeSystem({
    realtime: config?.realtimeConfig,
    frequency: config?.frequencyConfig,
    fallback: config?.fallbackConfig,
    ...config?.enhancedConfig
  });

  return {
    realtimeManager,
    frequencyManager,
    fallbackManager,
    enhancedSystem,
    
    // Convenience methods
    async subscribe(channel: string, callback: (data: any) => void, options?: any) {
      return await enhancedSystem.subscribe(channel, callback, options);
    },
    
    async unsubscribe(subscriptionId: string) {
      return await enhancedSystem.unsubscribe(subscriptionId);
    },
    
    async publish(channel: string, data: any, options?: any) {
      return await enhancedSystem.publish(channel, data, options);
    },
    
    async getMetrics() {
      return await enhancedSystem.getSystemMetrics();
    },
    
    async checkHealth() {
      return await enhancedSystem.checkSystemHealth();
    },
    
    async optimize() {
      return await enhancedSystem.optimizeSystem();
    },
    
    getActiveSubscriptions() {
      return enhancedSystem.getActiveSubscriptions();
    },
    
    cleanup() {
      enhancedSystem.destroy();
      console.log('Real-time system cleanup completed');
    }
  };
}

// Utility function to create a complete cost-effective scaling system
export function createCostEffectiveScalingSystem(config?: {
  cdnConfig?: any;
  compressionConfig?: any;
  firebaseConfig?: any;
  costMonitoringConfig?: any;
  scalingConfig?: any;
}) {
  const cdnOptimizer = new CDNOptimizer(config?.cdnConfig);
  const compressionOptimizer = new CompressionOptimizer(config?.compressionConfig);
  const firebaseOptimizer = new FirebaseQuotaOptimizer(config?.firebaseConfig);
  const costMonitoring = new CostMonitoringSystem(config?.costMonitoringConfig);
  const scalingSystem = new CostEffectiveScalingSystem({
    cdn: config?.cdnConfig,
    compression: config?.compressionConfig,
    firebaseQuota: config?.firebaseConfig,
    costMonitoring: config?.costMonitoringConfig,
    ...config?.scalingConfig
  });

  return {
    cdnOptimizer,
    compressionOptimizer,
    firebaseOptimizer,
    costMonitoring,
    scalingSystem,
    
    // Convenience methods
    async getMetrics() {
      return await scalingSystem.getScalingMetrics();
    },
    
    async makeScalingDecision() {
      return await scalingSystem.makeScalingDecision();
    },
    
    async executeDecision(decision: any) {
      return await scalingSystem.executeScalingDecision(decision);
    },
    
    async getRecommendations() {
      return await scalingSystem.getScalingRecommendations();
    },
    
    async implementRecommendation(id: string) {
      return await scalingSystem.implementRecommendation(id);
    },
    
    onScalingDecision(callback: (decision: any) => void) {
      scalingSystem.onScalingDecision(callback);
    },
    
    onCostAlert(callback: (alert: any) => void) {
      costMonitoring.onCostAlert(callback);
    },
    
    // CDN optimization methods
    optimizeResourceUrl(url: string, options?: any) {
      return cdnOptimizer.optimizeResourceUrl(url, options);
    },
    
    optimizeImageUrl(url: string, options?: any) {
      return cdnOptimizer.optimizeImageUrl(url, options);
    },
    
    // Compression methods
    async compressData(data: any, options?: any) {
      return await compressionOptimizer.compressData(data, options);
    },
    
    // Firebase optimization methods
    async optimizeFirestoreRead<T>(query: () => Promise<T>, cacheKey: string) {
      return await firebaseOptimizer.optimizeFirestoreRead(query, cacheKey);
    },
    
    async optimizeStorageUpload(file: File, path: string, options?: any) {
      return await firebaseOptimizer.optimizeStorageUpload(file, path, options);
    },
    
    // Cost monitoring methods
    updateServiceCost(service: any, subService: string, cost: number) {
      costMonitoring.updateServiceCost(service, subService, cost);
    },
    
    getCurrentCosts() {
      return costMonitoring.getCurrentCosts();
    },
    
    generateCostReport(period?: 'day' | 'week' | 'month') {
      return costMonitoring.generateCostReport(period);
    },
    
    cleanup() {
      scalingSystem.destroy();
      console.log('Cost-effective scaling system cleanup completed');
    }
  };
}

// Utility function to create a complete device and network adaptive system
export function createDeviceNetworkAdaptiveSystem(config?: {
  deviceConfig?: any;
  networkConfig?: any;
  cacheConfig?: any;
  systemConfig?: any;
}) {
  const deviceOptimizer = new DeviceAdaptiveOptimizer(config?.deviceConfig);
  const networkLoader = new NetworkAdaptiveLoader(config?.networkConfig);
  const cacheManager = new ResponsiveCacheManager(config?.cacheConfig);
  const adaptiveSystem = new DeviceNetworkAdaptiveSystem({
    deviceOptimizer: config?.deviceConfig,
    networkLoader: config?.networkConfig,
    cacheManager: config?.cacheConfig,
    ...config?.systemConfig
  });

  return {
    deviceOptimizer,
    networkLoader,
    cacheManager,
    adaptiveSystem,
    
    // Convenience methods
    async getSystemMetrics() {
      return await adaptiveSystem.getSystemMetrics();
    },
    
    async adaptSystem(trigger?: string) {
      return await adaptiveSystem.adaptSystem(trigger);
    },
    
    async getRecommendations() {
      return await adaptiveSystem.getAdaptationRecommendations();
    },
    
    async implementRecommendation(id: string) {
      return await adaptiveSystem.implementRecommendation(id);
    },
    
    async loadAdaptiveResource(url: string, options?: any) {
      return await adaptiveSystem.loadAdaptiveResource(url, options);
    },
    
    onSystemAdaptation(callback: (metrics: any) => void) {
      adaptiveSystem.onSystemAdaptation(callback);
    },
    
    // Device optimization methods
    getDeviceCapabilities() {
      return deviceOptimizer.getDeviceCapabilities();
    },
    
    getCurrentDeviceProfile() {
      return deviceOptimizer.getCurrentProfile();
    },
    
    async optimizeForConstraint(constraint: 'memory' | 'battery' | 'cpu' | 'network') {
      return await deviceOptimizer.optimizeForConstraint(constraint);
    },
    
    getDeviceRecommendations() {
      return deviceOptimizer.getDeviceRecommendations();
    },
    
    // Network loading methods
    getCurrentNetwork() {
      return networkLoader.getCurrentNetwork();
    },
    
    getCurrentNetworkStrategy() {
      return networkLoader.getCurrentStrategy();
    },
    
    async loadAdaptiveImage(url: string, options?: any) {
      return await networkLoader.loadAdaptiveImage(url, options);
    },
    
    async loadAdaptiveVideo(url: string, options?: any) {
      return await networkLoader.loadAdaptiveVideo(url, options);
    },
    
    async prefetchResources(urls: string[], priority?: 'high' | 'medium' | 'low') {
      return await networkLoader.prefetchResources(urls, priority);
    },
    
    getNetworkRecommendations() {
      return networkLoader.getNetworkRecommendations();
    },
    
    // Cache management methods
    getCurrentCacheProfile() {
      return cacheManager.getCurrentProfile();
    },
    
    async cacheResource(key: string, data: any, type: any, options?: any) {
      return await cacheManager.cacheResource(key, data, type, options);
    },
    
    async getCachedResource(key: string) {
      return await cacheManager.getCachedResource(key);
    },
    
    async adaptCacheProfile(deviceType?: any, networkSpeed?: any, memoryLevel?: any) {
      return await cacheManager.adaptCacheProfile(deviceType, networkSpeed, memoryLevel);
    },
    
    getAdaptationHistory(hours?: number) {
      return adaptiveSystem.getAdaptationHistory(hours);
    },
    
    cleanup() {
      adaptiveSystem.destroy();
      console.log('Device and network adaptive system cleanup completed');
    }
  };
}

// Utility function to create a complete resource optimization system
export function createResourceOptimizationSystem(config?: {
  memory?: any;
  cpu?: any;
  storage?: any;
  resources?: any;
}) {
  const resourceSystem = new ResourceOptimizationSystem(config);

  return {
    resourceSystem,
    
    // Convenience methods
    async getSystemHealth() {
      const stats = await resourceSystem.getSystemStats();
      const healthScore = await resourceSystem.getSystemHealthScore();
      return { stats, healthScore };
    },
    
    async optimizeSystem() {
      return await resourceSystem.optimizeSystem();
    },
    
    async scheduleTask<T>(
      name: string,
      task: () => Promise<T>,
      options?: {
        priority?: 'low' | 'medium' | 'high' | 'critical';
        memoryRequired?: number;
        cpuIntensive?: boolean;
      }
    ) {
      return await resourceSystem.scheduleOptimizedTask(name, task, options);
    },
    
    forceGC() {
      return resourceSystem.forceGarbageCollection();
    },
    
    getRecommendations() {
      return resourceSystem.generateSystemRecommendations();
    },
    
    destroy() {
      resourceSystem.destroy();
    }
  };
}