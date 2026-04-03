const express = require('express');
const cors = require('cors');
const { AIAssistant } = require('./chatbot');
const IngredientRecommendationEngine = require('./recommendation-engine');
const SupplyChainIntelligence = require('./business-intelligence');

class AIService {
  constructor() {
    this.app = express();
    this.aiAssistant = new AIAssistant();
    this.recommendationEngine = new IngredientRecommendationEngine();
    this.supplyChainIntelligence = new SupplyChainIntelligence();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // AI Chatbot Routes
    this.app.post('/api/ai/chat', async (req, res) => {
      try {
        const { message, userType, context } = req.body;
        const response = await this.aiAssistant.chat(message, userType, context);
        res.json({ success: true, response });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Ingredient Recommendation Routes
    this.app.post('/api/ai/recommend/ingredients', async (req, res) => {
      try {
        const { businessId, ingredients, limit } = req.body;
        const recommendations = this.recommendationEngine.recommendIngredients(businessId, ingredients, limit);
        res.json({ success: true, recommendations });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/ai/recommend/suppliers', async (req, res) => {
      try {
        const { businessId, suppliers } = req.body;
        const recommendations = this.recommendationEngine.recommendSuppliers(businessId, suppliers);
        res.json({ success: true, recommendations });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/ai/trends/ingredients', async (req, res) => {
      try {
        const { timeRange } = req.query;
        const trends = this.recommendationEngine.analyzeIngredientTrends(parseInt(timeRange) || 30);
        res.json({ success: true, trends });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Supply Chain Intelligence Routes
    this.app.get('/api/ai/analytics/supplier/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const analytics = this.supplyChainIntelligence.analyzeSupplierPerformance(id);
        res.json({ success: true, analytics });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/ai/predict/demand', async (req, res) => {
      try {
        const { ingredientId, days } = req.body;
        const prediction = this.supplyChainIntelligence.predictIngredientDemand(ingredientId, days);
        res.json({ success: true, prediction });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/ai/analytics/supply-chain', async (req, res) => {
      try {
        const analytics = this.supplyChainIntelligence.analyzeSupplyChain();
        res.json({ success: true, analytics });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/ai/analytics/prices/:ingredientId', async (req, res) => {
      try {
        const { ingredientId } = req.params;
        const priceAnalysis = this.supplyChainIntelligence.analyzeMarketPrices(ingredientId);
        res.json({ success: true, priceAnalysis });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Data Input Routes
    this.app.post('/api/ai/data/order', async (req, res) => {
      try {
        const order = req.body;
        this.recommendationEngine.addOrder(order);
        res.json({ success: true, message: 'Order data added' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/ai/data/sales', async (req, res) => {
      try {
        const { restaurantId, date, sales, orders } = req.body;
        this.businessIntelligence.addSalesData(restaurantId, date, sales, orders);
        res.json({ success: true, message: 'Sales data added' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Health Check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          chatbot: 'active',
          ingredientRecommendations: 'active',
          supplyChainAnalytics: 'active'
        }
      });
    });
  }

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`🤖 AI Service running on port ${port}`);
      console.log(`📊 Available endpoints:`);
      console.log(`   POST /api/ai/chat - AI Chatbot`);
      console.log(`   POST /api/ai/recommend/ingredients - Ingredient Recommendations`);
      console.log(`   POST /api/ai/recommend/suppliers - Supplier Recommendations`);
      console.log(`   GET  /api/ai/trends/ingredients - Ingredient Trends Analysis`);
      console.log(`   GET  /api/ai/analytics/supplier/:id - Supplier Performance`);
      console.log(`   POST /api/ai/predict/demand - Demand Prediction`);
      console.log(`   GET  /api/ai/analytics/supply-chain - Supply Chain Analysis`);
      console.log(`   GET  /api/ai/analytics/prices/:id - Price Analysis`);
    });
  }
}

// Start service if run directly
if (require.main === module) {
  const aiService = new AIService();
  aiService.start();
}

module.exports = AIService;