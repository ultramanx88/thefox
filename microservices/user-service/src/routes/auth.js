const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationRules } = require('../../shared/securityManager');
const router = express.Router();

// Enhanced login with security
router.post('/login', 
  validationRules.email,
  validationRules.required('password'),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate user (connect to user DB)
      const user = await findUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        // Record failed attempt
        req.app.locals.securityManager?.recordFailedAttempt(req.ip);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Clear failed attempts on success
      req.app.locals.securityManager?.clearFailedAttempts(req.ip);
      
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        process.env.JWT_SECRET
      );
      
      // Log successful login
      console.log(`[AUTH] Successful login for user: ${user.email}`);
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        expiresIn: '24h'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Enhanced register with validation
router.post('/register', 
  validationRules.email,
  validationRules.password,
  validationRules.required('name'),
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Check if user already exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds
      const user = await createUser({ 
        email, 
        password: hashedPassword, 
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      
      // Log user registration
      console.log(`[AUTH] New user registered: ${email}`);
      
      res.status(201).json({ 
        message: 'User created successfully', 
        userId: user.id 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Mock functions (replace with actual DB calls)
async function findUserByEmail(email) {
  // Connect to PostgreSQL user database
  return null;
}

async function createUser(userData) {
  // Connect to PostgreSQL user database
  return { id: 1 };
}

module.exports = router;