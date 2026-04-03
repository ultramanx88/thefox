const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const moment = require('moment');
const EventBus = require('../shared/eventBus');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

const eventBus = new EventBus();

// Track event
app.post('/track', async (req, res) => {
  try {
    const { event, userId, properties } = req.body;
    
    const eventData = {
      event,
      userId,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: req.headers['session-id']
    };
    
    await saveEvent(eventData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analytics = {
      totalUsers: await getTotalUsers(startDate, endDate),
      totalOrders: await getTotalOrders(startDate, endDate),
      revenue: await getRevenue(startDate, endDate),
      topProducts: await getTopProducts(startDate, endDate),
      userActivity: await getUserActivity(startDate, endDate)
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time metrics
app.get('/realtime', async (req, res) => {
  try {
    const metrics = {
      activeUsers: await getActiveUsers(),
      currentOrders: await getCurrentOrders(),
      revenueToday: await getRevenueToday()
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'analytics-service' });
});

// Event listeners
async function setupEventListeners() {
  await eventBus.connect();
  
  await eventBus.subscribe('user.registered', trackUserRegistration);
  await eventBus.subscribe('order.created', trackOrderCreated);
  await eventBus.subscribe('payment.completed', trackPaymentCompleted);
  await eventBus.subscribe('product.viewed', trackProductView);
}

async function trackUserRegistration(data) {
  await saveEvent({
    event: 'user_registered',
    userId: data.userId,
    timestamp: new Date().toISOString()
  });
}

async function trackOrderCreated(data) {
  await saveEvent({
    event: 'order_created',
    userId: data.userId,
    properties: { orderId: data.orderId, amount: data.amount },
    timestamp: new Date().toISOString()
  });
}

async function trackPaymentCompleted(data) {
  await saveEvent({
    event: 'payment_completed',
    properties: { orderId: data.orderId, amount: data.amount },
    timestamp: new Date().toISOString()
  });
}

async function trackProductView(data) {
  await saveEvent({
    event: 'product_viewed',
    userId: data.userId,
    properties: { productId: data.productId },
    timestamp: new Date().toISOString()
  });
}

// Mock analytics functions
async function saveEvent(eventData) {
  console.log('Saving event:', eventData);
}

async function getTotalUsers(startDate, endDate) {
  return 1250;
}

async function getTotalOrders(startDate, endDate) {
  return 340;
}

async function getRevenue(startDate, endDate) {
  return 125000;
}

async function getTopProducts(startDate, endDate) {
  return [
    { id: 1, name: 'Product A', sales: 50 },
    { id: 2, name: 'Product B', sales: 35 }
  ];
}

async function getUserActivity(startDate, endDate) {
  return {
    daily: [100, 120, 90, 150, 200, 180, 160],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };
}

async function getActiveUsers() {
  return 45;
}

async function getCurrentOrders() {
  return 12;
}

async function getRevenueToday() {
  return 8500;
}

setupEventListeners();

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});