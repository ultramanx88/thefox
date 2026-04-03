const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { EventBus, EventPatterns } = require('../shared/eventBus');

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize event bus
const eventBus = new EventBus({
  clientId: 'order-service',
  brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092']
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Cart operations
app.get('/cart/:userId', async (req, res) => {
  try {
    const cart = await getCart(req.params.userId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/cart/:userId/items', async (req, res) => {
  try {
    const result = await addToCart(req.params.userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders with event streaming
app.post('/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);
    
    // Publish order created event
    await eventBus.publish(
      'OrderCreated',
      'Order',
      order.id,
      {
        orderId: order.id,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        status: 'pending'
      },
      {
        correlationId: req.headers['x-correlation-id'],
        metadata: { source: 'order-service' }
      }
    );
    
    // Start order processing saga
    const sagaId = await eventBus.startSaga(
      'OrderProcessing',
      { orderId: order.id, userId: order.userId },
      [
        { step: 'ValidateInventory', service: 'product-service' },
        { step: 'ProcessPayment', service: 'payment-service' },
        { step: 'SendNotification', service: 'notification-service' }
      ]
    );
    
    res.status(201).json({ ...order, sagaId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/orders/:userId', async (req, res) => {
  try {
    const orders = await getUserOrders(req.params.userId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'order-service' });
});

// Mock functions
async function getCart(userId) {
  return { userId, items: [], total: 0 };
}

async function addToCart(userId, item) {
  return { success: true };
}

async function createOrder(orderData) {
  return { id: 1, ...orderData, status: 'pending' };
}

async function getUserOrders(userId) {
  return [];
}

// Event handlers setup
async function setupEventHandlers() {
  await eventBus.connect();
  
  // Listen for payment completed events
  await eventBus.subscribe(
    'payment-events',
    'order-service-group',
    async (event) => {
      if (event.eventType === 'PaymentCompleted') {
        await handlePaymentCompleted(event);
      }
    }
  );
  
  // Listen for inventory validation events
  await eventBus.subscribe(
    'product-events',
    'order-service-group',
    async (event) => {
      if (event.eventType === 'InventoryValidated') {
        await handleInventoryValidated(event);
      } else if (event.eventType === 'InventoryValidationFailed') {
        await handleInventoryValidationFailed(event);
      }
    }
  );
}

async function handlePaymentCompleted(event) {
  const { orderId } = event.data;
  
  // Update order status
  await updateOrderStatus(orderId, 'paid');
  
  // Publish order confirmed event
  await eventBus.publish(
    'OrderConfirmed',
    'Order',
    orderId,
    { orderId, status: 'confirmed' }
  );
}

async function handleInventoryValidated(event) {
  const { orderId } = event.data;
  
  // Proceed with payment
  await eventBus.sendCommand(
    'ProcessPayment',
    'Payment',
    orderId,
    { orderId }
  );
}

async function handleInventoryValidationFailed(event) {
  const { orderId, reason } = event.data;
  
  // Cancel order
  await updateOrderStatus(orderId, 'cancelled');
  
  await eventBus.publish(
    'OrderCancelled',
    'Order',
    orderId,
    { orderId, reason }
  );
}

async function updateOrderStatus(orderId, status) {
  // Update order in database
  console.log(`Updating order ${orderId} status to ${status}`);
}

setupEventHandlers();

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});