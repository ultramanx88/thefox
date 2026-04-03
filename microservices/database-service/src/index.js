const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const redis = require('redis');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3012;

// Database connection pools
const masterPool = new Pool({
  host: process.env.DB_MASTER_HOST || 'postgres-user-master',
  port: 5432,
  database: 'user_db',
  user: 'postgres',
  password: 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const replicaPool = new Pool({
  host: process.env.DB_REPLICA_HOST || 'postgres-user-replica',
  port: 5432,
  database: 'user_db',
  user: 'postgres',
  password: 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Product shards
const productShard1Pool = new Pool({
  host: 'postgres-product-shard1',
  port: 5432,
  database: 'product_db_shard1',
  user: 'postgres',
  password: 'password',
  max: 20,
});

const productShard2Pool = new Pool({
  host: 'postgres-product-shard2',
  port: 5432,
  database: 'product_db_shard2',
  user: 'postgres',
  password: 'password',
  max: 20,
});

// Query cache
const queryCache = redis.createClient({
  url: 'redis://redis-query-cache:6379'
});

app.use(helmet());
app.use(cors());
app.use(express.json());

class DatabaseManager {
  constructor() {
    this.queryCache = queryCache;
    this.masterPool = masterPool;
    this.replicaPool = replicaPool;
    this.productShards = [productShard1Pool, productShard2Pool];
  }

  // Smart query routing
  async executeQuery(sql, params = [], options = {}) {
    const { useCache = true, cacheTime = 300, forceWrite = false } = options;
    
    // Generate cache key
    const cacheKey = `query:${Buffer.from(sql + JSON.stringify(params)).toString('base64')}`;
    
    // Check cache for read queries
    if (useCache && this.isReadQuery(sql)) {
      try {
        const cached = await this.queryCache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('Cache read error:', error.message);
      }
    }
    
    // Route query to appropriate database
    let pool;
    if (forceWrite || this.isWriteQuery(sql)) {
      pool = this.masterPool;
    } else {
      // Use replica for read queries
      pool = this.replicaPool;
    }
    
    try {
      const startTime = Date.now();
      const result = await pool.query(sql, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, sql);
      }
      
      // Cache read query results
      if (useCache && this.isReadQuery(sql) && result.rows) {
        try {
          await this.queryCache.setEx(cacheKey, cacheTime, JSON.stringify(result.rows));
        } catch (error) {
          console.warn('Cache write error:', error.message);
        }
      }
      
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Product sharding logic
  async executeProductQuery(sql, params = [], productId = null) {
    let shardIndex = 0;
    
    if (productId) {
      // Simple hash-based sharding
      shardIndex = parseInt(productId) % this.productShards.length;
    }
    
    const pool = this.productShards[shardIndex];
    
    try {
      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Product shard query error:', error);
      throw error;
    }
  }

  // Query type detection
  isReadQuery(sql) {
    const readKeywords = ['SELECT', 'WITH'];
    const upperSql = sql.trim().toUpperCase();
    return readKeywords.some(keyword => upperSql.startsWith(keyword));
  }

  isWriteQuery(sql) {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const upperSql = sql.trim().toUpperCase();
    return writeKeywords.some(keyword => upperSql.startsWith(keyword));
  }

  // Connection pool monitoring
  getPoolStats() {
    return {
      master: {
        totalCount: this.masterPool.totalCount,
        idleCount: this.masterPool.idleCount,
        waitingCount: this.masterPool.waitingCount
      },
      replica: {
        totalCount: this.replicaPool.totalCount,
        idleCount: this.replicaPool.idleCount,
        waitingCount: this.replicaPool.waitingCount
      },
      productShards: this.productShards.map((pool, index) => ({
        shard: index,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }))
    };
  }
}

const dbManager = new DatabaseManager();

// API endpoints
app.post('/query', async (req, res) => {
  try {
    const { sql, params, options } = req.body;
    const result = await dbManager.executeQuery(sql, params, options);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/product-query', async (req, res) => {
  try {
    const { sql, params, productId } = req.body;
    const result = await dbManager.executeProductQuery(sql, params, productId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database statistics
app.get('/stats', async (req, res) => {
  try {
    const poolStats = dbManager.getPoolStats();
    
    // Get cache stats
    const cacheInfo = await queryCache.info('memory');
    
    res.json({
      pools: poolStats,
      cache: {
        usedMemory: cacheInfo.used_memory_human,
        keys: await queryCache.dbSize()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query performance analysis
app.get('/slow-queries', async (req, res) => {
  try {
    // This would typically query pg_stat_statements
    const slowQueries = await dbManager.executeQuery(`
      SELECT query, calls, total_time, mean_time, rows
      FROM pg_stat_statements 
      ORDER BY mean_time DESC 
      LIMIT 10
    `, [], { forceWrite: false, useCache: false });
    
    res.json(slowQueries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cache management
app.delete('/cache', async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      const keys = await queryCache.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await queryCache.del(keys);
      }
      res.json({ cleared: keys.length, pattern });
    } else {
      await queryCache.flushDb();
      res.json({ cleared: 'all' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database optimization tasks
app.post('/optimize', async (req, res) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'analyze':
        await dbManager.executeQuery('ANALYZE;', [], { forceWrite: true });
        break;
      case 'vacuum':
        await dbManager.executeQuery('VACUUM ANALYZE;', [], { forceWrite: true });
        break;
      case 'reindex':
        await dbManager.executeQuery('REINDEX DATABASE user_db;', [], { forceWrite: true });
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json({ success: true, action });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'database-service',
    timestamp: new Date().toISOString()
  });
});

// Scheduled maintenance tasks
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily database maintenance...');
  try {
    await dbManager.executeQuery('ANALYZE;', [], { forceWrite: true });
    console.log('Database analysis completed');
  } catch (error) {
    console.error('Maintenance error:', error);
  }
});

// Initialize connections
async function initialize() {
  try {
    await queryCache.connect();
    console.log('Database service initialized');
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

initialize();

app.listen(PORT, () => {
  console.log(`Database Service running on port ${PORT}`);
});