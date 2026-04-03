const client = require('prom-client');
const winston = require('winston');
const jaeger = require('jaeger-client');
const opentracing = require('opentracing');

class MonitoringManager {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = options;
    
    // Initialize Prometheus metrics
    this.initMetrics();
    
    // Initialize logging
    this.initLogging();
    
    // Initialize tracing
    this.initTracing();
  }

  initMetrics() {
    // Default metrics collection
    client.collectDefaultMetrics({
      timeout: 5000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      prefix: `${this.serviceName}_`
    });

    // HTTP request metrics
    this.httpRequestDuration = new client.Histogram({
      name: `${this.serviceName}_http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    this.httpRequestsTotal = new client.Counter({
      name: `${this.serviceName}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Business metrics
    this.businessEventsTotal = new client.Counter({
      name: `${this.serviceName}_business_events_total`,
      help: 'Total number of business events',
      labelNames: ['event_type']
    });

    // Database metrics
    this.dbConnectionsActive = new client.Gauge({
      name: `${this.serviceName}_db_connections_active`,
      help: 'Number of active database connections'
    });

    this.dbQueryDuration = new client.Histogram({
      name: `${this.serviceName}_db_query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
    });

    // Cache metrics
    this.cacheHitsTotal = new client.Counter({
      name: `${this.serviceName}_cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_type']
    });

    this.cacheMissesTotal = new client.Counter({
      name: `${this.serviceName}_cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_type']
    });
  }

  initLogging() {
    this.logger = winston.createLogger({
      level: this.options.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: this.serviceName,
        version: process.env.SERVICE_VERSION || '1.0.0'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add Elasticsearch transport if configured
    if (this.options.elasticsearchUrl) {
      const { ElasticsearchTransport } = require('winston-elasticsearch');
      this.logger.add(new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: this.options.elasticsearchUrl
        },
        index: 'thefox-logs'
      }));
    }
  }

  initTracing() {
    const jaegerConfig = {
      serviceName: this.serviceName,
      sampler: {
        type: 'const',
        param: this.options.tracingSampleRate || 1
      },
      reporter: {
        agentHost: this.options.jaegerHost || 'jaeger',
        agentPort: this.options.jaegerPort || 6832
      }
    };

    this.tracer = jaeger.initTracer(jaegerConfig);
    
    if (!opentracing.globalTracer()) {
      opentracing.initGlobalTracer(this.tracer);
    }
  }

  // Express middleware for monitoring
  getExpressMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const span = this.tracer.startSpan(`${req.method} ${req.path}`);
      
      span.setTag('http.method', req.method);
      span.setTag('http.url', req.url);
      span.setTag('service.name', this.serviceName);
      
      req.span = span;
      req.logger = this.logger;
      
      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;
        
        // Record metrics
        this.httpRequestDuration
          .labels(req.method, route, res.statusCode)
          .observe(duration);
        
        this.httpRequestsTotal
          .labels(req.method, route, res.statusCode)
          .inc();
        
        // Update span
        span.setTag('http.status_code', res.statusCode);
        if (res.statusCode >= 400) {
          span.setTag('error', true);
        }
        span.finish();
        
        // Log request
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          traceId: span.context().toTraceId()
        });
      });
      
      next();
    };
  }

  // Business event tracking
  trackBusinessEvent(eventType, data = {}) {
    this.businessEventsTotal.labels(eventType).inc();
    
    this.logger.info('Business Event', {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Database monitoring
  trackDbQuery(operation, table, duration) {
    this.dbQueryDuration.labels(operation, table).observe(duration);
  }

  setDbConnections(count) {
    this.dbConnectionsActive.set(count);
  }

  // Cache monitoring
  trackCacheHit(cacheType) {
    this.cacheHitsTotal.labels(cacheType).inc();
  }

  trackCacheMiss(cacheType) {
    this.cacheMissesTotal.labels(cacheType).inc();
  }

  // Error tracking
  trackError(error, context = {}) {
    this.logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Performance monitoring
  measurePerformance(name, fn) {
    return async (...args) => {
      const span = this.tracer.startSpan(name);
      const startTime = Date.now();
      
      try {
        const result = await fn(...args);
        const duration = (Date.now() - startTime) / 1000;
        
        span.setTag('duration', duration);
        span.setTag('success', true);
        
        return result;
      } catch (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        this.trackError(error, { operation: name });
        throw error;
      } finally {
        span.finish();
      }
    };
  }

  // Health check helper
  async healthCheck() {
    return {
      status: 'healthy',
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.SERVICE_VERSION || '1.0.0'
    };
  }

  // Metrics endpoint
  getMetricsEndpoint() {
    return async (req, res) => {
      try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
      } catch (error) {
        res.status(500).end(error.message);
      }
    };
  }
}

module.exports = { MonitoringManager };