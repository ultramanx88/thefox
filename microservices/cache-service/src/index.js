const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const Redis = require('ioredis');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3008;

// Multi-layer caching setup
const redisCluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 }
], {
  enableOfflineQueue: false,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

const memoryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
  maxKeys: 10000
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Cache middleware
const cacheMiddleware = (ttl = 300, useMemory = true) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      // Check memory cache first (L1)
      if (useMemory) {
        const memoryResult = memoryCache.get(key);
        if (memoryResult) {
          res.set('X-Cache', 'HIT-MEMORY');
          return res.json(memoryResult);
        }
      }
      
      // Check Redis cache (L2)
      const redisResult = await redisCluster.get(key);
      if (redisResult) {
        const data = JSON.parse(redisResult);
        
        // Store in memory cache for next time
        if (useMemory) {
          memoryCache.set(key, data, ttl);
        }
        
        res.set('X-Cache', 'HIT-REDIS');
        return res.json(data);
      }
      
      // Cache miss - continue to handler
      res.set('X-Cache', 'MISS');
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Store in Redis
        redisCluster.setex(key, ttl, JSON.stringify(data));
        
        // Store in memory cache
        if (useMemory) {
          memoryCache.set(key, data, ttl);
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Cache management endpoints
app.get('/cache/stats', (req, res) => {
  const memoryStats = memoryCache.getStats();
  
  res.json({
    memory: {
      keys: memoryStats.keys,
      hits: memoryStats.hits,
      misses: memoryStats.misses,
      hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0
    },
    redis: {
      status: redisCluster.status,
      nodes: redisCluster.nodes().length
    }
  });
});

app.delete('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      // Clear specific pattern
      const keys = await redisCluster.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redisCluster.del(...keys);
      }
      
      // Clear from memory cache
      memoryCache.keys().forEach(key => {
        if (key.includes(pattern)) {
          memoryCache.del(key);
        }
      });
      
      res.json({ cleared: keys.length, pattern });
    } else {
      // Clear all
      await redisCluster.flushall();
      memoryCache.flushAll();
      
      res.json({ cleared: 'all' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/cache/keys', async (req, res) => {
  try {
    const { pattern = '*' } = req.query;
    const keys = await redisCluster.keys(pattern);
    
    res.json({
      keys: keys.slice(0, 100), // Limit to 100 keys
      total: keys.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cache warming endpoints
app.post('/cache/warm', async (req, res) => {
  try {
    const { endpoints } = req.body;
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:8080${endpoint}`);
        const data = await response.json();
        
        const key = `cache:${endpoint}`;
        await redisCluster.setex(key, 3600, JSON.stringify(data));
        memoryCache.set(key, data, 3600);
        
        results.push({ endpoint, status: 'warmed' });
      } catch (error) {
        results.push({ endpoint, status: 'failed', error: error.message });
      }
    }
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'cache-service',
    redis: redisCluster.status,
    memory: memoryCache.getStats()
  });
});

// Export middleware for other services
app.get('/middleware', (req, res) => {
  res.json({
    usage: 'Import cacheMiddleware from cache-service',
    example: 'app.get("/products", cacheMiddleware(300), handler)'
  });
});

app.listen(PORT, () => {
  console.log(`Cache Service running on port ${PORT}`);
});

module.exports = { cacheMiddleware };