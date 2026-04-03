const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { CacheManager, createCacheMiddleware } = require('../shared/cacheManager');
const { SecurityManager, validationRules } = require('../shared/securityManager');
const { MonitoringManager } = require('../shared/monitoringManager');
const { DatabaseConnection } = require('../shared/databaseConnection');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize monitoring, security, cache, and database
const monitoring = new MonitoringManager('user-service', {
  elasticsearchUrl: process.env.ELASTICSEARCH_URL,
  jaegerHost: process.env.JAEGER_HOST || 'jaeger'
});
const securityManager = new SecurityManager();
const cacheManager = new CacheManager({
  memoryTTL: 600,
  maxKeys: 10000
});
const cache = createCacheMiddleware(cacheManager);
const db = new DatabaseConnection('user-service', {
  database: 'user_db',
  masterHost: 'pgbouncer-user',
  replicaHost: 'postgres-user-replica'
});

// Monitoring middleware
app.use(monitoring.getExpressMiddleware());

// Security middleware
app.use(securityManager.getHelmetConfig());
app.use(cors(securityManager.getCorsConfig()));
app.use(express.json({ limit: '10mb' }));
app.use(securityManager.sanitizeInput());

// Rate limiting
app.use('/auth', securityManager.createRateLimit(15 * 60 * 1000, 5, 'Too many auth attempts'));
app.use(securityManager.createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));

// Metrics endpoint
app.get('/metrics', monitoring.getMetricsEndpoint());

// Routes with security
app.use('/auth', authRoutes);
app.use('/users', securityManager.validateJWT(), userRoutes);

// Database performance endpoint
app.get('/db/stats', async (req, res) => {
  try {
    const stats = db.getConnectionStats();
    res.json(stats);
  } catch (error) {
    monitoring.trackError(error, { endpoint: '/db/stats' });
    res.status(500).json({ error: error.message });
  }
});

// Health check with monitoring and database
app.get('/health', async (req, res) => {
  try {
    const health = await monitoring.healthCheck();
    const dbStats = db.getConnectionStats();
    
    res.json({
      ...health,
      database: {
        master: dbStats.master,
        replica: dbStats.replica
      }
    });
  } catch (error) {
    monitoring.trackError(error, { endpoint: '/health' });
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});