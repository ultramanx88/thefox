const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const promBundle = require('express-prom-bundle');
const client = require('prom-client');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const jaeger = require('jaeger-client');
const opentracing = require('opentracing');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3011;

// Prometheus metrics setup
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    service: 'monitoring-service'
  },
  promClient: {
    collectDefaultMetrics: {
      timeout: 1000
    }
  }
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const activeConnections = new client.Gauge({
  name: 'active_connections_total',
  help: 'Total number of active connections',
  labelNames: ['service']
});

const businessMetrics = new client.Counter({
  name: 'business_events_total',
  help: 'Total number of business events',
  labelNames: ['event_type', 'service']
});

// Jaeger tracing setup
const jaegerConfig = {
  serviceName: 'monitoring-service',
  sampler: {
    type: 'const',
    param: 1
  },
  reporter: {
    agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger',
    agentPort: 6832
  }
};

const tracer = jaeger.initTracer(jaegerConfig);
opentracing.initGlobalTracer(tracer);

// Winston logging setup
const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch-logs:9200'
  },
  index: 'thefox-logs'
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring-service' },
  transports: [
    new winston.transports.Console(),
    esTransport
  ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Request tracing middleware
app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  span.setTag('service.name', 'monitoring-service');
  
  req.span = span;
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode, 'monitoring-service')
      .observe(duration);
    
    span.setTag('http.status_code', res.statusCode);
    span.finish();
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check aggregator
app.get('/health/all', async (req, res) => {
  const span = tracer.startSpan('health_check_all');
  
  try {
    const services = [
      { name: 'user-service', url: 'http://user-service:3001/health' },
      { name: 'product-service', url: 'http://product-service:3002/health' },
      { name: 'order-service', url: 'http://order-service:3003/health' },
      { name: 'payment-service', url: 'http://payment-service:3004/health' },
      { name: 'notification-service', url: 'http://notification-service:3005/health' },
      { name: 'analytics-service', url: 'http://analytics-service:3006/health' },
      { name: 'search-service', url: 'http://search-service:3007/health' },
      { name: 'cache-service', url: 'http://cache-service:3008/health' },
      { name: 'security-service', url: 'http://security-service:3009/health' },
      { name: 'event-streaming-service', url: 'http://event-streaming-service:3010/health' }
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url, { timeout: 5000 });
          return {
            service: service.name,
            status: 'healthy',
            responseTime: response.headers['x-response-time'] || 'N/A',
            data: response.data
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'unhealthy',
            error: error.message
          };
        }
      })
    );

    const results = healthChecks.map(result => result.value || result.reason);
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const overallStatus = healthyCount === services.length ? 'healthy' : 'degraded';

    span.setTag('overall_status', overallStatus);
    span.setTag('healthy_services', healthyCount);
    span.setTag('total_services', services.length);

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
      summary: {
        total: services.length,
        healthy: healthyCount,
        unhealthy: services.length - healthyCount
      }
    });

    logger.info('Health check completed', {
      overallStatus,
      healthyServices: healthyCount,
      totalServices: services.length
    });

  } catch (error) {
    span.setTag('error', true);
    span.log({ error: error.message });
    
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    span.finish();
  }
});

// System metrics endpoint
app.get('/metrics/system', (req, res) => {
  const span = tracer.startSpan('system_metrics');
  
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform
    };

    span.setTag('memory_used', metrics.memory.heapUsed);
    span.setTag('uptime', metrics.uptime);

    res.json(metrics);
  } catch (error) {
    span.setTag('error', true);
    res.status(500).json({ error: error.message });
  } finally {
    span.finish();
  }
});

// Business metrics tracking
app.post('/metrics/business', (req, res) => {
  const span = tracer.startSpan('business_metrics');
  
  try {
    const { eventType, service, count = 1 } = req.body;
    
    businessMetrics.labels(eventType, service).inc(count);
    
    span.setTag('event_type', eventType);
    span.setTag('service', service);
    span.setTag('count', count);

    logger.info('Business metric recorded', { eventType, service, count });

    res.json({ success: true, eventType, service, count });
  } catch (error) {
    span.setTag('error', true);
    res.status(500).json({ error: error.message });
  } finally {
    span.finish();
  }
});

// Alert endpoint
app.post('/alerts', (req, res) => {
  const span = tracer.startSpan('alert_received');
  
  try {
    const { severity, service, message, details } = req.body;
    
    const alert = {
      timestamp: new Date().toISOString(),
      severity,
      service,
      message,
      details
    };

    span.setTag('severity', severity);
    span.setTag('service', service);

    logger.warn('Alert received', alert);

    // Here you would integrate with alerting systems like PagerDuty, Slack, etc.
    
    res.json({ success: true, alertId: Date.now().toString() });
  } catch (error) {
    span.setTag('error', true);
    res.status(500).json({ error: error.message });
  } finally {
    span.finish();
  }
});

// Distributed tracing test endpoint
app.get('/trace-test', (req, res) => {
  const span = tracer.startSpan('trace_test');
  
  span.setTag('test.type', 'distributed_tracing');
  
  // Simulate some work
  setTimeout(() => {
    const childSpan = tracer.startSpan('child_operation', { childOf: span });
    
    childSpan.setTag('operation', 'database_query');
    
    setTimeout(() => {
      childSpan.finish();
      span.finish();
      
      res.json({
        message: 'Trace test completed',
        traceId: span.context().toTraceId(),
        spanId: span.context().toSpanId()
      });
    }, 100);
  }, 50);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'monitoring-service',
    timestamp: new Date().toISOString()
  });
});

// Update active connections metric
setInterval(() => {
  activeConnections.labels('monitoring-service').set(Math.floor(Math.random() * 100));
}, 10000);

app.listen(PORT, () => {
  console.log(`Monitoring Service running on port ${PORT}`);
  logger.info('Monitoring Service started', { port: PORT });
});