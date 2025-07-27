/**
 * Compression Optimizer
 * Implements data compression and transfer optimization techniques
 */

export interface CompressionConfig {
  enableGzipCompression: boolean;
  enableBrotliCompression: boolean;
  enableDeltaCompression: boolean;
  enableImageCompression: boolean;
  compressionThreshold: number; // Minimum size to compress (bytes)
  compressionLevel: number; // 1-9, higher = better compression but slower
  enableStreamingCompression: boolean;
  enableClientSideCompression: boolean;
  cacheCompressedData: boolean;
}

export interface CompressionMetrics {
  totalBytesOriginal: number;
  totalBytesCompressed: number;
  compressionRatio: number;
  averageCompressionTime: number;
  bandwidthSaved: number;
  compressionHitRatio: number;
  errorRate: number;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  algorithm: string;
  success: boolean;
  error?: string;
}

export interface DeltaCompressionData {
  baseVersion: string;
  currentVersion: string;
  delta: ArrayBuffer;
  metadata: {
    baseSize: number;
    currentSize: number;
    deltaSize: number;
    compressionRatio: number;
  };
}

export class CompressionOptimizer {
  private config: CompressionConfig;
  private metrics: CompressionMetrics;
  private compressionCache: Map<string, CompressedData> = new Map();
  private deltaCache: Map<string, DeltaCompressionData> = new Map();
  private compressionWorker?: Worker;
  
  private metricsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      enableGzipCompression: true,
      enableBrotliCompression: true,
      enableDeltaCompression: true,
      enableImageCompression: true,
      compressionThreshold: 1024, // 1KB
      compressionLevel: 6,
      enableStreamingCompression: true,
      enableClientSideCompression: true,
      cacheCompressedData: true,
      ...config
    };

    this.metrics = {
      totalBytesOriginal: 0,
      totalBytesCompressed: 0,
      compressionRatio: 0,
      averageCompressionTime: 0,
      bandwidthSaved: 0,
      compressionHitRatio: 0,
      errorRate: 0
    };

    this.initialize();
  }

  /**
   * Initialize compression optimizer
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize compression worker for heavy operations
      if (this.config.enableClientSideCompression) {
        await this.initializeCompressionWorker();
      }

      // Start metrics collection
      this.startMetricsCollection();
      
      // Start cleanup tasks
      this.startCleanupTasks();

      console.log('Compression optimizer initialized');
    } catch (error) {
      console.error('Failed to initialize compression optimizer:', error);
    }
  }

  /**
   * Compress data using optimal algorithm
   */
  async compressData(
    data: string | ArrayBuffer | Uint8Array,
    options: {
      algorithm?: 'gzip' | 'brotli' | 'deflate';
      level?: number;
      useWorker?: boolean;
    } = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    
    try {
      // Convert data to consistent format
      const inputData = this.normalizeInput(data);
      const originalSize = inputData.byteLength;

      // Skip compression for small data
      if (originalSize < this.config.compressionThreshold) {
        return {
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          compressionTime: 0,
          algorithm: 'none',
          success: true
        };
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(inputData, options);
      if (this.config.cacheCompressedData) {
        const cached = this.compressionCache.get(cacheKey);
        if (cached) {
          this.updateMetrics(originalSize, cached.compressedData.byteLength, 0, true);
          return {
            originalSize,
            compressedSize: cached.compressedData.byteLength,
            compressionRatio: originalSize / cached.compressedData.byteLength,
            compressionTime: 0,
            algorithm: cached.algorithm,
            success: true
          };
        }
      }

      // Determine optimal compression algorithm
      const algorithm = options.algorithm || this.selectOptimalAlgorithm(inputData);
      const level = options.level || this.config.compressionLevel;

      let compressedData: ArrayBuffer;

      // Use worker for heavy compression if available and requested
      if (options.useWorker && this.compressionWorker) {
        compressedData = await this.compressWithWorker(inputData, algorithm, level);
      } else {
        compressedData = await this.compressWithBuiltIn(inputData, algorithm, level);
      }

      const compressionTime = performance.now() - startTime;
      const compressedSize = compressedData.byteLength;
      const compressionRatio = originalSize / compressedSize;

      // Cache result if beneficial
      if (this.config.cacheCompressedData && compressionRatio > 1.1) {
        this.compressionCache.set(cacheKey, {
          originalData: inputData,
          compressedData,
          algorithm,
          timestamp: Date.now(),
          compressionRatio
        });
      }

      // Update metrics
      this.updateMetrics(originalSize, compressedSize, compressionTime, false);

      return {
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime,
        algorithm,
        success: true
      };

    } catch (error) {
      const compressionTime = performance.now() - startTime;
      this.metrics.errorRate = (this.metrics.errorRate + 1) / 2;
      
      return {
        originalSize: data instanceof ArrayBuffer ? data.byteLength : new TextEncoder().encode(data.toString()).byteLength,
        compressedSize: 0,
        compressionRatio: 0,
        compressionTime,
        algorithm: options.algorithm || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compression error'
      };
    }
  }

  /**
   * Decompress data
   */
  async decompressData(
    compressedData: ArrayBuffer,
    algorithm: string,
    options: { useWorker?: boolean } = {}
  ): Promise<ArrayBuffer> {
    try {
      if (options.useWorker && this.compressionWorker) {
        return await this.decompressWithWorker(compressedData, algorithm);
      } else {
        return await this.decompressWithBuiltIn(compressedData, algorithm);
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      throw error;
    }
  }

  /**
   * Implement delta compression for incremental updates
   */
  async createDeltaCompression(
    baseData: ArrayBuffer,
    currentData: ArrayBuffer,
    baseVersion: string,
    currentVersion: string
  ): Promise<DeltaCompressionData> {
    try {
      const delta = await this.calculateDelta(baseData, currentData);
      const deltaCompressed = await this.compressData(delta);

      const deltaData: DeltaCompressionData = {
        baseVersion,
        currentVersion,
        delta: deltaCompressed.success ? new ArrayBuffer(deltaCompressed.compressedSize) : delta,
        metadata: {
          baseSize: baseData.byteLength,
          currentSize: currentData.byteLength,
          deltaSize: deltaCompressed.success ? deltaCompressed.compressedSize : delta.byteLength,
          compressionRatio: currentData.byteLength / (deltaCompressed.success ? deltaCompressed.compressedSize : delta.byteLength)
        }
      };

      // Cache delta for future use
      const deltaKey = `${baseVersion}->${currentVersion}`;
      this.deltaCache.set(deltaKey, deltaData);

      console.log(`Delta compression created: ${deltaData.metadata.compressionRatio.toFixed(2)}x reduction`);
      return deltaData;

    } catch (error) {
      console.error('Delta compression failed:', error);
      throw error;
    }
  }

  /**
   * Apply delta compression to reconstruct data
   */
  async applyDeltaCompression(
    baseData: ArrayBuffer,
    deltaData: DeltaCompressionData
  ): Promise<ArrayBuffer> {
    try {
      // Decompress delta if it was compressed
      const delta = deltaData.delta.byteLength < deltaData.metadata.deltaSize ?
        await this.decompressData(deltaData.delta, 'gzip') :
        deltaData.delta;

      // Apply delta to base data
      const reconstructedData = await this.applyDelta(baseData, delta);
      
      console.log(`Delta applied: reconstructed ${reconstructedData.byteLength} bytes`);
      return reconstructedData;

    } catch (error) {
      console.error('Delta application failed:', error);
      throw error;
    }
  }

  /**
   * Optimize image compression
   */
  async optimizeImageCompression(
    imageData: ArrayBuffer,
    options: {
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      quality?: number;
      progressive?: boolean;
    } = {}
  ): Promise<CompressionResult> {
    if (!this.config.enableImageCompression) {
      return {
        originalSize: imageData.byteLength,
        compressedSize: imageData.byteLength,
        compressionRatio: 1,
        compressionTime: 0,
        algorithm: 'none',
        success: true
      };
    }

    const startTime = performance.now();

    try {
      // Use Canvas API for image compression
      const optimizedImage = await this.compressImageWithCanvas(imageData, options);
      const compressionTime = performance.now() - startTime;
      
      return {
        originalSize: imageData.byteLength,
        compressedSize: optimizedImage.byteLength,
        compressionRatio: imageData.byteLength / optimizedImage.byteLength,
        compressionTime,
        algorithm: `image-${options.format || 'jpeg'}`,
        success: true
      };

    } catch (error) {
      return {
        originalSize: imageData.byteLength,
        compressedSize: 0,
        compressionRatio: 0,
        compressionTime: performance.now() - startTime,
        algorithm: 'image-compression',
        success: false,
        error: error instanceof Error ? error.message : 'Image compression failed'
      };
    }
  }

  /**
   * Implement streaming compression for large data
   */
  async compressStream(
    stream: ReadableStream<Uint8Array>,
    algorithm: 'gzip' | 'deflate' = 'gzip'
  ): Promise<ReadableStream<Uint8Array>> {
    if (!this.config.enableStreamingCompression) {
      return stream;
    }

    try {
      const compressionStream = new CompressionStream(algorithm);
      return stream.pipeThrough(compressionStream);
    } catch (error) {
      console.error('Streaming compression not supported:', error);
      return stream; // Fallback to original stream
    }
  }

  /**
   * Get compression metrics
   */
  getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get compression recommendations
   */
  getCompressionRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.compressionRatio < 2) {
      recommendations.push('Consider using higher compression levels for better ratios');
    }
    
    if (this.metrics.averageCompressionTime > 100) {
      recommendations.push('Consider using worker threads for compression to avoid blocking');
    }
    
    if (this.metrics.compressionHitRatio < 0.5) {
      recommendations.push('Enable compression caching to improve performance');
    }
    
    if (this.metrics.errorRate > 0.05) {
      recommendations.push('Review compression settings - high error rate detected');
    }

    return recommendations;
  }

  // Private methods

  private normalizeInput(data: string | ArrayBuffer | Uint8Array): ArrayBuffer {
    if (typeof data === 'string') {
      return new TextEncoder().encode(data).buffer;
    } else if (data instanceof Uint8Array) {
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } else {
      return data;
    }
  }

  private selectOptimalAlgorithm(data: ArrayBuffer): 'gzip' | 'brotli' | 'deflate' {
    // Simple heuristic: use brotli for text-like data, gzip for others
    const sample = new Uint8Array(data.slice(0, Math.min(1024, data.byteLength)));
    const textLikeRatio = this.calculateTextLikeRatio(sample);
    
    if (this.config.enableBrotliCompression && textLikeRatio > 0.7) {
      return 'brotli';
    } else if (this.config.enableGzipCompression) {
      return 'gzip';
    } else {
      return 'deflate';
    }
  }

  private calculateTextLikeRatio(data: Uint8Array): number {
    let textLikeBytes = 0;
    
    for (const byte of data) {
      // Count printable ASCII characters and common whitespace
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        textLikeBytes++;
      }
    }
    
    return textLikeBytes / data.length;
  }

  private async compressWithBuiltIn(
    data: ArrayBuffer,
    algorithm: string,
    level: number
  ): Promise<ArrayBuffer> {
    // Use CompressionStream API if available
    if ('CompressionStream' in window) {
      const stream = new CompressionStream(algorithm as any);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new Uint8Array(data));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    }
    
    // Fallback: return original data (no compression)
    console.warn(`Compression algorithm ${algorithm} not supported, returning original data`);
    return data;
  }

  private async decompressWithBuiltIn(
    data: ArrayBuffer,
    algorithm: string
  ): Promise<ArrayBuffer> {
    // Use DecompressionStream API if available
    if ('DecompressionStream' in window) {
      const stream = new DecompressionStream(algorithm as any);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new Uint8Array(data));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    }
    
    // Fallback: return original data
    console.warn(`Decompression algorithm ${algorithm} not supported, returning original data`);
    return data;
  }

  private async initializeCompressionWorker(): Promise<void> {
    try {
      const workerCode = `
        // Compression worker implementation
        self.onmessage = function(e) {
          const { type, data, algorithm, level } = e.data;
          
          try {
            if (type === 'compress') {
              // Implement compression logic here
              // For now, just echo back the data
              self.postMessage({
                type: 'compressed',
                data: data,
                success: true
              });
            } else if (type === 'decompress') {
              // Implement decompression logic here
              self.postMessage({
                type: 'decompressed',
                data: data,
                success: true
              });
            }
          } catch (error) {
            self.postMessage({
              type: 'error',
              error: error.message,
              success: false
            });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
      
      console.log('Compression worker initialized');
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
      this.config.enableClientSideCompression = false;
    }
  }

  private async compressWithWorker(
    data: ArrayBuffer,
    algorithm: string,
    level: number
  ): Promise<ArrayBuffer> {
    if (!this.compressionWorker) {
      throw new Error('Compression worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Compression worker timeout'));
      }, 30000);

      this.compressionWorker!.onmessage = (e) => {
        clearTimeout(timeout);
        
        if (e.data.success) {
          resolve(e.data.data);
        } else {
          reject(new Error(e.data.error));
        }
      };

      this.compressionWorker!.postMessage({
        type: 'compress',
        data,
        algorithm,
        level
      });
    });
  }

  private async decompressWithWorker(
    data: ArrayBuffer,
    algorithm: string
  ): Promise<ArrayBuffer> {
    if (!this.compressionWorker) {
      throw new Error('Compression worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Decompression worker timeout'));
      }, 30000);

      this.compressionWorker!.onmessage = (e) => {
        clearTimeout(timeout);
        
        if (e.data.success) {
          resolve(e.data.data);
        } else {
          reject(new Error(e.data.error));
        }
      };

      this.compressionWorker!.postMessage({
        type: 'decompress',
        data,
        algorithm
      });
    });
  }

  private async calculateDelta(baseData: ArrayBuffer, currentData: ArrayBuffer): Promise<ArrayBuffer> {
    // Simplified delta calculation (in practice, use a proper diff algorithm)
    const base = new Uint8Array(baseData);
    const current = new Uint8Array(currentData);
    
    // For now, just return the difference in size
    // A real implementation would use algorithms like bsdiff or similar
    const deltaSize = Math.abs(current.length - base.length);
    const delta = new Uint8Array(deltaSize);
    
    // Fill with difference data (simplified)
    for (let i = 0; i < deltaSize; i++) {
      delta[i] = i < current.length ? current[i] : 0;
    }
    
    return delta.buffer;
  }

  private async applyDelta(baseData: ArrayBuffer, delta: ArrayBuffer): Promise<ArrayBuffer> {
    // Simplified delta application
    const base = new Uint8Array(baseData);
    const deltaArray = new Uint8Array(delta);
    
    // For now, just combine the data (simplified)
    const result = new Uint8Array(base.length + deltaArray.length);
    result.set(base, 0);
    result.set(deltaArray, base.length);
    
    return result.buffer;
  }

  private async compressImageWithCanvas(
    imageData: ArrayBuffer,
    options: {
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      quality?: number;
      progressive?: boolean;
    }
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const format = `image/${options.format || 'jpeg'}`;
        const quality = options.quality || 0.8;
        
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(resolve).catch(reject);
          } else {
            reject(new Error('Image compression failed'));
          }
        }, format, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Convert ArrayBuffer to blob URL
      const blob = new Blob([imageData]);
      img.src = URL.createObjectURL(blob);
    });
  }

  private generateCacheKey(data: ArrayBuffer, options: any): string {
    // Simple hash function for cache key
    const dataView = new DataView(data.slice(0, Math.min(1024, data.byteLength)));
    let hash = 0;
    
    for (let i = 0; i < dataView.byteLength; i += 4) {
      hash ^= dataView.getUint32(i, true);
    }
    
    return `${hash}_${JSON.stringify(options)}`;
  }

  private updateMetrics(
    originalSize: number,
    compressedSize: number,
    compressionTime: number,
    fromCache: boolean
  ): void {
    this.metrics.totalBytesOriginal += originalSize;
    this.metrics.totalBytesCompressed += compressedSize;
    this.metrics.compressionRatio = this.metrics.totalBytesOriginal / this.metrics.totalBytesCompressed;
    this.metrics.averageCompressionTime = (this.metrics.averageCompressionTime + compressionTime) / 2;
    this.metrics.bandwidthSaved += (originalSize - compressedSize);
    
    if (fromCache) {
      this.metrics.compressionHitRatio = (this.metrics.compressionHitRatio + 1) / 2;
    } else {
      this.metrics.compressionHitRatio = (this.metrics.compressionHitRatio + 0) / 2;
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      // Update metrics periodically
      console.log('Compression metrics:', this.metrics);
    }, 60000); // Every minute
  }

  private startCleanupTasks(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 300000); // Every 5 minutes
  }

  private cleanupCache(): void {
    const maxAge = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    
    // Clean compression cache
    for (const [key, data] of this.compressionCache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.compressionCache.delete(key);
      }
    }
    
    // Clean delta cache
    for (const [key, data] of this.deltaCache.entries()) {
      // Keep delta cache longer as it's more expensive to recreate
      if (now - Date.now() > maxAge * 24) { // 24 hours
        this.deltaCache.delete(key);
      }
    }
  }

  /**
   * Destroy compression optimizer
   */
  destroy(): void {
    // Clear intervals
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);

    // Terminate worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    // Clear caches
    this.compressionCache.clear();
    this.deltaCache.clear();

    console.log('Compression optimizer destroyed');
  }
}

// Supporting interfaces

interface CompressedData {
  originalData: ArrayBuffer;
  compressedData: ArrayBuffer;
  algorithm: string;
  timestamp: number;
  compressionRatio: number;
}