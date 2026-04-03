const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const redis = require('redis');

class SecurityManager {
  constructor(options = {}) {
    this.redisClient = redis.createClient({
      url: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.redisClient.connect();
    
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.securityServiceUrl = options.securityServiceUrl || 'http://security-service:3009';
  }

  // Enhanced helmet configuration
  getHelmetConfig() {
    return helmet({
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
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // Rate limiting factory
  createRateLimit(windowMs = 15 * 60 * 1000, max = 100, message = 'Rate limit exceeded') {
    return rateLimit({
      windowMs,
      max,
      message: { error: message },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip + ':' + (req.headers['x-api-key'] || 'anonymous');
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      }
    });
  }

  // JWT validation middleware
  validateJWT(options = {}) {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        // Check blacklist
        const isBlacklisted = await this.redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({ error: 'Token is blacklisted' });
        }

        const decoded = jwt.verify(token, this.jwtSecret);
        
        // Check token expiration
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          return res.status(401).json({ error: 'Token expired' });
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  // API Key validation middleware
  validateApiKey() {
    return async (req, res, next) => {
      try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
          return res.status(401).json({ error: 'API key required' });
        }

        const keyData = await this.redisClient.hGetAll(`apikey:${apiKey}`);
        
        if (!keyData.active || keyData.active !== 'true') {
          return res.status(401).json({ error: 'Invalid or inactive API key' });
        }

        // Update usage count
        await this.redisClient.hIncrBy(`apikey:${apiKey}`, 'usage_count', 1);
        
        req.apiKey = keyData;
        next();
      } catch (error) {
        res.status(500).json({ error: 'API key validation failed' });
      }
    };
  }

  // Input validation middleware
  validateInput(validations) {
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
  }

  // Input sanitization
  sanitizeInput() {
    return (req, res, next) => {
      const sanitize = (obj) => {
        if (typeof obj === 'string') {
          return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            obj[key] = sanitize(obj[key]);
          }
        }
        return obj;
      };

      req.body = sanitize(req.body);
      req.query = sanitize(req.query);
      req.params = sanitize(req.params);
      
      next();
    };
  }

  // CORS configuration
  getCorsConfig(allowedOrigins = ['http://localhost:3000']) {
    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposedHeaders: ['X-Total-Count', 'X-Cache']
    };
  }

  // Security logging
  logSecurityEvent(event, details) {
    console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, details);
    
    // Store in Redis for monitoring
    this.redisClient.lPush('security_events', JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      details
    }));
  }

  // Brute force protection
  bruteForceProtection(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    return async (req, res, next) => {
      const key = `brute_force:${req.ip}`;
      
      try {
        const attempts = await this.redisClient.get(key);
        
        if (attempts && parseInt(attempts) >= maxAttempts) {
          this.logSecurityEvent('BRUTE_FORCE_BLOCKED', { ip: req.ip });
          return res.status(429).json({ 
            error: 'Too many failed attempts. Try again later.' 
          });
        }
        
        next();
      } catch (error) {
        next();
      }
    };
  }

  // Record failed attempt
  recordFailedAttempt(ip) {
    const key = `brute_force:${ip}`;
    this.redisClient.incr(key);
    this.redisClient.expire(key, 15 * 60); // 15 minutes
  }

  // Clear failed attempts on success
  clearFailedAttempts(ip) {
    const key = `brute_force:${ip}`;
    this.redisClient.del(key);
  }
}

// Common validation rules
const validationRules = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  phone: body('phone').isMobilePhone(),
  id: body('id').isUUID(),
  required: (field) => body(field).notEmpty().withMessage(`${field} is required`)
};

module.exports = { SecurityManager, validationRules };