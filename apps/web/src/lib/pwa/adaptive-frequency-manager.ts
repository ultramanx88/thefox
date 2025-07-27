/**
 * Adaptive Frequency Manager
 * Manages update frequency based on network conditions and user activity
 */

export interface FrequencyConfig {
  baseFrequency: number; // milliseconds
  minFrequency: number; // minimum update interval
  maxFrequency: number; // maximum update interval
  adaptationRate: number; // how quickly to adapt (0-1)
  userActivityWeight: number; // weight for user activity factor
  networkWeight: number; // weight for network condition factor
  batteryWeight: number; // weight for battery level factor
}

export interface UserActivity {
  isActive: boolean;
  lastInteraction: number;
  interactionCount: number;
  focusTime: number;
  scrollActivity: number;
  clickActivity: number;
}

export interface NetworkQuality {
  rtt: number;
  downlink: number;
  effectiveType: string;
  packetLoss: number;
  stability: number; // 0-1, how stable the connection is
}

export interface BatteryStatus {
  level: number;
  charging: boolean;
  dischargingTime: number;
  chargingTime: number;
}

export interface FrequencyMetrics {
  currentFrequency: number;
  targetFrequency: number;
  adaptationHistory: number[];
  performanceImpact: number;
  userSatisfaction: number;
  networkEfficiency: number;
}

export class AdaptiveFrequencyManager {
  private config: FrequencyConfig;
  private currentFrequency: number;
  private targetFrequency: number;
  private userActivity: UserActivity;
  private networkQuality: NetworkQuality;
  private batteryStatus?: BatteryStatus;
  
  private activityMonitor?: ActivityMonitor;
  private networkMonitor?: NetworkQualityMonitor;
  private batteryMonitor?: BatteryMonitor;
  
  private adaptationHistory: number[] = [];
  private frequencyCallbacks: Map<string, (frequency: number) => void> = new Map();
  private updateInterval?: NodeJS.Timeout;

  constructor(config: Partial<FrequencyConfig> = {}) {
    this.config = {
      baseFrequency: 5000, // 5 seconds
      minFrequency: 1000, // 1 second
      maxFrequency: 60000, // 1 minute
      adaptationRate: 0.1,
      userActivityWeight: 0.4,
      networkWeight: 0.4,
      batteryWeight: 0.2,
      ...config
    };

    this.currentFrequency = this.config.baseFrequency;
    this.targetFrequency = this.config.baseFrequency;

    this.userActivity = {
      isActive: true,
      lastInteraction: Date.now(),
      interactionCount: 0,
      focusTime: 0,
      scrollActivity: 0,
      clickActivity: 0
    };

    this.networkQuality = {
      rtt: 100,
      downlink: 1,
      effectiveType: 'unknown',
      packetLoss: 0,
      stability: 1
    };

    this.initialize();
  }

  /**
   * Initialize adaptive frequency manager
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize monitors
      this.activityMonitor = new ActivityMonitor();
      this.networkMonitor = new NetworkQualityMonitor();
      this.batteryMonitor = new BatteryMonitor();

      // Setup event listeners
      this.setupEventListeners();
      
      // Start monitoring
      await this.startMonitoring();
      
      // Start adaptation loop
      this.startAdaptationLoop();

      console.log('Adaptive frequency manager initialized');
    } catch (error) {
      console.error('Failed to initialize adaptive frequency manager:', error);
    }
  }

  /**
   * Register callback for frequency changes
   */
  onFrequencyChange(id: string, callback: (frequency: number) => void): void {
    this.frequencyCallbacks.set(id, callback);
  }

  /**
   * Unregister frequency change callback
   */
  offFrequencyChange(id: string): void {
    this.frequencyCallbacks.delete(id);
  }

  /**
   * Get current frequency
   */
  getCurrentFrequency(): number {
    return this.currentFrequency;
  }

  /**
   * Get frequency metrics
   */
  getMetrics(): FrequencyMetrics {
    return {
      currentFrequency: this.currentFrequency,
      targetFrequency: this.targetFrequency,
      adaptationHistory: [...this.adaptationHistory],
      performanceImpact: this.calculatePerformanceImpact(),
      userSatisfaction: this.calculateUserSatisfaction(),
      networkEfficiency: this.calculateNetworkEfficiency()
    };
  }

  /**
   * Manually adjust frequency (temporary override)
   */
  setFrequency(frequency: number, duration?: number): void {
    const clampedFrequency = Math.max(
      this.config.minFrequency,
      Math.min(this.config.maxFrequency, frequency)
    );

    this.currentFrequency = clampedFrequency;
    this.notifyFrequencyChange();

    if (duration) {
      setTimeout(() => {
        this.resumeAdaptiveFrequency();
      }, duration);
    }
  }

  /**
   * Resume adaptive frequency after manual override
   */
  resumeAdaptiveFrequency(): void {
    this.currentFrequency = this.targetFrequency;
    this.notifyFrequencyChange();
  }

  /**
   * Calculate optimal frequency based on current conditions
   */
  private calculateOptimalFrequency(): number {
    const userFactor = this.calculateUserActivityFactor();
    const networkFactor = this.calculateNetworkFactor();
    const batteryFactor = this.calculateBatteryFactor();

    // Weighted combination of factors
    const combinedFactor = 
      (userFactor * this.config.userActivityWeight) +
      (networkFactor * this.config.networkWeight) +
      (batteryFactor * this.config.batteryWeight);

    // Apply factor to base frequency
    const optimalFrequency = this.config.baseFrequency / combinedFactor;

    // Clamp to min/max bounds
    return Math.max(
      this.config.minFrequency,
      Math.min(this.config.maxFrequency, optimalFrequency)
    );
  }

  /**
   * Calculate user activity factor (higher = more frequent updates needed)
   */
  private calculateUserActivityFactor(): number {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.userActivity.lastInteraction;
    const inactivityThreshold = 30000; // 30 seconds

    let activityFactor = 1.0;

    // Reduce frequency if user is inactive
    if (timeSinceLastInteraction > inactivityThreshold) {
      const inactivityMinutes = timeSinceLastInteraction / 60000;
      activityFactor = Math.max(0.1, 1 / (1 + inactivityMinutes * 0.5));
    }

    // Increase frequency if user is highly active
    if (this.userActivity.isActive) {
      const recentInteractions = this.userActivity.interactionCount;
      if (recentInteractions > 10) {
        activityFactor *= 1.5;
      }
    }

    // Consider scroll and click activity
    const scrollFactor = Math.min(2, 1 + this.userActivity.scrollActivity * 0.1);
    const clickFactor = Math.min(2, 1 + this.userActivity.clickActivity * 0.2);

    return activityFactor * scrollFactor * clickFactor;
  }

  /**
   * Calculate network condition factor (higher = can handle more frequent updates)
   */
  private calculateNetworkFactor(): number {
    let networkFactor = 1.0;

    // Adjust based on connection type
    switch (this.networkQuality.effectiveType) {
      case 'slow-2g':
        networkFactor = 0.2;
        break;
      case '2g':
        networkFactor = 0.4;
        break;
      case '3g':
        networkFactor = 0.8;
        break;
      case '4g':
        networkFactor = 1.5;
        break;
      default:
        networkFactor = 1.0;
    }

    // Adjust based on RTT
    if (this.networkQuality.rtt > 500) {
      networkFactor *= 0.5; // Very slow connection
    } else if (this.networkQuality.rtt > 200) {
      networkFactor *= 0.8; // Slow connection
    } else if (this.networkQuality.rtt < 50) {
      networkFactor *= 1.2; // Fast connection
    }

    // Adjust based on downlink speed
    if (this.networkQuality.downlink > 10) {
      networkFactor *= 1.3; // High bandwidth
    } else if (this.networkQuality.downlink < 1) {
      networkFactor *= 0.6; // Low bandwidth
    }

    // Adjust based on packet loss
    if (this.networkQuality.packetLoss > 0.05) {
      networkFactor *= 0.7; // High packet loss
    }

    // Adjust based on connection stability
    networkFactor *= this.networkQuality.stability;

    return Math.max(0.1, Math.min(2.0, networkFactor));
  }

  /**
   * Calculate battery factor (lower battery = less frequent updates)
   */
  private calculateBatteryFactor(): number {
    if (!this.batteryStatus) {
      return 1.0; // Default if battery info not available
    }

    let batteryFactor = 1.0;

    // Reduce frequency on low battery
    if (this.batteryStatus.level < 0.2 && !this.batteryStatus.charging) {
      batteryFactor = 0.3; // Very low battery
    } else if (this.batteryStatus.level < 0.5 && !this.batteryStatus.charging) {
      batteryFactor = 0.7; // Low battery
    }

    // Increase frequency when charging
    if (this.batteryStatus.charging) {
      batteryFactor *= 1.2;
    }

    // Consider discharge rate
    if (this.batteryStatus.dischargingTime < 3600 && !this.batteryStatus.charging) {
      batteryFactor *= 0.5; // Battery draining quickly
    }

    return Math.max(0.2, Math.min(1.5, batteryFactor));
  }

  /**
   * Adapt frequency gradually towards optimal
   */
  private adaptFrequency(): void {
    const optimalFrequency = this.calculateOptimalFrequency();
    
    // Gradual adaptation using exponential moving average
    const adaptationRate = this.config.adaptationRate;
    this.targetFrequency = 
      (this.targetFrequency * (1 - adaptationRate)) + 
      (optimalFrequency * adaptationRate);

    // Update current frequency if change is significant
    const frequencyDiff = Math.abs(this.currentFrequency - this.targetFrequency);
    const changeThreshold = this.config.baseFrequency * 0.1; // 10% change threshold

    if (frequencyDiff > changeThreshold) {
      this.currentFrequency = this.targetFrequency;
      this.recordAdaptation();
      this.notifyFrequencyChange();
    }
  }

  /**
   * Record frequency adaptation for analysis
   */
  private recordAdaptation(): void {
    this.adaptationHistory.push(this.currentFrequency);
    
    // Keep only recent history
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory = this.adaptationHistory.slice(-100);
    }
  }

  /**
   * Notify callbacks of frequency change
   */
  private notifyFrequencyChange(): void {
    this.frequencyCallbacks.forEach((callback, id) => {
      try {
        callback(this.currentFrequency);
      } catch (error) {
        console.error(`Error in frequency callback ${id}:`, error);
      }
    });
  }

  /**
   * Setup event listeners for activity monitoring
   */
  private setupEventListeners(): void {
    // User activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.userActivity.lastInteraction = Date.now();
        this.userActivity.interactionCount++;
        
        if (event === 'scroll') {
          this.userActivity.scrollActivity++;
        } else if (event === 'mousedown' || event === 'touchstart') {
          this.userActivity.clickActivity++;
        }
      }, { passive: true });
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.userActivity.isActive = !document.hidden;
      
      if (document.hidden) {
        // Reduce frequency when page is hidden
        this.setFrequency(this.config.maxFrequency);
      } else {
        // Resume adaptive frequency when page becomes visible
        this.resumeAdaptiveFrequency();
      }
    });

    // Window focus/blur
    window.addEventListener('focus', () => {
      this.userActivity.isActive = true;
      this.userActivity.focusTime = Date.now();
    });

    window.addEventListener('blur', () => {
      this.userActivity.isActive = false;
    });
  }

  /**
   * Start monitoring systems
   */
  private async startMonitoring(): Promise<void> {
    // Start activity monitoring
    if (this.activityMonitor) {
      this.activityMonitor.start((activity) => {
        this.userActivity = { ...this.userActivity, ...activity };
      });
    }

    // Start network quality monitoring
    if (this.networkMonitor) {
      this.networkMonitor.start((quality) => {
        this.networkQuality = quality;
      });
    }

    // Start battery monitoring
    if (this.batteryMonitor) {
      this.batteryStatus = await this.batteryMonitor.start();
    }
  }

  /**
   * Start adaptation loop
   */
  private startAdaptationLoop(): void {
    this.updateInterval = setInterval(() => {
      this.adaptFrequency();
      this.resetActivityCounters();
    }, 5000); // Adapt every 5 seconds
  }

  /**
   * Reset activity counters periodically
   */
  private resetActivityCounters(): void {
    this.userActivity.interactionCount = Math.max(0, this.userActivity.interactionCount - 1);
    this.userActivity.scrollActivity = Math.max(0, this.userActivity.scrollActivity - 1);
    this.userActivity.clickActivity = Math.max(0, this.userActivity.clickActivity - 1);
  }

  /**
   * Calculate performance impact of current frequency
   */
  private calculatePerformanceImpact(): number {
    // Lower frequency = lower performance impact
    const baseImpact = this.config.baseFrequency;
    const currentImpact = this.currentFrequency;
    
    return Math.max(0, Math.min(1, (baseImpact - currentImpact) / baseImpact));
  }

  /**
   * Calculate user satisfaction based on frequency adaptation
   */
  private calculateUserSatisfaction(): number {
    if (this.adaptationHistory.length < 10) {
      return 0.5; // Neutral if not enough data
    }

    // Calculate frequency stability (less variation = higher satisfaction)
    const recentHistory = this.adaptationHistory.slice(-20);
    const mean = recentHistory.reduce((sum, freq) => sum + freq, 0) / recentHistory.length;
    const variance = recentHistory.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / recentHistory.length;
    const stability = 1 / (1 + variance / 1000000); // Normalize variance

    // Consider if frequency matches user activity
    const activityAlignment = this.userActivity.isActive ? 
      (this.currentFrequency < this.config.baseFrequency ? 1 : 0.5) :
      (this.currentFrequency > this.config.baseFrequency ? 1 : 0.5);

    return (stability * 0.6) + (activityAlignment * 0.4);
  }

  /**
   * Calculate network efficiency
   */
  private calculateNetworkEfficiency(): number {
    // Higher frequency with poor network = lower efficiency
    const networkScore = this.calculateNetworkFactor();
    const frequencyRatio = this.config.baseFrequency / this.currentFrequency;
    
    return Math.max(0, Math.min(1, networkScore / frequencyRatio));
  }

  /**
   * Destroy adaptive frequency manager
   */
  destroy(): void {
    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Stop monitors
    if (this.activityMonitor) {
      this.activityMonitor.stop();
    }
    if (this.networkMonitor) {
      this.networkMonitor.stop();
    }
    if (this.batteryMonitor) {
      this.batteryMonitor.stop();
    }

    // Clear callbacks
    this.frequencyCallbacks.clear();
    this.adaptationHistory = [];

    console.log('Adaptive frequency manager destroyed');
  }
}

// Supporting classes

class ActivityMonitor {
  private callback?: (activity: Partial<UserActivity>) => void;
  private interval?: NodeJS.Timeout;

  start(callback: (activity: Partial<UserActivity>) => void): void {
    this.callback = callback;
    
    this.interval = setInterval(() => {
      // Monitor activity patterns
      const activity = {
        isActive: !document.hidden,
        lastInteraction: Date.now()
      };
      
      if (this.callback) {
        this.callback(activity);
      }
    }, 1000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

class NetworkQualityMonitor {
  private callback?: (quality: NetworkQuality) => void;
  private interval?: NodeJS.Timeout;

  start(callback: (quality: NetworkQuality) => void): void {
    this.callback = callback;
    
    this.interval = setInterval(() => {
      const connection = (navigator as any).connection;
      
      const quality: NetworkQuality = {
        rtt: connection?.rtt || 100,
        downlink: connection?.downlink || 1,
        effectiveType: connection?.effectiveType || 'unknown',
        packetLoss: 0, // Would need to measure this
        stability: 1 // Would need to track connection stability
      };
      
      if (this.callback) {
        this.callback(quality);
      }
    }, 5000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

class BatteryMonitor {
  private battery?: any;

  async start(): Promise<BatteryStatus | undefined> {
    try {
      if ('getBattery' in navigator) {
        this.battery = await (navigator as any).getBattery();
        
        return {
          level: this.battery.level,
          charging: this.battery.charging,
          dischargingTime: this.battery.dischargingTime,
          chargingTime: this.battery.chargingTime
        };
      }
    } catch (error) {
      console.warn('Battery monitoring not available:', error);
    }
    
    return undefined;
  }

  stop(): void {
    // Battery API doesn't need explicit cleanup
  }
}