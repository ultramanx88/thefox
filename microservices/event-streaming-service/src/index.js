const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Kafka } = require('kafkajs');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const app = express();
const PORT = process.env.PORT || 3010;

// Kafka setup
const kafka = new Kafka({
  clientId: 'thefox-event-streaming',
  brokers: [
    process.env.KAFKA_BROKER_1 || 'kafka-1:9092',
    process.env.KAFKA_BROKER_2 || 'kafka-2:9092',
    process.env.KAFKA_BROKER_3 || 'kafka-3:9092'
  ],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000
});

const admin = kafka.admin();

// Redis for dead letter queue and event store
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Event schema validation
const eventSchema = Joi.object({
  eventType: Joi.string().required(),
  aggregateId: Joi.string().required(),
  aggregateType: Joi.string().required(),
  data: Joi.object().required(),
  metadata: Joi.object().default({}),
  correlationId: Joi.string().optional(),
  causationId: Joi.string().optional()
});

// Publish event
app.post('/events/publish', async (req, res) => {
  try {
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = {
      ...value,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: 1
    };

    // Determine topic based on aggregate type
    const topic = `${event.aggregateType.toLowerCase()}-events`;

    await producer.send({
      topic,
      messages: [{
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          correlationId: event.correlationId || event.eventId
        }
      }]
    });

    // Store in event store (Redis)
    await redisClient.hSet(
      `events:${event.aggregateType}:${event.aggregateId}`,
      event.eventId,
      JSON.stringify(event)
    );

    res.status(201).json({
      success: true,
      eventId: event.eventId,
      topic
    });
  } catch (error) {
    console.error('Event publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events for aggregate
app.get('/events/:aggregateType/:aggregateId', async (req, res) => {
  try {
    const { aggregateType, aggregateId } = req.params;
    const { fromVersion = 0 } = req.query;

    const events = await redisClient.hGetAll(`events:${aggregateType}:${aggregateId}`);
    
    const eventList = Object.values(events)
      .map(eventStr => JSON.parse(eventStr))
      .filter(event => event.version >= parseInt(fromVersion))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      aggregateId,
      aggregateType,
      events: eventList,
      totalEvents: eventList.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event replay
app.post('/events/replay', async (req, res) => {
  try {
    const { aggregateType, aggregateId, fromTimestamp, toTimestamp } = req.body;

    const events = await redisClient.hGetAll(`events:${aggregateType}:${aggregateId}`);
    
    const eventsToReplay = Object.values(events)
      .map(eventStr => JSON.parse(eventStr))
      .filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= new Date(fromTimestamp) && 
               eventTime <= new Date(toTimestamp);
      });

    const topic = `${aggregateType.toLowerCase()}-replay`;

    for (const event of eventsToReplay) {
      await producer.send({
        topic,
        messages: [{
          key: event.aggregateId,
          value: JSON.stringify({
            ...event,
            isReplay: true,
            replayTimestamp: new Date().toISOString()
          })
        }]
      });
    }

    res.json({
      success: true,
      replayedEvents: eventsToReplay.length,
      topic
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dead letter queue management
app.get('/dlq/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const dlqKey = `dlq:${topic}`;
    
    const messages = await redisClient.lRange(dlqKey, 0, -1);
    const parsedMessages = messages.map(msg => JSON.parse(msg));

    res.json({
      topic,
      deadLetterMessages: parsedMessages,
      count: parsedMessages.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/dlq/:topic/retry', async (req, res) => {
  try {
    const { topic } = req.params;
    const { messageId } = req.body;
    
    const dlqKey = `dlq:${topic}`;
    const messages = await redisClient.lRange(dlqKey, 0, -1);
    
    const messageToRetry = messages
      .map(msg => JSON.parse(msg))
      .find(msg => msg.messageId === messageId);

    if (!messageToRetry) {
      return res.status(404).json({ error: 'Message not found in DLQ' });
    }

    // Republish to original topic
    await producer.send({
      topic: messageToRetry.originalTopic,
      messages: [{
        key: messageToRetry.key,
        value: messageToRetry.value,
        headers: {
          ...messageToRetry.headers,
          retryAttempt: (parseInt(messageToRetry.headers?.retryAttempt || '0') + 1).toString()
        }
      }]
    });

    // Remove from DLQ
    await redisClient.lRem(dlqKey, 1, JSON.stringify(messageToRetry));

    res.json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Saga orchestration
app.post('/saga/start', async (req, res) => {
  try {
    const { sagaType, sagaData, steps } = req.body;
    const sagaId = uuidv4();

    const saga = {
      sagaId,
      sagaType,
      status: 'STARTED',
      currentStep: 0,
      steps,
      data: sagaData,
      startedAt: new Date().toISOString(),
      compensations: []
    };

    // Store saga state
    await redisClient.hSet('sagas', sagaId, JSON.stringify(saga));

    // Publish saga started event
    await producer.send({
      topic: 'saga-events',
      messages: [{
        key: sagaId,
        value: JSON.stringify({
          eventType: 'SagaStarted',
          sagaId,
          sagaType,
          timestamp: new Date().toISOString()
        })
      }]
    });

    res.status(201).json({ sagaId, status: 'STARTED' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Topic management
app.post('/topics', async (req, res) => {
  try {
    const { topicName, partitions = 3, replicationFactor = 2 } = req.body;

    await admin.createTopics({
      topics: [{
        topic: topicName,
        numPartitions: partitions,
        replicationFactor
      }]
    });

    res.status(201).json({
      success: true,
      topic: topicName,
      partitions,
      replicationFactor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/topics', async (req, res) => {
  try {
    const metadata = await admin.fetchTopicMetadata();
    
    res.json({
      topics: metadata.topics.map(topic => ({
        name: topic.name,
        partitions: topic.partitions.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const adminConnected = await admin.listTopics().then(() => true).catch(() => false);
    
    res.json({
      status: 'OK',
      service: 'event-streaming-service',
      kafka: adminConnected ? 'connected' : 'disconnected',
      redis: redisClient.isReady ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize connections
async function initialize() {
  try {
    await redisClient.connect();
    await producer.connect();
    await admin.connect();

    // Create default topics
    const defaultTopics = [
      'user-events',
      'product-events', 
      'order-events',
      'payment-events',
      'notification-events',
      'saga-events'
    ];

    for (const topic of defaultTopics) {
      try {
        await admin.createTopics({
          topics: [{
            topic,
            numPartitions: 3,
            replicationFactor: 2
          }]
        });
        console.log(`Created topic: ${topic}`);
      } catch (error) {
        // Topic might already exist
        if (!error.message.includes('already exists')) {
          console.error(`Error creating topic ${topic}:`, error.message);
        }
      }
    }

    console.log('Event Streaming Service initialized');
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

initialize();

app.listen(PORT, () => {
  console.log(`Event Streaming Service running on port ${PORT}`);
});

module.exports = { producer, kafka };