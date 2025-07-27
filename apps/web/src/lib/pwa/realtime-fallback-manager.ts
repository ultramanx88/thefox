/**
 * Real-time Fallback Manager
 * Implements fallback mechanisms for real-time update failures
 */

export interface FallbackConfig {
  enablePolling: boolean;
  enableServerSentEvents: boolean;
  enableLongPolling: boolean;
  pollingInterval: number;
  maxRetries: number;
  retryDelay: number;
  fallbackTimeout: number;
  priorityChannels: string[];
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  isAvailable: () => boolean;
  connect: (channel: string) => Promise<FallbackConnection>;
  disconnect: (connection: FallbackConnection) => Promise<void>;
}

export interface FallbackConnection {
  id: string;
  type: 'polling' | 'sse' | 'long-polling' | 'websocket';
  channel: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: number;
  messageCount: number;
  errorCount: number;
}

export interface FallbackMetrics {
  activeConnections: number;
  fallbacksActivated: number;
  successfulRecoveries: number;
  totalMessages: number;
  averageLatency: number;
  reliabilityScore: number;
}

export class RealtimeFallbackManager {
  private config: FallbackConfig;
  private strategies: Map<string, FallbackStrategy> = new Map();
  private activeConnections: Map<string, FallbackConnection> = new Map();
  private channelCallbacks: Map<string, ((data: any) => void)[]> = new Map();
  private metrics: FallbackMetrics;
  
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enablePolling: true,
      enableServerSentEvents: true,
      enableLongPolling: true,
      pollingInterval: 5000,
      maxRetries: 3,
      retryDelay: 2000,
      fallbackTimeout: 30000,
      priorityChannels: ['orders', 'payments', 'notifications'],
      ...config
    };

    this.metrics = {
      activeConnections: 0,
      fallbacksActivated: 0,
      successfulRecoveries: 0,
      totalMessages: 0,
      averageLatency: 0,
      reliabilityScore: 1.0
    };

    this.initialize();
  }

  /**
   * Initialize fallback manager
   */
  private initialize(): void {
    this.setupFallbackStrategies();
    this.startMonitoring();
    this.startHealthChecks();
    
    console.log('Real-time fallback manager initialized');
  }

  /**
   * Activate fallback for a channel
   */
  async activateFallback(
    channel: string,
    callback: (data: any) => void,
    primaryConnectionError?: Error
  ): Promise<string> {
    console.log(`Activating fallback for channel: ${channel}`, primaryConnectionError?.message);
    
    this.metrics.fallbacksActivated++;
    
    // Store callback
    const callbacks = this.channelCallbacks.get(channel) || [];
    callbacks.push(callback);
    this.channelCallbacks.set(channel, callbacks);

    // Try fallback strategies in priority order
    const availableStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.isAvailable())
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of availableStrategies) {
      try {
        const connection = await strategy.connect(channel);
        this.activeConnections.set(connection.id, connection);
        this.metrics.activeConnections++;
        
        console.log(`Fallback activated using ${strategy.name} for channel: ${channel}`);
        return connection.id;
        
      } catch (error) {
        console.error(`Fallback strategy ${strategy.name} failed:`, error);
        continue;
      }
    }

    throw new Error(`All fallback strategies failed for channel: ${channel}`);
  }

  /**
   * Deactivate fallback for a channel
   */
  async deactivateFallback(connectionId: string): Promise<void> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    const strategy = this.strategies.get(connection.type);
    if (strategy) {
      try {
        await strategy.disconnect(connection);
        console.log(`Fallback deactivated for channel: ${connection.channel}`);
      } catch (error) {
        console.error('Error deactivating fallback:', error);
      }
    }

    this.activeConnections.delete(connectionId);
    this.metrics.activeConnections--;
    
    // Clean up callbacks
    this.channelCallbacks.delete(connection.channel);
  }

  /**
   * Check if fallback is active for channel
   */
  isFallbackActive(channel: string): boolean {
    return Array.from(this.activeConnections.values())
      .some(conn => conn.channel === channel);
  }

  /**
   * Get fallback metrics
   */
  getMetrics(): FallbackMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active connections
   */
  getActiveConnections(): FallbackConnection[] {
    return Array.from(this.activeConnections.values());
  }

  /**
   * Test fallback strategies
   */
  async testFallbackStrategies(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [name, strategy] of this.strategies.entries()) {
      try {
        const isAvailable = strategy.isAvailable();
        results.set(name, isAvailable);
        
        if (isAvailable) {
          // Test actual connection
          const testConnection = await strategy.connect('test-channel');
          await strategy.disconnect(testConnection);
        }
      } catch (error) {
        console.error(`Fallback strategy test failed for ${name}:`, error);
        results.set(name, false);
      }
    }
    
    return results;
  }

  // Private methods

  private setupFallbackStrategies(): void {
    // Polling strategy
    if (this.config.enablePolling) {
      this.strategies.set('polling', {
        name: 'polling',
        priority: 1,
        isAvailable: () => true,
        connect: this.createPollingConnection.bind(this),
        disconnect: this.disconnectPolling.bind(this)
      });
    }

    // Server-Sent Events strategy
    if (this.config.enableServerSentEvents) {
      this.strategies.set('sse', {
        name: 'sse',
        priority: 3,
        isAvailable: () => typeof EventSource !== 'undefined',
        connect: this.createSSEConnection.bind(this),
        disconnect: this.disconnectSSE.bind(this)
      });
    }

    // Long polling strategy
    if (this.config.enableLongPolling) {
      this.strategies.set('long-polling', {
        name: 'long-polling',
        priority: 2,
        isAvailable: () => true,
        connect: this.createLongPollingConnection.bind(this),
        disconnect: this.disconnectLongPolling.bind(this)
      });
    }
  }

  private async createPollingConnection(channel: string): Promise<FallbackConnection> {
    const connectionId = this.generateConnectionId('polling');
    
    const connection: FallbackConnection = {
      id: connectionId,
      type: 'polling',
      channel,
      status: 'connecting',
      lastActivity: Date.now(),
      messageCount: 0,
      errorCount: 0
    };

    // Start polling
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/realtime/${channel}/poll`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.messages && data.messages.length > 0) {
            connection.lastActivity = Date.now();
            connection.messageCount += data.messages.length;
            this.metrics.totalMessages += data.messages.length;
            
            // Deliver messages to callbacks
            this.deliverMessages(channel, data.messages);
          }
          
          connection.status = 'connected';
        } else {
          throw new Error(`Polling failed: ${response.status}`);
        }
      } catch (error) {
        connection.errorCount++;
        console.error(`Polling error for channel ${channel}:`, error);
        
        if (connection.errorCount > this.config.maxRetries) {
          connection.status = 'error';
          clearInterval(pollInterval);
        }
      }
    }, this.config.pollingInterval);

    // Store interval for cleanup
    (connection as any).pollInterval = pollInterval;
    
    return connection;
  }

  private async disconnectPolling(connection: FallbackConnection): Promise<void> {
    const pollInterval = (connection as any).pollInterval;
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    connection.status = 'disconnected';
  }

  private async createSSEConnection(channel: string): Promise<FallbackConnection> {
    const connectionId = this.generateConnectionId('sse');
    
    const connection: FallbackConnection = {
      id: connectionId,
      type: 'sse',
      channel,
      status: 'connecting',
      lastActivity: Date.now(),
      messageCount: 0,
      errorCount: 0
    };

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`/api/realtime/${channel}/sse`);
      
      eventSource.onopen = () => {
        connection.status = 'connected';
        connection.lastActivity = Date.now();
        resolve(connection);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          connection.lastActivity = Date.now();
          connection.messageCount++;
          this.metrics.totalMessages++;
          
          this.deliverMessages(channel, [data]);
        } catch (error) {
          console.error('SSE message parsing error:', error);
          connection.errorCount++;
        }
      };

      eventSource.onerror = (error) => {
        connection.errorCount++;
        console.error(`SSE error for channel ${channel}:`, error);
        
        if (connection.errorCount > this.config.maxRetries) {
          connection.status = 'error';
          eventSource.close();
          reject(new Error('SSE connection failed'));
        }
      };

      // Store EventSource for cleanup
      (connection as any).eventSource = eventSource;
      
      // Timeout for connection
      setTimeout(() => {
        if (connection.status === 'connecting') {
          eventSource.close();
          reject(new Error('SSE connection timeout'));
        }
      }, this.config.fallbackTimeout);
    });
  }

  private async disconnectSSE(connection: FallbackConnection): Promise<void> {
    const eventSource = (connection as any).eventSource;
    if (eventSource) {
      eventSource.close();
    }
    connection.status = 'disconnected';
  }

  private async createLongPollingConnection(channel: string): Promise<FallbackConnection> {
    const connectionId = this.generateConnectionId('long-polling');
    
    const connection: FallbackConnection = {
      id: connectionId,
      type: 'long-polling',
      channel,
      status: 'connecting',
      lastActivity: Date.now(),
      messageCount: 0,
      errorCount: 0
    };

    // Start long polling loop
    const longPoll = async (): Promise<void> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`/api/realtime/${channel}/long-poll`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.messages && data.messages.length > 0) {
            connection.lastActivity = Date.now();
            connection.messageCount += data.messages.length;
            this.metrics.totalMessages += data.messages.length;
            
            this.deliverMessages(channel, data.messages);
          }
          
          connection.status = 'connected';
          
          // Continue long polling if connection is still active
          if (this.activeConnections.has(connectionId)) {
            setTimeout(longPoll, 100); // Small delay before next poll
          }
        } else {
          throw new Error(`Long polling failed: ${response.status}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Timeout - this is normal for long polling
          if (this.activeConnections.has(connectionId)) {
            setTimeout(longPoll, 100);
          }
        } else {
          connection.errorCount++;
          console.error(`Long polling error for channel ${channel}:`, error);
          
          if (connection.errorCount <= this.config.maxRetries && this.activeConnections.has(connectionId)) {
            setTimeout(longPoll, this.config.retryDelay);
          } else {
            connection.status = 'error';
          }
        }
      }
    };

    // Start long polling
    longPoll();
    
    return connection;
  }

  private async disconnectLongPolling(connection: FallbackConnection): Promise<void> {
    connection.status = 'disconnected';
    // Long polling will stop automatically when connection is removed from activeConnections
  }

  private deliverMessages(channel: string, messages: any[]): void {
    const callbacks = this.channelCallbacks.get(channel) || [];
    
    messages.forEach(message => {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in fallback message callback:', error);
        }
      });
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.cleanupStaleConnections();
    }, 10000); // Every 10 seconds
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  private updateMetrics(): void {
    // Update reliability score based on error rates
    const totalConnections = this.activeConnections.size;
    const errorConnections = Array.from(this.activeConnections.values())
      .filter(conn => conn.errorCount > 0).length;
    
    if (totalConnections > 0) {
      this.metrics.reliabilityScore = 1 - (errorConnections / totalConnections);
    }

    // Calculate average latency (simplified)
    const now = Date.now();
    const latencies = Array.from(this.activeConnections.values())
      .map(conn => now - conn.lastActivity)
      .filter(latency => latency < 60000); // Only recent activities
    
    if (latencies.length > 0) {
      this.metrics.averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    }
  }

  private cleanupStaleConnections(): void {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    const staleConnections = Array.from(this.activeConnections.entries())
      .filter(([_, conn]) => now - conn.lastActivity > staleThreshold);
    
    staleConnections.forEach(([id, conn]) => {
      console.log(`Cleaning up stale fallback connection: ${id}`);
      this.deactivateFallback(id);
    });
  }

  private async performHealthChecks(): void {
    for (const [id, connection] of this.activeConnections.entries()) {
      if (connection.status === 'error' || connection.errorCount > this.config.maxRetries) {
        console.log(`Health check failed for connection ${id}, attempting recovery`);
        
        try {
          // Try to recover the connection
          await this.recoverConnection(connection);
          this.metrics.successfulRecoveries++;
        } catch (error) {
          console.error(`Failed to recover connection ${id}:`, error);
          await this.deactivateFallback(id);
        }
      }
    }
  }

  private async recoverConnection(connection: FallbackConnection): Promise<void> {
    const strategy = this.strategies.get(connection.type);
    if (!strategy) {
      throw new Error(`No strategy found for connection type: ${connection.type}`);
    }

    // Disconnect old connection
    await strategy.disconnect(connection);
    
    // Create new connection
    const newConnection = await strategy.connect(connection.channel);
    
    // Replace old connection
    this.activeConnections.delete(connection.id);
    this.activeConnections.set(newConnection.id, newConnection);
    
    console.log(`Successfully recovered connection for channel: ${connection.channel}`);
  }

  private generateConnectionId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy fallback manager
   */
  destroy(): void {
    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect all active connections
    const disconnectPromises = Array.from(this.activeConnections.keys())
      .map(id => this.deactivateFallback(id));
    
    Promise.all(disconnectPromises).then(() => {
      console.log('All fallback connections disconnected');
    });

    // Clear data
    this.strategies.clear();
    this.activeConnections.clear();
    this.channelCallbacks.clear();

    console.log('Real-time fallback manager destroyed');
  }
}