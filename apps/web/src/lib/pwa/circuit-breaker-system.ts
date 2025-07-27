/**
 * Circuit Breaker System
 * Implements circuit breakers and fallback mechanisms for high load scenarios
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms before attempting recovery
  monitoringWindow: number; // Time window for failure counting
  successThreshold: number; // Successes needed to close circuit
  enableFallback: boolean;
  enableMetrics: boolean;
}

export interface CircuitBreakerState {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  nextAttemptTime: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  condition: (error: Error, context: any) => boolean;
  execute: (context: any) => Promise<any>;
  timeout: number;
}

export interface CircuitBreakerMetrics {
  circuitBreakers: Map<string, CircuitBreakerState>;
  totalCircuits: number;
  openCircuits: number;
  halfOpenCircuits: number;
  closedCircuits: number;
  totalRequests: number;
  totalFailures: number;
  totalFallbacks: number;
  averageResponseTime: number;
}

export class CircuitBreakerSystem {
  private circuits: Map<string, CircuitBreaker> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy[]> = new Map();
  private metrics: CircuitBreakerMetrics;
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    this.metrics = {
      circuitBreakers: new Map(),
      totalCircuits: 0,
      openCircuits: 0,
      halfOpenCircuits: 0,
      closedCircuits: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalFallbacks: 0,
      averageResponseTime: 0
    };

    this.startMetricsCollection();
    this.setupDefaultFallbackStrategies();
  }

  /**
   * Create a new circuit breaker
   */
  createCircuitBreaker(
    name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ): CircuitBreaker {
    const circuitBreaker = new CircuitBreaker(name, {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringWindow: 60000, // 1 minute
      successThreshold: 3,
      enableFallback: true,
      enableMetrics: true,
      ...config
    });

    this.circuits.set(name, circuitBreaker);
    this.updateMetrics();

    console.log(`Created circuit breaker: ${name}`);
    return circuitBreaker;
  }

  /**
   * Get circuit breaker by name
   */
  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuits.get(name);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    fn: () => Promise<T>,
    context: any = {}
  ): Promise<T> {
    let circuit = this.circuits.get(circuitName);
    
    if (!circuit) {
      // Create circuit breaker on-demand
      circuit = this.createCircuitBreaker(circuitName);
    }

    try {
      const result = await circuit.execute(fn, context);
      this.updateMetrics();
      return result;
    } catch (error) {
      // Try fallback strategies
      const fallbackResult = await this.executeFallback(circuitName, error, context);
      if (fallbackResult !== null) {
        this.metrics.totalFallbacks++;
        this.updateMetrics();
        return fallbackResult;
      }
      
      throw error;
    }
  }

  /**
   * Add fallback strategy for a circuit
   */
  addFallbackStrategy(circuitName: string, strategy: FallbackStrategy): void {
    const strategies = this.fallbackStrategies.get(circuitName) || [];
    strategies.push(strategy);
    strategies.sort((a, b) => b.priority - a.priority);
    this.fallbackStrategies.set(circuitName, strategies);
    
    console.log(`Added fallback strategy for ${circuitName}: ${strategy.name}`);
  }

  /**
   * Get system metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(name: string): void {
    const circuit = this.circuits.get(name);
    if (circuit) {
      circuit.reset();
      console.log(`Reset circuit breaker: ${name}`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuits.forEach((circuit, name) => {
      circuit.reset();
    });
    console.log('Reset all circuit breakers');
  }

  // Private methods

  private async executeFallback(
    circuitName: string,
    error: Error,
    context: any
  ): Promise<any> {
    const strategies = this.fallbackStrategies.get(circuitName) || [];
    
    for (const strategy of strategies) {
      if (strategy.condition(error, context)) {
        try {
          console.log(`Executing fallback strategy: ${strategy.name} for ${circuitName}`);
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Fallback timeout')), strategy.timeout);
          });
          
          const result = await Promise.race([
            strategy.execute(context),
            timeoutPromise
          ]);
          
          console.log(`Fallback strategy ${strategy.name} succeeded`);
          return result;
          
        } catch (fallbackError) {
          console.warn(`Fallback strategy ${strategy.name} failed:`, fallbackError);
          continue;
        }
      }
    }
    
    return null; // No fallback succeeded
  }

  private setupDefaultFallbackStrategies(): void {
    // Cache fallback strategy
    this.addFallbackStrategy('api-requests', {
      name: 'Cache Fallback',
      priority: 10,
      condition: (error, context) => context.cacheKey !== undefined,
      execute: async (context) => {
        // Try to get from cache
        const cached = await this.getCachedResponse(context.cacheKey);
        if (cached) {
          return cached;
        }
        throw new Error('No cached response available');
      },
      timeout: 5000
    });

    // Static response fallback
    this.addFallbackStrategy('api-requests', {
      name: 'Static Response Fallback',
      priority: 5,
      condition: (error, context) => context.staticFallback !== undefined,
      execute: async (context) => {
        return context.staticFallback;
      },
      timeout: 1000
    });

    // Retry with exponential backoff
    this.addFallbackStrategy('network-requests', {
      name: 'Exponential Backoff Retry',
      priority: 8,
      condition: (error, context) => 
        error.message.includes('network') || error.message.includes('timeout'),
      execute: async (context) => {
        const maxRetries = 3;
        let delay = 1000;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            await new Promise(resolve => setTimeout(resolve, delay));
            return await context.originalFunction();
          } catch (retryError) {
            if (i === maxRetries - 1) throw retryError;
            delay *= 2;
          }
        }
      },
      timeout: 30000
    });

    // Degraded service fallback
    this.addFallbackStrategy('user-interface', {
      name: 'Degraded UI Fallback',
      priority: 3,
      condition: (error, context) => context.enableDegradedMode === true,
      execute: async (context) => {
        return {
          degraded: true,
          message: 'Service temporarily unavailable. Limited functionality enabled.',
          data: context.minimalData || {}
        };
      },
      timeout: 2000
    });
  }

  private async getCachedResponse(cacheKey: string): Promise<any> {
    // Implementation would integrate with actual cache system
    // For now, return null (no cache)
    return null;
  }

  private updateMetrics(): void {
    this.metrics.totalCircuits = this.circuits.size;
    this.metrics.openCircuits = 0;
    this.metrics.halfOpenCircuits = 0;
    this.metrics.closedCircuits = 0;
    this.metrics.totalRequests = 0;
    this.metrics.totalFailures = 0;

    const states = new Map<string, CircuitBreakerState>();
    
    this.circuits.forEach((circuit, name) => {
      const state = circuit.getState();
      states.set(name, state);
      
      switch (state.state) {
        case 'OPEN':
          this.metrics.openCircuits++;
          break;
        case 'HALF_OPEN':
          this.metrics.halfOpenCircuits++;
          break;
        case 'CLOSED':
          this.metrics.closedCircuits++;
          break;
      }
      
      this.metrics.totalRequests += state.totalRequests;
      this.metrics.totalFailures += state.totalFailures;
    });

    this.metrics.circuitBreakers = states;
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 10000); // Update every 10 seconds
  }

  /**
   * Destroy circuit breaker system
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.circuits.forEach(circuit => circuit.destroy());
    this.circuits.clear();
    this.fallbackStrategies.clear();

    console.log('Circuit breaker system destroyed');
  }
}

/**
 * Individual Circuit Breaker implementation
 */
export class CircuitBreaker {
  private name: string;
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private failureWindow: number[] = [];
  private responseTimeHistory: number[] = [];

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
    this.state = {
      name,
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextAttemptTime: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, context: any = {}): Promise<T> {
    this.state.totalRequests++;

    // Check if circuit is open
    if (this.state.state === 'OPEN') {
      if (Date.now() < this.state.nextAttemptTime) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      } else {
        // Transition to half-open
        this.state.state = 'HALF_OPEN';
        this.state.successCount = 0;
        console.log(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await fn();
      const responseTime = Date.now() - startTime;
      
      this.onSuccess(responseTime);
      return result;
      
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state.state = 'CLOSED';
    this.state.failureCount = 0;
    this.state.successCount = 0;
    this.state.nextAttemptTime = 0;
    this.failureWindow = [];
    this.responseTimeHistory = [];
    
    console.log(`Circuit breaker ${this.name} reset to CLOSED`);
  }

  /**
   * Force circuit breaker to open state
   */
  forceOpen(): void {
    this.state.state = 'OPEN';
    this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    
    console.log(`Circuit breaker ${this.name} forced to OPEN`);
  }

  /**
   * Get failure rate within monitoring window
   */
  getFailureRate(): number {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;
    
    const recentFailures = this.failureWindow.filter(time => time > windowStart);
    const totalRequests = this.state.totalRequests;
    
    return totalRequests > 0 ? recentFailures.length / totalRequests : 0;
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(): number {
    if (this.responseTimeHistory.length === 0) return 0;
    
    const sum = this.responseTimeHistory.reduce((acc, time) => acc + time, 0);
    return sum / this.responseTimeHistory.length;
  }

  // Private methods

  private onSuccess(responseTime: number): void {
    this.state.lastSuccessTime = Date.now();
    this.state.totalSuccesses++;
    
    // Track response time
    this.responseTimeHistory.push(responseTime);
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory = this.responseTimeHistory.slice(-100);
    }

    if (this.state.state === 'HALF_OPEN') {
      this.state.successCount++;
      
      if (this.state.successCount >= this.config.successThreshold) {
        // Close the circuit
        this.state.state = 'CLOSED';
        this.state.failureCount = 0;
        this.state.successCount = 0;
        this.failureWindow = [];
        
        console.log(`Circuit breaker ${this.name} closed after successful recovery`);
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success
      this.state.failureCount = Math.max(0, this.state.failureCount - 1);
    }
  }

  private onFailure(): void {
    const now = Date.now();
    this.state.lastFailureTime = now;
    this.state.totalFailures++;
    this.state.failureCount++;
    
    // Add to failure window
    this.failureWindow.push(now);
    
    // Clean old failures outside monitoring window
    const windowStart = now - this.config.monitoringWindow;
    this.failureWindow = this.failureWindow.filter(time => time > windowStart);

    // Check if we should open the circuit
    if (this.state.state === 'CLOSED' || this.state.state === 'HALF_OPEN') {
      if (this.state.failureCount >= this.config.failureThreshold) {
        // Open the circuit
        this.state.state = 'OPEN';
        this.state.nextAttemptTime = now + this.config.recoveryTimeout;
        this.state.successCount = 0;
        
        console.log(`Circuit breaker ${this.name} opened due to ${this.state.failureCount} failures`);
      }
    }
  }

  /**
   * Destroy circuit breaker
   */
  destroy(): void {
    this.failureWindow = [];
    this.responseTimeHistory = [];
  }
}