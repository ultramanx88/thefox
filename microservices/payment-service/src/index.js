const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { EventBus } = require('../shared/eventBus');

const app = express();
const PORT = process.env.PORT || 3004;

// Initialize event bus
const eventBus = new EventBus({
  clientId: 'payment-service',
  brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092']
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'thb', orderId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: { orderId }
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process payment with event streaming
app.post('/process-payment', async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      await savePayment({
        orderId,
        paymentIntentId,
        amount: paymentIntent.amount / 100,
        status: 'completed'
      });
      
      // Publish payment completed event
      await eventBus.publish(
        'PaymentCompleted',
        'Payment',
        orderId,
        {
          orderId,
          paymentIntentId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'completed'
        }
      );
      
      res.json({ success: true, status: 'completed' });
    } else {
      // Publish payment failed event
      await eventBus.publish(
        'PaymentFailed',
        'Payment',
        orderId,
        {
          orderId,
          paymentIntentId,
          status: paymentIntent.status,
          reason: 'Payment not succeeded'
        }
      );
      
      res.json({ success: false, status: paymentIntent.status });
    }
  } catch (error) {
    // Publish payment error event
    await eventBus.publish(
      'PaymentError',
      'Payment',
      req.body.orderId,
      {
        orderId: req.body.orderId,
        error: error.message
      }
    );
    
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
    }
    
    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payment-service' });
});

async function savePayment(paymentData) {
  // Save to payment database
  console.log('Saving payment:', paymentData);
}

async function publishEvent(eventType, data) {
  // Publish to message queue
  console.log(`Event: ${eventType}`, data);
}

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});