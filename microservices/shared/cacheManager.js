const Redis = require('ioredis');
const NodeCache = require('node-cache');

class CacheManager {
  constructor(options = {}) {
    this.redisCluster = new Redis.Cluster([
      { host: process.env.REDIS_1_HOST || 'redis-1', port: 6379 },
      { host: process.env.REDIS_2_HOST || 'redis-2', port: 6379 },
      { host: process.env.REDIS_3_HOST || 'redis-3', port: 6379 }
    ], {
      enableOfflineQueue: false,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      ...options.redis
    });

    this.memoryCache = new NodeCache({
      stdTTL: options.memoryTTL || 300,
      checkperiod: 60,
      maxKeys: options.maxKeys || 10000
    });
  }

  async get(key, useMemory = true) {
    try {
      // Check memory cache first (L1)
      if (useMemory) {
        const memoryResult = this.memoryCache.get(key);
        if (memoryResult !== undefined) {
          return { data: memoryResult, source: 'memory' };
        }
      }

      // Check Redis cache (L2)
      const redisResult = await this.redisCluster.get(key);
      if (redisResult) {
        const data = JSON.parse(redisResult);
        
        // Store in memory cache for next time
        if (useMemory) {
          this.memoryCache.set(key, data);
        }
        
        return { data, source: 'redis' };
      }

      return { data: null, source: 'miss' };
    } catch (error) {
      console.error('Cache get error:', error);
      return { data: null, source: 'error' };
    }
  }

  async set(key, data, ttl = 300, useMemory = true) {
    try {
      // Store in Redis
      await this.redisCluster.setex(key, ttl, JSON.stringify(data));
      
      // Store in memory cache
      if (useMemory) {
        this.memoryCache.set(key, data, ttl);
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redisCluster.del(key);
      this.memoryCache.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear(pattern) {
    try {
      if (pattern) {
        const keys = await this.redisCluster.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redisCluster.del(...keys);
        }
        
        // Clear from memory cache
        this.memoryCache.keys().forEach(key => {
          if (key.includes(pattern)) {
            this.memoryCache.del(key);
          }
        });
      } else {
        await this.redisCluster.flushall();
        this.memoryCache.flushAll();
      }
      
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Cache-aside pattern
  async getOrSet(key, fetchFunction, ttl = 300, useMemory = true) {
    const cached = await this.get(key, useMemory);
    
    if (cached.data !== null) {
      return { data: cached.data, cached: true, source: cached.source };
    }
    
    // Fetch fresh data
    try {
      const freshData = await fetchFunction();
      await this.set(key, freshData, ttl, useMemory);
      return { data: freshData, cached: false, source: 'fresh' };
    } catch (error) {
      console.error('Fetch function error:', error);
      throw error;
    }
  }

  // Write-through pattern
  async setAndReturn(key, data, ttl = 300, useMemory = true) {
    await this.set(key, data, ttl, useMemory);
    return data;
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      redis: {
        status: this.redisCluster.status,
        nodes: this.redisCluster.nodes().length
      }
    };
  }
}

// Express middleware factory
function createCacheMiddleware(cacheManager, defaultTTL = 300) {
  return (ttl = defaultTTL, useMemory = true, keyGenerator = null) => {
    return async (req, res, next) => {
      const key = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
      
      const cached = await cacheManager.get(key, useMemory);
      
      if (cached.data !== null) {
        res.set('X-Cache', `HIT-${cached.source.toUpperCase()}`);
        return res.json(cached.data);
      }
      
      res.set('X-Cache', 'MISS');
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        cacheManager.set(key, data, ttl, useMemory);
        return originalJson.call(this, data);
      };
      
      next();
    };
  };
}

module.exports = { CacheManager, createCacheMiddleware };