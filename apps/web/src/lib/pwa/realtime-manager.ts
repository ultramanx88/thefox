/**
 * Real-time Update Manager
 * Handles scalable WebSocket connections and efficient real-time data synchronization
 */

export interface RealtimeConfig {
  maxConnections: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  compressionEnabled: boolean;
  batchingEnabled: boolean;
  adaptiveFrequency: boolean;
  selectiveBroadcast: boolean;
}

export interface ConnectionMetrics {
  activeConnections: number;
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  reconnections: number;
  errors: number;
  bandwidth: number;
}

export interface Subscription {
  id: string;
  channel: string;
  userId?: string;
  filters?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  lastActivity: number;
  messageCount: number;
}

export interface RealtimeMessage {
  id: string;
  type: string;
  channel: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  targetUsers?: string[];
  compression?: boolean;
  batchId?: string;
}

export interface NetworkCondition {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export class RealtimeManager {
  private config: RealtimeConfig;
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private messageQueue: Map<string, RealtimeMessage[]> = new Map();
  private metrics: ConnectionMetrics;
  private networkCondition: NetworkCondition;
  
  private heartbeatInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();
  private connectionPool: WebSocketPool;
  private messageBuffer: MessageBuffer;
  private compressionWorker?: Worker;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      maxConnections: 10,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      messageQueueSize: 1000,
      compressionEnabled: true,
      batchingEnabled: true,
      adaptiveFrequency: true,
      selectiveBroadcast: true,
      ...config
    };

    this.metrics = {
      activeConnections: 0,
      totalMessages: 0,
      messagesPerSecond: 0,
      averageLatency: 0,
      reconnections: 0,
      errors: 0,
      bandwidth: 0
    };

    this.networkCondition = this.detectNetworkCondition();
    this.connectionPool = new WebSocketPool(this.config.maxConnections);
    this.messageBuffer = new MessageBuffer(this.config.messageQueueSize);

    this.initialize();
  }

  /**
   * Initialize real-time manager
   */
  private async initialize(): Promise<void> {
    try {
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Initialize compression worker if enabled
      if (this.config.compressionEnabled) {
        await this.initializeCompressionWorker();
      }
      
      // Start monitoring intervals
      this.startHeartbeat();
      this.startMetricsCollection();
      this.startCleanupTasks();
      
      console.log('Real-time manager initialized');
    } catch (error) {
      console.error('Failed to initialize real-time manager:', error);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  async subscribe(
    channel: string,
    callback: (data: any) => void,
    options: {
      userId?: string;
      filters?: Record<string, any>;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      userId: options.userId,
      filters: options.filters,
      priority: options.priority || 'medium',
      lastActivity: Date.now(),
      messageCount: 0
    };

    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);
    
    // Add event listener
    const listeners = this.eventListeners.get(channel) || [];
    listeners.push(callback);
    this.eventListeners.set(channel, listeners);

    // Get or create connection for this channel
    const connection = await this.getOrCreateConnection(channel);
    
    // Send subscription message
    await this.sendMessage(connection, {
      type: 'subscribe',
      channel,
      subscriptionId,
      filters: options.filters,
      priority: options.priority
    });

    console.log(`Subscribed to channel: ${channel} (${subscriptionId})`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Remove from subscriptions
    this.subscriptions.delete(subscriptionId);
    
    // Remove event listener
    const listeners = this.eventListeners.get(subscription.channel) || [];
    const filteredListeners = listeners.filter((_, index) => {
      // This is a simplified removal - in practice you'd need better listener tracking
      return index !== 0;
    });
    
    if (filteredListeners.length === 0) {
      this.eventListeners.delete(subscription.channel);
    } else {
      this.eventListeners.set(subscription.channel, filteredListeners);
    }

    // Send unsubscribe message
    const connection = this.connections.get(subscription.channel);
    if (connection && connection.readyState === WebSocket.OPEN) {
      await this.sendMessage(connection, {
        type: 'unsubscribe',
        subscriptionId
      });
    }

    console.log(`Unsubscribed from channel: ${subscription.channel} (${subscriptionId})`);
  }

  /**
   * Publish message to channel
   */
  async publish(
    channel: string,
    data: any,
    options: {
      priority?: 'high' | 'medium' | 'low';
      targetUsers?: string[];
      compress?: boolean;
    } = {}
  ): Promise<void> {
    const message: RealtimeMessage = {
      id: this.generateMessageId(),
      type: 'publish',
      channel,
      data,
      timestamp: Date.now(),
      priority: options.priority || 'medium',
      targetUsers: options.targetUsers,
      compression: options.compress ?? this.config.compressionEnabled
    };

    // Add to message buffer for batching if enabled
    if (this.config.batchingEnabled) {
      this.messageBuffer.add(message);
    } else {
      await this.sendRealtimeMessage(message);
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Optimize connections based on network conditions
   */
  async optimizeConnections(): Promise<void> {
    console.log('Optimizing real-time connections');

    const currentCondition = this.detectNetworkCondition();
    
    // Adjust based on network conditions
    if (currentCondition.effectiveType === 'slow-2g' || currentCondition.effectiveType === '2g') {
      // Reduce update frequency for slow connections
      await this.reduceUpdateFrequency();
      
      // Enable aggressive compression
      this.config.compressionEnabled = true;
      
      // Reduce max connections
      this.config.maxConnections = Math.max(2, Math.floor(this.config.maxConnections / 2));
      
    } else if (currentCondition.effectiveType === '4g' && currentCondition.downlink > 10) {
      // Increase update frequency for fast connections
      await this.increaseUpdateFrequency();
      
      // Allow more connections
      this.config.maxConnections = Math.min(20, this.config.maxConnections * 2);
    }

    // Optimize based on user activity
    await this.optimizeByUserActivity();
    
    // Clean up inactive subscriptions
    await this.cleanupInactiveSubscriptions();

    this.networkCondition = currentCondition;
  }

  /**
   * Handle connection failures with fallback mechanisms
   */
  async handleConnectionFailure(channel: string, error: any): Promise<void> {
    console.error(`Connection failure for channel ${channel}:`, error);
    
    this.metrics.errors++;
    
    const connection = this.connections.get(channel);
    if (connection) {
      connection.close();
      this.connections.delete(channel);
    }

    // Implement exponential backoff for reconnection
    const reconnectDelay = this.calculateReconnectDelay();
    
    setTimeout(async () => {
      try {
        await this.reconnectChannel(channel);
      } catch (reconnectError) {
        console.error(`Reconnection failed for channel ${channel}:`, reconnectError);
        
        // Implement fallback mechanism
        await this.implementFallbackMechanism(channel);
      }
    }, reconnectDelay);
  }

  // Private methods

  private async getOrCreateConnection(channel: string): Promise<WebSocket> {
    let connection = this.connections.get(channel);
    
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      connection = await this.createConnection(channel);
      this.connections.set(channel, connection);
    }
    
    return connection;
  }

  private async createConnection(channel: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.buildWebSocketUrl(channel);
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        this.metrics.activeConnections++;
        console.log(`WebSocket connected for channel: ${channel}`);
        resolve(ws);
      };

      ws.onmessage = (event) => {
        this.handleMessage(channel, event.data);
      };

      ws.onclose = (event) => {
        this.metrics.activeConnections--;
        console.log(`WebSocket closed for channel: ${channel}`, event.code);
        
        if (event.code !== 1000) { // Not a normal closure
          this.handleConnectionFailure(channel, new Error(`Connection closed: ${event.code}`));
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        this.metrics.errors++;
        reject(error);
      };
    });
  }

  private async handleMessage(channel: string, data: string): Promise<void> {
    try {
      let message;
      
      // Decompress if needed
      if (this.config.compressionEnabled && data.startsWith('compressed:')) {
        message = await this.decompressMessage(data.substring(11));
      } else {
        message = JSON.parse(data);
      }

      this.metrics.totalMessages++;
      this.updateLatencyMetrics(message);

      // Update subscription activity
      const relevantSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.channel === channel);
      
      relevantSubscriptions.forEach(sub => {
        sub.lastActivity = Date.now();
        sub.messageCount++;
      });

      // Selective broadcasting
      if (this.config.selectiveBroadcast) {
        await this.selectiveBroadcast(channel, message);
      } else {
        // Broadcast to all listeners
        const listeners = this.eventListeners.get(channel) || [];
        listeners.forEach(listener => {
          try {
            listener(message);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
      }

    } catch (error) {
      console.error('Error handling message:', error);
      this.metrics.errors++;
    }
  }

  private async selectiveBroadcast(channel: string, message: any): Promise<void> {
    const listeners = this.eventListeners.get(channel) || [];
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.channel === channel);

    // Filter subscriptions based on message targeting
    const targetedSubscriptions = relevantSubscriptions.filter(sub => {
      // Check user targeting
      if (message.targetUsers && message.targetUsers.length > 0) {
        return message.targetUsers.includes(sub.userId);
      }
      
      // Check filters
      if (sub.filters && message.filters) {
        return this.matchesFilters(message.filters, sub.filters);
      }
      
      return true; // No filtering, send to all
    });

    // Send to targeted subscriptions only
    targetedSubscriptions.forEach((sub, index) => {
      if (index < listeners.length) {
        try {
          listeners[index](message);
        } catch (error) {
          console.error('Error in selective broadcast:', error);
        }
      }
    });
  }

  private matchesFilters(messageFilters: Record<string, any>, subscriptionFilters: Record<string, any>): boolean {
    return Object.entries(subscriptionFilters).every(([key, value]) => {
      return messageFilters[key] === value;
    });
  }

  private async sendMessage(connection: WebSocket, message: any): Promise<void> {
    if (connection.readyState !== WebSocket.OPEN) {
      throw new Error('Connection not open');
    }

    let data = JSON.stringify(message);
    
    // Compress if enabled and message is large
    if (this.config.compressionEnabled && data.length > 1024) {
      data = await this.compressMessage(data);
    }

    connection.send(data);
  }

  private async sendRealtimeMessage(message: RealtimeMessage): Promise<void> {
    const connection = this.connections.get(message.channel);
    if (!connection) {
      console.warn(`No connection for channel: ${message.channel}`);
      return;
    }

    await this.sendMessage(connection, message);
  }

  private buildWebSocketUrl(channel: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/${channel}`;
  }

  private detectNetworkCondition(): NetworkCondition {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 1,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };
  }

  private setupNetworkMonitoring(): void {
    // Monitor network changes
    window.addEventListener('online', () => {
      console.log('Network back online, reconnecting...');
      this.reconnectAll();
    });

    window.addEventListener('offline', () => {
      console.log('Network offline, pausing real-time updates');
      this.pauseAllConnections();
    });

    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.networkCondition = this.detectNetworkCondition();
        this.optimizeConnections();
      });
    }
  }

  private async initializeCompressionWorker(): Promise<void> {
    try {
      // Create compression worker for heavy compression tasks
      const workerCode = `
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          if (type === 'compress') {
            // Simple compression simulation
            const compressed = btoa(data);
            self.postMessage({ type: 'compressed', data: compressed });
          } else if (type === 'decompress') {
            const decompressed = atob(data);
            self.postMessage({ type: 'decompressed', data: decompressed });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
      
    } catch (error) {
      console.warn('Compression worker not available:', error);
      this.config.compressionEnabled = false;
    }
  }

  private async compressMessage(data: string): Promise<string> {
    if (this.compressionWorker) {
      return new Promise((resolve) => {
        this.compressionWorker!.onmessage = (e) => {
          if (e.data.type === 'compressed') {
            resolve('compressed:' + e.data.data);
          }
        };
        this.compressionWorker!.postMessage({ type: 'compress', data });
      });
    }
    
    // Fallback compression
    return 'compressed:' + btoa(data);
  }

  private async decompressMessage(data: string): Promise<any> {
    if (this.compressionWorker) {
      return new Promise((resolve) => {
        this.compressionWorker!.onmessage = (e) => {
          if (e.data.type === 'decompressed') {
            resolve(JSON.parse(e.data.data));
          }
        };
        this.compressionWorker!.postMessage({ type: 'decompress', data });
      });
    }
    
    // Fallback decompression
    return JSON.parse(atob(data));
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach(async (connection, channel) => {
        if (connection.readyState === WebSocket.OPEN) {
          try {
            await this.sendMessage(connection, { type: 'ping', timestamp: Date.now() });
          } catch (error) {
            console.error(`Heartbeat failed for channel ${channel}:`, error);
          }
        }
      });
    }, this.config.heartbeatInterval);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }

  private startCleanupTasks(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
      this.messageBuffer.cleanup();
    }, 60000); // Every minute
  }

  private updateMetrics(): void {
    // Calculate messages per second
    const now = Date.now();
    const timeWindow = 5000; // 5 seconds
    
    // This would be implemented with proper time-based calculations
    this.metrics.messagesPerSecond = this.metrics.totalMessages / (timeWindow / 1000);
    
    // Update bandwidth estimation
    this.metrics.bandwidth = this.estimateBandwidthUsage();
  }

  private updateLatencyMetrics(message: any): void {
    if (message.timestamp) {
      const latency = Date.now() - message.timestamp;
      this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    }
  }

  private estimateBandwidthUsage(): number {
    // Estimate bandwidth based on message count and average size
    const averageMessageSize = 1024; // 1KB estimate
    return this.metrics.messagesPerSecond * averageMessageSize;
  }

  private async reduceUpdateFrequency(): Promise<void> {
    // Implement adaptive frequency reduction
    this.config.heartbeatInterval = Math.min(60000, this.config.heartbeatInterval * 1.5);
    
    // Restart heartbeat with new interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.startHeartbeat();
    }
  }

  private async increaseUpdateFrequency(): Promise<void> {
    // Implement adaptive frequency increase
    this.config.heartbeatInterval = Math.max(15000, this.config.heartbeatInterval * 0.8);
    
    // Restart heartbeat with new interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.startHeartbeat();
    }
  }

  private async optimizeByUserActivity(): Promise<void> {
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    this.subscriptions.forEach((subscription, id) => {
      if (now - subscription.lastActivity > inactiveThreshold) {
        // Reduce priority for inactive subscriptions
        if (subscription.priority === 'high') {
          subscription.priority = 'medium';
        } else if (subscription.priority === 'medium') {
          subscription.priority = 'low';
        }
      }
    });
  }

  private async cleanupInactiveSubscriptions(): Promise<void> {
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    const inactiveSubscriptions = Array.from(this.subscriptions.entries())
      .filter(([_, sub]) => now - sub.lastActivity > inactiveThreshold);
    
    for (const [id, _] of inactiveSubscriptions) {
      await this.unsubscribe(id);
    }
    
    if (inactiveSubscriptions.length > 0) {
      console.log(`Cleaned up ${inactiveSubscriptions.length} inactive subscriptions`);
    }
  }

  private calculateReconnectDelay(): number {
    const baseDelay = this.config.reconnectDelay;
    const attempts = this.metrics.reconnections;
    return Math.min(baseDelay * Math.pow(2, attempts), 30000); // Max 30 seconds
  }

  private async reconnectChannel(channel: string): Promise<void> {
    this.metrics.reconnections++;
    
    try {
      const connection = await this.createConnection(channel);
      this.connections.set(channel, connection);
      
      // Resubscribe to channel
      const channelSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.channel === channel);
      
      for (const subscription of channelSubscriptions) {
        await this.sendMessage(connection, {
          type: 'subscribe',
          channel: subscription.channel,
          subscriptionId: subscription.id,
          filters: subscription.filters,
          priority: subscription.priority
        });
      }
      
      console.log(`Reconnected to channel: ${channel}`);
    } catch (error) {
      console.error(`Failed to reconnect to channel ${channel}:`, error);
      throw error;
    }
  }

  private async reconnectAll(): Promise<void> {
    const channels = Array.from(this.connections.keys());
    
    for (const channel of channels) {
      try {
        await this.reconnectChannel(channel);
      } catch (error) {
        console.error(`Failed to reconnect channel ${channel}:`, error);
      }
    }
  }

  private pauseAllConnections(): void {
    this.connections.forEach((connection, channel) => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.close(1000, 'Network offline');
      }
    });
    this.connections.clear();
  }

  private async implementFallbackMechanism(channel: string): Promise<void> {
    console.log(`Implementing fallback mechanism for channel: ${channel}`);
    
    // Implement polling fallback
    const pollInterval = setInterval(async () => {
      try {
        // This would poll a REST endpoint as fallback
        const response = await fetch(`/api/realtime/${channel}/poll`);
        if (response.ok) {
          const data = await response.json();
          this.handleMessage(channel, JSON.stringify(data));
        }
      } catch (error) {
        console.error('Polling fallback failed:', error);
      }
    }, 5000);

    // Store interval for cleanup
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 60000); // Stop polling after 1 minute
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy real-time manager
   */
  destroy(): void {
    // Clear intervals
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);

    // Close all connections
    this.connections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.close(1000, 'Manager destroyed');
      }
    });

    // Terminate compression worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    // Clear data
    this.connections.clear();
    this.subscriptions.clear();
    this.messageQueue.clear();
    this.eventListeners.clear();

    console.log('Real-time manager destroyed');
  }
}

// Supporting classes

class WebSocketPool {
  private maxSize: number;
  private pool: WebSocket[] = [];

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  acquire(): WebSocket | null {
    return this.pool.pop() || null;
  }

  release(ws: WebSocket): void {
    if (this.pool.length < this.maxSize && ws.readyState === WebSocket.OPEN) {
      this.pool.push(ws);
    } else {
      ws.close();
    }
  }

  clear(): void {
    this.pool.forEach(ws => ws.close());
    this.pool = [];
  }
}

class MessageBuffer {
  private maxSize: number;
  private buffer: Map<string, RealtimeMessage[]> = new Map();
  private flushInterval?: NodeJS.Timeout;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.startAutoFlush();
  }

  add(message: RealtimeMessage): void {
    const channelBuffer = this.buffer.get(message.channel) || [];
    channelBuffer.push(message);
    
    if (channelBuffer.length > this.maxSize) {
      channelBuffer.shift(); // Remove oldest message
    }
    
    this.buffer.set(message.channel, channelBuffer);
  }

  flush(channel: string): RealtimeMessage[] {
    const messages = this.buffer.get(channel) || [];
    this.buffer.set(channel, []);
    return messages;
  }

  cleanup(): void {
    // Remove old messages
    const cutoff = Date.now() - 60000; // 1 minute
    
    this.buffer.forEach((messages, channel) => {
      const filtered = messages.filter(msg => msg.timestamp > cutoff);
      this.buffer.set(channel, filtered);
    });
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      // Auto-flush buffers periodically
      this.buffer.forEach((messages, channel) => {
        if (messages.length > 0) {
          // This would trigger actual message sending
          console.log(`Auto-flushing ${messages.length} messages for channel: ${channel}`);
        }
      });
    }, 1000);
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.buffer.clear();
  }
}