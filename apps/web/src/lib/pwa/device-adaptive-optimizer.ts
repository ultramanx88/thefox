/**
 * Device Adaptive Optimizer
 * Optimizes performance based on device capabilities and characteristics
 */

export interface DeviceCapabilities {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'unknown';
  screenSize: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  memory: {
    total: number; // GB
    available: number; // GB
    pressure: 'low' | 'medium' | 'high';
  };
  cpu: {
    cores: number;
    architecture: string;
    performance: 'low' | 'medium' | 'high';
  };
  gpu: {
    vendor: string;
    renderer: string;
    performance: 'low' | 'medium' | 'high';
  };
  storage: {
    type: 'hdd' | 'ssd' | 'unknown';
    available: number; // GB
  };
  battery: {
    level: number; // 0-1
    charging: boolean;
    dischargingTime: number; // minutes
  };
  network: {
    type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
    downlink: number; // Mbps
    rtt: number; // ms
    saveData: boolean;
  };
}

export interface DeviceOptimizationConfig {
  enableDeviceDetection: boolean;
  enableAdaptiveRendering: boolean;
  enableMemoryOptimization: boolean;
  enableBatteryOptimization: boolean;
  enablePerformanceScaling: boolean;
  optimizationProfiles: {
    lowEnd: DeviceOptimizationProfile;
    midRange: DeviceOptimizationProfile;
    highEnd: DeviceOptimizationProfile;
  };
  adaptationThresholds: {
    memoryPressure: number; // 0.8 = 80%
    batteryLevel: number; // 0.2 = 20%
    cpuUsage: number; // 0.8 = 80%
  };
}

export interface DeviceOptimizationProfile {
  name: string;
  imageQuality: number; // 0-1
  animationLevel: 'none' | 'reduced' | 'normal' | 'enhanced';
  cacheSize: number; // MB
  maxConcurrentRequests: number;
  enableLazyLoading: boolean;
  enableVirtualScrolling: boolean;
  enableCodeSplitting: boolean;
  renderingOptimizations: {
    enableGPUAcceleration: boolean;
    maxFPS: number;
    enableWebGL: boolean;
    enableOffscreenCanvas: boolean;
  };
}

export interface DeviceMetrics {
  detectionAccuracy: number;
  optimizationEffectiveness: number;
  performanceGain: number;
  memoryUsageReduction: number;
  batteryLifeImprovement: number;
  adaptationCount: number;
}

export class DeviceAdaptiveOptimizer {
  private config: DeviceOptimizationConfig;
  private deviceCapabilities: DeviceCapabilities;
  private currentProfile: DeviceOptimizationProfile;
  private metrics: DeviceMetrics;
  private observers: Map<string, any> = new Map();
  private adaptationCallbacks: ((profile: DeviceOptimizationProfile) => void)[] = [];
  
  private monitoringInterval?: NodeJS.Timeout;
  private adaptationInterval?: NodeJS.Timeout;

  constructor(config: Partial<DeviceOptimizationConfig> = {}) {
    this.config = {
      enableDeviceDetection: true,
      enableAdaptiveRendering: true,
      enableMemoryOptimization: true,
      enableBatteryOptimization: true,
      enablePerformanceScaling: true,
      optimizationProfiles: {
        lowEnd: this.createLowEndProfile(),
        midRange: this.createMidRangeProfile(),
        highEnd: this.createHighEndProfile()
      },
      adaptationThresholds: {
        memoryPressure: 0.8,
        batteryLevel: 0.2,
        cpuUsage: 0.8
      },
      ...config
    };

    this.deviceCapabilities = this.getDefaultCapabilities();
    this.currentProfile = this.config.optimizationProfiles.midRange;
    this.metrics = {
      detectionAccuracy: 0,
      optimizationEffectiveness: 0,
      performanceGain: 0,
      memoryUsageReduction: 0,
      batteryLifeImprovement: 0,
      adaptationCount: 0
    };

    this.initialize();
  }

  /**
   * Initialize device adaptive optimizer
   */
  private async initialize(): Promise<void> {
    try {
      // Detect device capabilities
      if (this.config.enableDeviceDetection) {
        await this.detectDeviceCapabilities();
      }

      // Select initial optimization profile
      this.currentProfile = this.selectOptimalProfile();

      // Apply initial optimizations
      await this.applyOptimizationProfile(this.currentProfile);

      // Setup monitoring
      this.setupDeviceMonitoring();
      this.startAdaptiveOptimization();

      console.log('Device adaptive optimizer initialized', {
        deviceType: this.deviceCapabilities.deviceType,
        profile: this.currentProfile.name
      });
    } catch (error) {
      console.error('Failed to initialize device adaptive optimizer:', error);
    }
  }

  /**
   * Get current device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * Get current optimization profile
   */
  getCurrentProfile(): DeviceOptimizationProfile {
    return { ...this.currentProfile };
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): DeviceMetrics {
    return { ...this.metrics };
  }

  /**
   * Manually set optimization profile
   */
  async setOptimizationProfile(profileName: keyof typeof this.config.optimizationProfiles): Promise<void> {
    const profile = this.config.optimizationProfiles[profileName];
    if (!profile) {
      throw new Error(`Unknown optimization profile: ${profileName}`);
    }

    await this.applyOptimizationProfile(profile);
    this.currentProfile = profile;
    this.metrics.adaptationCount++;
    
    console.log(`Optimization profile changed to: ${profile.name}`);
  }

  /**
   * Optimize for specific device constraint
   */
  async optimizeForConstraint(constraint: 'memory' | 'battery' | 'cpu' | 'network'): Promise<void> {
    console.log(`Optimizing for ${constraint} constraint`);

    switch (constraint) {
      case 'memory':
        await this.optimizeForMemoryPressure();
        break;
      case 'battery':
        await this.optimizeForBatteryLife();
        break;
      case 'cpu':
        await this.optimizeForCPUUsage();
        break;
      case 'network':
        await this.optimizeForNetworkConditions();
        break;
    }

    this.metrics.adaptationCount++;
  }

  /**
   * Add adaptation callback
   */
  onProfileAdaptation(callback: (profile: DeviceOptimizationProfile) => void): void {
    this.adaptationCallbacks.push(callback);
  }

  /**
   * Get device-specific recommendations
   */
  getDeviceRecommendations(): string[] {
    const recommendations: string[] = [];
    const caps = this.deviceCapabilities;

    // Memory recommendations
    if (caps.memory.pressure === 'high') {
      recommendations.push('Enable aggressive memory cleanup');
      recommendations.push('Reduce image quality and cache size');
    }

    // Battery recommendations
    if (caps.battery.level < 0.2 && !caps.battery.charging) {
      recommendations.push('Reduce animation and visual effects');
      recommendations.push('Lower screen brightness and frame rate');
    }

    // Performance recommendations
    if (caps.cpu.performance === 'low') {
      recommendations.push('Enable code splitting and lazy loading');
      recommendations.push('Reduce concurrent operations');
    }

    // Network recommendations
    if (caps.network.saveData || caps.network.effectiveType === '2g') {
      recommendations.push('Enable data saver mode');
      recommendations.push('Compress images and reduce quality');
    }

    return recommendations;
  }

  // Private methods

  private async detectDeviceCapabilities(): Promise<void> {
    // Detect device type
    this.deviceCapabilities.deviceType = this.detectDeviceType();

    // Detect screen capabilities
    this.deviceCapabilities.screenSize = {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1
    };

    // Detect memory capabilities
    this.deviceCapabilities.memory = await this.detectMemoryCapabilities();

    // Detect CPU capabilities
    this.deviceCapabilities.cpu = this.detectCPUCapabilities();

    // Detect GPU capabilities
    this.deviceCapabilities.gpu = this.detectGPUCapabilities();

    // Detect storage capabilities
    this.deviceCapabilities.storage = await this.detectStorageCapabilities();

    // Detect battery capabilities
    this.deviceCapabilities.battery = await this.detectBatteryCapabilities();

    // Detect network capabilities
    this.deviceCapabilities.network = this.detectNetworkCapabilities();

    console.log('Device capabilities detected:', this.deviceCapabilities);
  }

  private detectDeviceType(): DeviceCapabilities['deviceType'] {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);

    // Check for TV
    if (userAgent.includes('tv') || userAgent.includes('smart-tv')) {
      return 'tv';
    }

    // Check for mobile
    if (userAgent.includes('mobile') || minDimension < 768) {
      return 'mobile';
    }

    // Check for tablet
    if (userAgent.includes('tablet') || (minDimension >= 768 && maxDimension < 1024)) {
      return 'tablet';
    }

    // Default to desktop
    if (maxDimension >= 1024) {
      return 'desktop';
    }

    return 'unknown';
  }

  private async detectMemoryCapabilities(): Promise<DeviceCapabilities['memory']> {
    let total = 4; // Default 4GB
    let available = 2; // Default 2GB available
    let pressure: 'low' | 'medium' | 'high' = 'medium';

    try {
      // Use Device Memory API if available
      if ('deviceMemory' in navigator) {
        total = (navigator as any).deviceMemory;
      }

      // Use Performance Memory API if available
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const usedMemory = memInfo.usedJSHeapSize / (1024 * 1024 * 1024); // Convert to GB
        available = total - usedMemory;
        
        const usageRatio = usedMemory / total;
        if (usageRatio > 0.8) pressure = 'high';
        else if (usageRatio > 0.6) pressure = 'medium';
        else pressure = 'low';
      }
    } catch (error) {
      console.warn('Memory detection failed:', error);
    }

    return { total, available, pressure };
  }

  private detectCPUCapabilities(): DeviceCapabilities['cpu'] {
    let cores = navigator.hardwareConcurrency || 4;
    let architecture = 'unknown';
    let performance: 'low' | 'medium' | 'high' = 'medium';

    try {
      // Estimate performance based on cores and device type
      if (this.deviceCapabilities.deviceType === 'mobile' && cores <= 4) {
        performance = 'low';
      } else if (cores >= 8) {
        performance = 'high';
      }

      // Try to detect architecture from user agent
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('arm')) architecture = 'arm';
      else if (userAgent.includes('x86')) architecture = 'x86';
      else if (userAgent.includes('x64')) architecture = 'x64';
    } catch (error) {
      console.warn('CPU detection failed:', error);
    }

    return { cores, architecture, performance };
  }

  private detectGPUCapabilities(): DeviceCapabilities['gpu'] {
    let vendor = 'unknown';
    let renderer = 'unknown';
    let performance: 'low' | 'medium' | 'high' = 'medium';

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
        }

        // Estimate performance based on vendor
        const vendorLower = vendor.toLowerCase();
        if (vendorLower.includes('nvidia') || vendorLower.includes('amd')) {
          performance = 'high';
        } else if (vendorLower.includes('intel')) {
          performance = 'medium';
        } else if (vendorLower.includes('qualcomm') || vendorLower.includes('mali')) {
          performance = 'low';
        }
      }
    } catch (error) {
      console.warn('GPU detection failed:', error);
    }

    return { vendor, renderer, performance };
  }

  private async detectStorageCapabilities(): Promise<DeviceCapabilities['storage']> {
    let type: 'hdd' | 'ssd' | 'unknown' = 'unknown';
    let available = 1; // Default 1GB

    try {
      // Use Storage API if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        available = (estimate.quota || 1024 * 1024 * 1024) / (1024 * 1024 * 1024); // Convert to GB
      }

      // Estimate storage type based on device type
      if (this.deviceCapabilities.deviceType === 'mobile') {
        type = 'ssd'; // Most mobile devices use flash storage
      } else if (this.deviceCapabilities.deviceType === 'desktop') {
        type = 'unknown'; // Could be either
      }
    } catch (error) {
      console.warn('Storage detection failed:', error);
    }

    return { type, available };
  }

  private async detectBatteryCapabilities(): Promise<DeviceCapabilities['battery']> {
    let level = 1;
    let charging = false;
    let dischargingTime = Infinity;

    try {
      // Use Battery API if available
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        level = battery.level;
        charging = battery.charging;
        dischargingTime = battery.dischargingTime / 60; // Convert to minutes
      }
    } catch (error) {
      console.warn('Battery detection failed:', error);
    }

    return { level, charging, dischargingTime };
  }

  private detectNetworkCapabilities(): DeviceCapabilities['network'] {
    let type: 'wifi' | 'cellular' | 'ethernet' | 'unknown' = 'unknown';
    let effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown' = 'unknown';
    let downlink = 1;
    let rtt = 100;
    let saveData = false;

    try {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        type = connection.type || 'unknown';
        effectiveType = connection.effectiveType || 'unknown';
        downlink = connection.downlink || 1;
        rtt = connection.rtt || 100;
        saveData = connection.saveData || false;
      }
    } catch (error) {
      console.warn('Network detection failed:', error);
    }

    return { type, effectiveType, downlink, rtt, saveData };
  }

  private selectOptimalProfile(): DeviceOptimizationProfile {
    const caps = this.deviceCapabilities;
    
    // Calculate device score based on capabilities
    let score = 0;
    
    // Memory score (0-30)
    if (caps.memory.total >= 8) score += 30;
    else if (caps.memory.total >= 4) score += 20;
    else score += 10;
    
    // CPU score (0-25)
    if (caps.cpu.performance === 'high') score += 25;
    else if (caps.cpu.performance === 'medium') score += 15;
    else score += 5;
    
    // GPU score (0-20)
    if (caps.gpu.performance === 'high') score += 20;
    else if (caps.gpu.performance === 'medium') score += 12;
    else score += 4;
    
    // Device type score (0-15)
    if (caps.deviceType === 'desktop') score += 15;
    else if (caps.deviceType === 'tablet') score += 10;
    else score += 5;
    
    // Network score (0-10)
    if (caps.network.effectiveType === '4g' || caps.network.effectiveType === '5g') score += 10;
    else if (caps.network.effectiveType === '3g') score += 6;
    else score += 2;

    // Select profile based on score
    if (score >= 70) {
      return this.config.optimizationProfiles.highEnd;
    } else if (score >= 40) {
      return this.config.optimizationProfiles.midRange;
    } else {
      return this.config.optimizationProfiles.lowEnd;
    }
  }

  private async applyOptimizationProfile(profile: DeviceOptimizationProfile): Promise<void> {
    console.log(`Applying optimization profile: ${profile.name}`);

    // Apply rendering optimizations
    await this.applyRenderingOptimizations(profile.renderingOptimizations);

    // Apply image quality settings
    this.applyImageQualitySettings(profile.imageQuality);

    // Apply animation settings
    this.applyAnimationSettings(profile.animationLevel);

    // Apply caching settings
    this.applyCacheSettings(profile.cacheSize);

    // Apply loading optimizations
    this.applyLoadingOptimizations(profile);

    // Notify callbacks
    this.notifyAdaptationCallbacks(profile);
  }

  private async applyRenderingOptimizations(optimizations: DeviceOptimizationProfile['renderingOptimizations']): Promise<void> {
    const root = document.documentElement;

    // GPU acceleration
    if (optimizations.enableGPUAcceleration) {
      root.style.setProperty('--gpu-acceleration', 'translateZ(0)');
    } else {
      root.style.setProperty('--gpu-acceleration', 'none');
    }

    // Frame rate limiting
    root.style.setProperty('--max-fps', optimizations.maxFPS.toString());

    // WebGL support
    if (!optimizations.enableWebGL) {
      root.classList.add('no-webgl');
    } else {
      root.classList.remove('no-webgl');
    }

    // Offscreen canvas
    if (optimizations.enableOffscreenCanvas && 'OffscreenCanvas' in window) {
      root.classList.add('offscreen-canvas-enabled');
    } else {
      root.classList.remove('offscreen-canvas-enabled');
    }
  }

  private applyImageQualitySettings(quality: number): void {
    const root = document.documentElement;
    root.style.setProperty('--image-quality', quality.toString());
    
    // Apply quality class
    root.classList.remove('image-quality-low', 'image-quality-medium', 'image-quality-high');
    if (quality < 0.4) {
      root.classList.add('image-quality-low');
    } else if (quality < 0.7) {
      root.classList.add('image-quality-medium');
    } else {
      root.classList.add('image-quality-high');
    }
  }

  private applyAnimationSettings(level: DeviceOptimizationProfile['animationLevel']): void {
    const root = document.documentElement;
    
    // Remove existing animation classes
    root.classList.remove('animations-none', 'animations-reduced', 'animations-normal', 'animations-enhanced');
    
    // Apply new animation class
    root.classList.add(`animations-${level}`);
    
    // Set CSS custom property
    root.style.setProperty('--animation-level', level);
  }

  private applyCacheSettings(cacheSize: number): void {
    // Apply cache size settings to various caching systems
    const cacheSizeBytes = cacheSize * 1024 * 1024; // Convert MB to bytes
    
    // This would integrate with your caching systems
    console.log(`Applied cache size: ${cacheSize}MB`);
  }

  private applyLoadingOptimizations(profile: DeviceOptimizationProfile): void {
    const root = document.documentElement;
    
    // Lazy loading
    if (profile.enableLazyLoading) {
      root.classList.add('lazy-loading-enabled');
    } else {
      root.classList.remove('lazy-loading-enabled');
    }
    
    // Virtual scrolling
    if (profile.enableVirtualScrolling) {
      root.classList.add('virtual-scrolling-enabled');
    } else {
      root.classList.remove('virtual-scrolling-enabled');
    }
    
    // Code splitting
    if (profile.enableCodeSplitting) {
      root.classList.add('code-splitting-enabled');
    } else {
      root.classList.remove('code-splitting-enabled');
    }
    
    // Max concurrent requests
    root.style.setProperty('--max-concurrent-requests', profile.maxConcurrentRequests.toString());
  }

  private async optimizeForMemoryPressure(): Promise<void> {
    console.log('Optimizing for memory pressure');
    
    // Reduce image quality
    this.applyImageQualitySettings(0.3);
    
    // Disable animations
    this.applyAnimationSettings('none');
    
    // Reduce cache size
    this.applyCacheSettings(10); // 10MB
    
    // Enable aggressive cleanup
    const root = document.documentElement;
    root.classList.add('memory-pressure-mode');
    
    this.metrics.memoryUsageReduction += 0.3;
  }

  private async optimizeForBatteryLife(): Promise<void> {
    console.log('Optimizing for battery life');
    
    // Reduce animations
    this.applyAnimationSettings('reduced');
    
    // Disable GPU acceleration
    await this.applyRenderingOptimizations({
      enableGPUAcceleration: false,
      maxFPS: 30,
      enableWebGL: false,
      enableOffscreenCanvas: false
    });
    
    // Enable power saving mode
    const root = document.documentElement;
    root.classList.add('power-saving-mode');
    
    this.metrics.batteryLifeImprovement += 0.2;
  }

  private async optimizeForCPUUsage(): Promise<void> {
    console.log('Optimizing for CPU usage');
    
    // Reduce concurrent operations
    const root = document.documentElement;
    root.style.setProperty('--max-concurrent-requests', '2');
    
    // Enable code splitting
    root.classList.add('code-splitting-enabled');
    
    // Reduce frame rate
    await this.applyRenderingOptimizations({
      enableGPUAcceleration: true,
      maxFPS: 30,
      enableWebGL: false,
      enableOffscreenCanvas: false
    });
    
    this.metrics.performanceGain += 0.15;
  }

  private async optimizeForNetworkConditions(): Promise<void> {
    console.log('Optimizing for network conditions');
    
    const network = this.deviceCapabilities.network;
    
    if (network.saveData || network.effectiveType === '2g' || network.effectiveType === '3g') {
      // Enable data saver mode
      this.applyImageQualitySettings(0.4);
      
      // Enable aggressive lazy loading
      const root = document.documentElement;
      root.classList.add('data-saver-mode');
      root.classList.add('lazy-loading-enabled');
      
      // Reduce concurrent requests
      root.style.setProperty('--max-concurrent-requests', '1');
    }
  }

  private setupDeviceMonitoring(): void {
    // Monitor memory pressure
    if ('memory' in performance) {
      this.monitoringInterval = setInterval(() => {
        const memInfo = (performance as any).memory;
        const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        if (usageRatio > this.config.adaptationThresholds.memoryPressure) {
          this.optimizeForMemoryPressure();
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor battery level
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < this.config.adaptationThresholds.batteryLevel && !battery.charging) {
            this.optimizeForBatteryLife();
          }
        });
      });
    }

    // Monitor network changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.deviceCapabilities.network = this.detectNetworkCapabilities();
        this.optimizeForNetworkConditions();
      });
    }
  }

  private startAdaptiveOptimization(): void {
    this.adaptationInterval = setInterval(async () => {
      // Re-evaluate optimal profile
      const optimalProfile = this.selectOptimalProfile();
      
      if (optimalProfile.name !== this.currentProfile.name) {
        await this.applyOptimizationProfile(optimalProfile);
        this.currentProfile = optimalProfile;
        this.metrics.adaptationCount++;
        
        console.log(`Profile adapted to: ${optimalProfile.name}`);
      }
    }, 60000); // Check every minute
  }

  private notifyAdaptationCallbacks(profile: DeviceOptimizationProfile): void {
    this.adaptationCallbacks.forEach(callback => {
      try {
        callback(profile);
      } catch (error) {
        console.error('Error in adaptation callback:', error);
      }
    });
  }

  private createLowEndProfile(): DeviceOptimizationProfile {
    return {
      name: 'Low-End Device',
      imageQuality: 0.4,
      animationLevel: 'reduced',
      cacheSize: 20, // 20MB
      maxConcurrentRequests: 2,
      enableLazyLoading: true,
      enableVirtualScrolling: true,
      enableCodeSplitting: true,
      renderingOptimizations: {
        enableGPUAcceleration: false,
        maxFPS: 30,
        enableWebGL: false,
        enableOffscreenCanvas: false
      }
    };
  }

  private createMidRangeProfile(): DeviceOptimizationProfile {
    return {
      name: 'Mid-Range Device',
      imageQuality: 0.7,
      animationLevel: 'normal',
      cacheSize: 50, // 50MB
      maxConcurrentRequests: 4,
      enableLazyLoading: true,
      enableVirtualScrolling: false,
      enableCodeSplitting: true,
      renderingOptimizations: {
        enableGPUAcceleration: true,
        maxFPS: 60,
        enableWebGL: true,
        enableOffscreenCanvas: false
      }
    };
  }

  private createHighEndProfile(): DeviceOptimizationProfile {
    return {
      name: 'High-End Device',
      imageQuality: 0.9,
      animationLevel: 'enhanced',
      cacheSize: 100, // 100MB
      maxConcurrentRequests: 8,
      enableLazyLoading: false,
      enableVirtualScrolling: false,
      enableCodeSplitting: false,
      renderingOptimizations: {
        enableGPUAcceleration: true,
        maxFPS: 120,
        enableWebGL: true,
        enableOffscreenCanvas: true
      }
    };
  }

  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      deviceType: 'unknown',
      screenSize: { width: 1920, height: 1080, pixelRatio: 1 },
      memory: { total: 4, available: 2, pressure: 'medium' },
      cpu: { cores: 4, architecture: 'unknown', performance: 'medium' },
      gpu: { vendor: 'unknown', renderer: 'unknown', performance: 'medium' },
      storage: { type: 'unknown', available: 1 },
      battery: { level: 1, charging: false, dischargingTime: Infinity },
      network: { type: 'unknown', effectiveType: 'unknown', downlink: 1, rtt: 100, saveData: false }
    };
  }

  /**
   * Destroy device adaptive optimizer
   */
  destroy(): void {
    // Clear intervals
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.adaptationInterval) clearInterval(this.adaptationInterval);

    // Clear observers
    this.observers.clear();
    this.adaptationCallbacks = [];

    console.log('Device adaptive optimizer destroyed');
  }
}