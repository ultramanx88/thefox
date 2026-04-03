const { Pool } = require('pg');
const redis = require('redis');

class DatabaseConnection {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = options;
    
    // Initialize connection pools
    this.initializePools();
    
    // Initialize query cache
    this.initializeCache();
  }

  initializePools() {
    // Master database (writes)
    this.masterPool = new Pool({
      host: this.options.masterHost || 'pgbouncer-user',
      port: this.options.masterPort || 6432,
      database: this.options.database || 'user_db',
      user: this.options.user || 'postgres',
      password: this.options.password || 'password',
      max: this.options.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      statement_timeout: 30000,
      query_timeout: 30000
    });

    // Replica database (reads)
    this.replicaPool = new Pool({
      host: this.options.replicaHost || 'postgres-user-replica',
      port: this.options.replicaPort || 5432,
      database: this.options.database || 'user_db',
      user: this.options.user || 'postgres',
      password: this.options.password || 'password',
      max: this.options.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  initializeCache() {
    this.queryCache = redis.createClient({
      url: this.options.cacheUrl || 'redis://redis-query-cache:6379'
    });
    
    this.queryCache.connect().catch(console.error);
  }

  // Smart query execution with caching
  async query(sql, params = [], options = {}) {
    const {
      useCache = true,
      cacheTime = 300,
      forceWrite = false,
      timeout = 30000
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(sql, params);

    // Check cache for read queries
    if (useCache && this.isReadQuery(sql)) {
      try {
        const cached = await this.queryCache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn(`[${this.serviceName}] Cache read error:`, error.message);
      }
    }

    // Route to appropriate database
    const pool = (forceWrite || this.isWriteQuery(sql)) 
      ? this.masterPool 
      : this.replicaPool;

    try {
      const startTime = Date.now();
      const client = await pool.connect();
      
      try {
        const result = await client.query(sql, params);
        const duration = Date.now() - startTime;

        // Log performance metrics
        this.logQueryPerformance(sql, duration, result.rowCount);

        // Cache read query results
        if (useCache && this.isReadQuery(sql) && result.rows) {
          this.cacheResult(cacheKey, result.rows, cacheTime);
        }

        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Database error:`, error);
      throw error;
    }
  }

  // Transaction support
  async transaction(callback) {
    const client = await this.masterPool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Batch operations
  async batchInsert(table, columns, rows, options = {}) {
    if (!rows.length) return [];

    const { batchSize = 1000, onConflict = '' } = options;
    const results = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map((row, index) => {
        const placeholders = columns.map((_, colIndex) => 
          `$${index * columns.length + colIndex + 1}`
        ).join(', ');
        return `(${placeholders})`;
      }).join(', ');

      const flatParams = batch.flat();
      const sql = `
        INSERT INTO ${table} (${columns.join(', ')}) 
        VALUES ${values} 
        ${onConflict}
        RETURNING *
      `;

      const batchResult = await this.query(sql, flatParams, { forceWrite: true });
      results.push(...batchResult);
    }

    return results;
  }

  // Query helpers
  isReadQuery(sql) {
    const readKeywords = ['SELECT', 'WITH'];
    return readKeywords.some(keyword => 
      sql.trim().toUpperCase().startsWith(keyword)
    );
  }

  isWriteQuery(sql) {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    return writeKeywords.some(keyword => 
      sql.trim().toUpperCase().startsWith(keyword)
    );
  }

  generateCacheKey(sql, params) {
    const key = `${this.serviceName}:${sql}:${JSON.stringify(params)}`;
    return Buffer.from(key).toString('base64').substring(0, 250);
  }

  async cacheResult(key, data, ttl) {
    try {
      await this.queryCache.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn(`[${this.serviceName}] Cache write error:`, error.message);
    }
  }

  logQueryPerformance(sql, duration, rowCount) {
    if (duration > 1000) {
      console.warn(`[${this.serviceName}] Slow query (${duration}ms, ${rowCount} rows):`, 
        sql.substring(0, 100));
    }
  }

  // Connection monitoring
  getConnectionStats() {
    return {
      master: {
        total: this.masterPool.totalCount,
        idle: this.masterPool.idleCount,
        waiting: this.masterPool.waitingCount
      },
      replica: {
        total: this.replicaPool.totalCount,
        idle: this.replicaPool.idleCount,
        waiting: this.replicaPool.waitingCount
      }
    };
  }

  // Cache management
  async clearCache(pattern = null) {
    try {
      if (pattern) {
        const keys = await this.queryCache.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.queryCache.del(keys);
        }
        return keys.length;
      } else {
        await this.queryCache.flushDb();
        return 'all';
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Cache clear error:`, error);
      return 0;
    }
  }

  // Graceful shutdown
  async close() {
    try {
      await this.masterPool.end();
      await this.replicaPool.end();
      await this.queryCache.disconnect();
    } catch (error) {
      console.error(`[${this.serviceName}] Shutdown error:`, error);
    }
  }
}

// Query builder helpers
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectFields = ['*'];
    this.whereConditions = [];
    this.orderByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.params = [];
  }

  select(fields) {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  where(condition, value) {
    this.whereConditions.push(condition);
    if (value !== undefined) {
      this.params.push(value);
    }
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.orderByFields.push(`${field} ${direction}`);
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  offset(count) {
    this.offsetValue = count;
    return this;
  }

  build() {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.table}`;
    
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    
    if (this.orderByFields.length > 0) {
      sql += ` ORDER BY ${this.orderByFields.join(', ')}`;
    }
    
    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`;
    }
    
    if (this.offsetValue) {
      sql += ` OFFSET ${this.offsetValue}`;
    }
    
    return { sql, params: this.params };
  }
}

module.exports = { DatabaseConnection, QueryBuilder };