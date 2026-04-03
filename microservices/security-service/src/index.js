const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3009;

// Redis client for rate limiting and blacklisting
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    store: new rateLimit.MemoryStore(),
    keyGenerator: (req) => {
      return req.ip + ':' + (req.headers['x-api-key'] || 'anonymous');
    }
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many auth attempts');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests');
const strictRateLimit = createRateLimit(15 * 60 * 1000, 10, 'Rate limit exceeded');

// Slow down middleware for brute force protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 2,
  delayMs: 500,
  maxDelayMs: 20000
});

// Input validation middleware
const validateInput = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  };
};

// JWT token validation
const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token is blacklisted' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// API Key validation
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    // Check if API key exists and is active
    const keyData = await redisClient.hGetAll(`apikey:${apiKey}`);
    
    if (!keyData.active || keyData.active !== 'true') {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }
    
    // Update usage count
    await redisClient.hIncrBy(`apikey:${apiKey}`, 'usage_count', 1);
    
    req.apiKey = keyData;
    next();
  } catch (error) {
    res.status(500).json({ error: 'API key validation failed' });
  }
};

// Security endpoints
app.post('/validate-token', validateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/blacklist-token', 
  validateInput([
    body('token').notEmpty().withMessage('Token is required')
  ]),
  async (req, res) => {
    try {
      const { token } = req.body;
      
      // Add token to blacklist with expiration
      await redisClient.setEx(`blacklist:${token}`, 24 * 60 * 60, 'true');
      
      res.json({ success: true, message: 'Token blacklisted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// API Key management
app.post('/api-keys', 
  validateInput([
    body('name').notEmpty().withMessage('API key name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array')
  ]),
  async (req, res) => {
    try {
      const { name, permissions } = req.body;
      
      // Generate secure API key
      const apiKey = 'ak_' + crypto.randomBytes(32).toString('hex');
      
      // Store API key data
      await redisClient.hSet(`apikey:${apiKey}`, {
        name,
        permissions: JSON.stringify(permissions),
        created_at: new Date().toISOString(),
        active: 'true',
        usage_count: '0'
      });
      
      res.status(201).json({ 
        apiKey, 
        name, 
        permissions,
        message: 'API key created successfully' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete('/api-keys/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    await redisClient.hSet(`apikey:${key}`, 'active', 'false');
    
    res.json({ success: true, message: 'API key deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security monitoring
app.get('/security/stats', async (req, res) => {
  try {
    const stats = {
      blacklisted_tokens: await redisClient.keys('blacklist:*').then(keys => keys.length),
      active_api_keys: 0,
      total_api_keys: 0
    };
    
    const apiKeys = await redisClient.keys('apikey:*');
    stats.total_api_keys = apiKeys.length;
    
    for (const key of apiKeys) {
      const keyData = await redisClient.hGet(key, 'active');
      if (keyData === 'true') {
        stats.active_api_keys++;
      }
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Input sanitization
app.post('/sanitize', 
  validateInput([
    body('data').notEmpty().withMessage('Data is required')
  ]),
  (req, res) => {
    try {
      const { data } = req.body;
      
      // Basic sanitization
      const sanitized = typeof data === 'string' 
        ? data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '')
        : data;
      
      res.json({ sanitized });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'security-service',
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to all routes
app.use('/auth', authRateLimit, speedLimiter);
app.use('/api', apiRateLimit);

redisClient.connect();

app.listen(PORT, () => {
  console.log(`Security Service running on port ${PORT}`);
});

module.exports = { 
  validateToken, 
  validateApiKey, 
  validateInput, 
  createRateLimit 
};