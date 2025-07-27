// Test file for Enhanced Cache Manager
import { IntelligentCacheManager } from '../cache-manager';

// Mock global objects
const mockCaches = {
  keys: jest.fn(),
  open: jest.fn(),
  delete: jest.fn(),
  match: jest.fn(),
};

const mockCache = {
  match: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

const mockResponse = {
  ok: true,
  headers: new Map([
    ['x-cached-time', Date.now().toString()],
    ['x-max-age', '3600']
  ]),
  blob: jest.fn().mockResolvedValue({ size: 1024 }),
  clone: jest.fn().mockReturnThis(),
};

// Setup global mocks
global.caches = mockCaches as any;
global.fetch = jest.fn().mockResolvedValue(mockResponse);
global.performance = {
  now: jest.fn().mockReturnValue(100),
} as any;

describe('IntelligentCacheManager', () => {
  let cacheManager: IntelligentCacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = IntelligentCacheManager.getInstance();
    
    mockCaches.open.mockResolvedValue(mockCache);
    mockCaches.keys.mockResolvedValue(['static-assets-v1', 'api-cache-v1']);
    mockCache.keys.mockResolvedValue([new Request('https://example.com/test.js')]);
    mockCache.match.mockResolvedValue(mockResponse);
  });

  describe('getOptimalStrategy', () => {
    it('should return static assets strategy for JS files', () => {
      const request = new Request('https://example.com/app.js');
      const strategy = cacheManager.getOptimalStrategy(request);
      
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('static-assets');
      expect(strategy?.handler).toBe('CacheFirst');
    });

    it('should return API strategy for API requests', () => {
      const request = new Request('https://example.com/api/users');
      const strategy = cacheManager.getOptimalStrategy(request);
      
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('api-responses');
      expect(strategy?.handler).toBe('NetworkFirst');
    });

    it('should return null for unmatched patterns', () => {
      const request = new Request('https://example.com/unknown');
      const strategy = cacheManager.getOptimalStrategy(request);
      
      expect(strategy).toBeNull();
    });
  });

  describe('getCacheUsageStats', () => {
    it('should return cache statistics', async () => {
      const stats = await cacheManager.getCacheUsageStats();
      
      expect(stats).toBeInstanceOf(Map);
      expect(mockCaches.keys).toHaveBeenCalled();
      expect(mockCaches.open).toHaveBeenCalledWith('static-assets-v1');
      expect(mockCaches.open).toHaveBeenCalledWith('api-cache-v1');
    });
  });

  describe('updateCacheStats', () => {
    it('should update hit ratio correctly', () => {
      cacheManager.updateCacheStats('test-cache', true, 150);
      cacheManager.updateCacheStats('test-cache', true, 200);
      cacheManager.updateCacheStats('test-cache', false, 300);
      
      // After 3 requests (2 hits, 1 miss), hit ratio should be 2/3
      const stats = (cacheManager as any).cacheStats.get('test-cache');
      expect(stats.hitRatio).toBeCloseTo(2/3, 2);
      expect(stats.totalRequests).toBe(3);
    });

    it('should update average response time correctly', () => {
      cacheManager.updateCacheStats('test-cache', true, 100);
      cacheManager.updateCacheStats('test-cache', true, 200);
      
      const stats = (cacheManager as any).cacheStats.get('test-cache');
      expect(stats.averageResponseTime).toBe(150);
    });
  });

  describe('evictLeastUsed', () => {
    it('should remove oldest cache entries', async () => {
      const oldRequest = new Request('https://example.com/old.js');
      const newRequest = new Request('https://example.com/new.js');
      
      mockCache.keys.mockResolvedValue([oldRequest, newRequest]);
      mockCache.match
        .mockResolvedValueOnce({
          ...mockResponse,
          headers: new Map([['x-last-accessed', '1000']])
        })
        .mockResolvedValueOnce({
          ...mockResponse,
          headers: new Map([['x-last-accessed', '2000']])
        });

      await cacheManager.evictLeastUsed();
      
      expect(mockCache.delete).toHaveBeenCalledWith(oldRequest);
    });
  });

  describe('evictExpired', () => {
    it('should remove expired cache entries', async () => {
      const expiredRequest = new Request('https://example.com/expired.js');
      const validRequest = new Request('https://example.com/valid.js');
      
      const now = Date.now();
      mockCache.keys.mockResolvedValue([expiredRequest, validRequest]);
      mockCache.match
        .mockResolvedValueOnce({
          ...mockResponse,
          headers: new Map([
            ['x-cached-time', (now - 7200000).toString()], // 2 hours ago
            ['x-max-age', '3600'] // 1 hour max age
          ])
        })
        .mockResolvedValueOnce({
          ...mockResponse,
          headers: new Map([
            ['x-cached-time', (now - 1800000).toString()], // 30 minutes ago
            ['x-max-age', '3600'] // 1 hour max age
          ])
        });

      await cacheManager.evictExpired();
      
      expect(mockCache.delete).toHaveBeenCalledWith(expiredRequest);
      expect(mockCache.delete).not.toHaveBeenCalledWith(validRequest);
    });
  });

  describe('prefetchPredictedResources', () => {
    it('should prefetch frequently accessed resources', async () => {
      // Simulate browsing patterns
      (cacheManager as any).browsingPatterns = [
        {
          url: 'https://example.com/popular.js',
          frequency: 10,
          lastAccessed: new Date(),
          timeOfDay: new Array(24).fill(0).map((_, i) => i === new Date().getHours() ? 5 : 0),
          userAgent: 'test'
        },
        {
          url: 'https://example.com/unpopular.js',
          frequency: 2,
          lastAccessed: new Date(),
          timeOfDay: new Array(24).fill(0),
          userAgent: 'test'
        }
      ];

      await cacheManager.prefetchPredictedResources();
      
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/popular.js');
      expect(mockCache.put).toHaveBeenCalled();
    });
  });

  describe('optimizeMemoryUsage', () => {
    it('should trigger cleanup when memory usage is high', async () => {
      // Mock high memory usage
      global.performance = {
        ...global.performance,
        memory: {
          usedJSHeapSize: 200 * 1024 * 1024, // 200MB (above threshold)
        }
      } as any;

      const evictSpy = jest.spyOn(cacheManager, 'evictLeastUsed');
      const expiredSpy = jest.spyOn(cacheManager, 'evictExpired');

      await cacheManager.optimizeMemoryUsage();

      expect(evictSpy).toHaveBeenCalled();
      expect(expiredSpy).toHaveBeenCalled();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches and reset state', async () => {
      await cacheManager.clearAllCaches();
      
      expect(mockCaches.delete).toHaveBeenCalledWith('static-assets-v1');
      expect(mockCaches.delete).toHaveBeenCalledWith('api-cache-v1');
      
      const patterns = cacheManager.getBrowsingPatterns();
      expect(patterns).toHaveLength(0);
    });
  });
});

describe('Cache Strategy Optimization', () => {
  let cacheManager: IntelligentCacheManager;

  beforeEach(() => {
    cacheManager = IntelligentCacheManager.getInstance();
  });

  it('should switch to more aggressive caching when hit ratio is low', () => {
    // Set up low hit ratio stats
    (cacheManager as any).cacheStats.set('api-responses', {
      hitRatio: 0.5, // Below threshold of 0.85
      averageResponseTime: 100,
      totalRequests: 100
    });

    const request = new Request('https://example.com/api/test');
    const strategy = cacheManager.getOptimalStrategy(request);

    expect(strategy?.handler).toBe('StaleWhileRevalidate');
  });

  it('should prioritize cache when response time is high', () => {
    // Set up high response time stats
    (cacheManager as any).cacheStats.set('static-assets', {
      hitRatio: 0.9,
      averageResponseTime: 500, // Above threshold of 200ms
      totalRequests: 100
    });

    const request = new Request('https://example.com/app.js');
    const strategy = cacheManager.getOptimalStrategy(request);

    expect(strategy?.options.priority).toBe('high');
  });
});