const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const EventBus = require('../shared/eventBus');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const eventBus = new EventBus();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Push notification
app.post('/push', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    
    const message = {
      notification: { title, body },
      data,
      token
    };
    
    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email notification
app.post('/email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SMS notification
app.post('/sms', async (req, res) => {
  try {
    const { to, body } = req.body;
    
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE,
      to
    });
    
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

// Event listeners
async function setupEventListeners() {
  await eventBus.connect();
  
  // Order created notification
  await eventBus.subscribe('order.created', async (data) => {
    await sendOrderConfirmation(data);
  });
  
  // Payment completed notification
  await eventBus.subscribe('payment.completed', async (data) => {
    await sendPaymentConfirmation(data);
  });
}

async function sendOrderConfirmation(orderData) {
  // Send email and push notification
  console.log('Sending order confirmation:', orderData);
}

async function sendPaymentConfirmation(paymentData) {
  // Send payment success notification
  console.log('Sending payment confirmation:', paymentData);
}

setupEventListeners();

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});