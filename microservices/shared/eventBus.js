const { Kafka } = require('kafkajs');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

class EventBus {
  constructor(options = {}) {
    this.kafka = new Kafka({
      clientId: options.clientId || 'thefox-client',
      brokers: options.brokers || [
        'kafka-1:9092',
        'kafka-2:9092', 
        'kafka-3:9092'
      ],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true
    });

    this.consumers = new Map();
    this.isConnected = false;

    // Redis for DLQ and event store
    this.redisClient = redis.createClient({
      url: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    });
  }

  async connect() {
    try {
      await this.producer.connect();
      await this.redisClient.connect();
      this.isConnected = true;
      console.log('EventBus connected');
    } catch (error) {
      console.error('EventBus connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      
      for (const consumer of this.consumers.values()) {
        await consumer.disconnect();
      }
      
      await this.redisClient.disconnect();
      this.isConnected = false;
    } catch (error) {
      console.error('EventBus disconnect error:', error);
    }
  }

  // Publish event
  async publish(eventType, aggregateType, aggregateId, data, options = {}) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    const event = {
      eventId: uuidv4(),
      eventType,
      aggregateType,
      aggregateId,
      data,
      timestamp: new Date().toISOString(),
      version: options.version || 1,
      correlationId: options.correlationId || uuidv4(),
      causationId: options.causationId,
      metadata: options.metadata || {}
    };

    const topic = `${aggregateType.toLowerCase()}-events`;

    try {
      await this.producer.send({
        topic,
        messages: [{
          key: aggregateId,
          value: JSON.stringify(event),
          headers: {
            eventType,
            aggregateType,
            correlationId: event.correlationId
          }
        }]
      });

      // Store in event store
      await this.redisClient.hSet(
        `events:${aggregateType}:${aggregateId}`,
        event.eventId,
        JSON.stringify(event)
      );

      return event.eventId;
    } catch (error) {
      console.error('Event publish error:', error);
      throw error;
    }
  }

  // Subscribe to events
  async subscribe(topic, groupId, handler, options = {}) {
    const consumer = this.kafka.consumer({ 
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: options.fromBeginning || false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          
          // Add message metadata
          event._metadata = {
            topic,
            partition,
            offset: message.offset,
            timestamp: message.timestamp
          };

          await handler(event);
        } catch (error) {
          console.error(`Error processing message from ${topic}:`, error);
          
          // Send to dead letter queue
          await this.sendToDLQ(topic, message, error);
        }
      }
    });

    this.consumers.set(`${topic}-${groupId}`, consumer);
    return consumer;
  }

  // Send failed message to Dead Letter Queue
  async sendToDLQ(originalTopic, message, error) {
    try {
      const dlqMessage = {
        messageId: uuidv4(),
        originalTopic,
        key: message.key?.toString(),
        value: message.value.toString(),
        headers: message.headers,
        error: error.message,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      await this.redisClient.lPush(
        `dlq:${originalTopic}`,
        JSON.stringify(dlqMessage)
      );
    } catch (dlqError) {
      console.error('Failed to send message to DLQ:', dlqError);
    }
  }

  // Event sourcing - get events for aggregate
  async getEvents(aggregateType, aggregateId, fromVersion = 0) {
    try {
      const events = await this.redisClient.hGetAll(`events:${aggregateType}:${aggregateId}`);
      
      return Object.values(events)
        .map(eventStr => JSON.parse(eventStr))
        .filter(event => event.version >= fromVersion)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  // Saga support
  async startSaga(sagaType, sagaData, steps) {
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

    await this.redisClient.hSet('sagas', sagaId, JSON.stringify(saga));

    await this.publish('SagaStarted', 'Saga', sagaId, saga);

    return sagaId;
  }

  async updateSaga(sagaId, updates) {
    const sagaStr = await this.redisClient.hGet('sagas', sagaId);
    if (!sagaStr) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    const saga = { ...JSON.parse(sagaStr), ...updates };
    await this.redisClient.hSet('sagas', sagaId, JSON.stringify(saga));

    return saga;
  }

  // Command handling
  async sendCommand(commandType, aggregateType, aggregateId, data, options = {}) {
    const command = {
      commandId: uuidv4(),
      commandType,
      aggregateType,
      aggregateId,
      data,
      timestamp: new Date().toISOString(),
      correlationId: options.correlationId || uuidv4(),
      metadata: options.metadata || {}
    };

    const topic = `${aggregateType.toLowerCase()}-commands`;

    await this.producer.send({
      topic,
      messages: [{
        key: aggregateId,
        value: JSON.stringify(command),
        headers: {
          commandType,
          aggregateType,
          correlationId: command.correlationId
        }
      }]
    });

    return command.commandId;
  }
}

// Event patterns
class EventPatterns {
  // CQRS Command
  static createCommand(commandType, aggregateId, data) {
    return {
      commandId: uuidv4(),
      commandType,
      aggregateId,
      data,
      timestamp: new Date().toISOString()
    };
  }

  // Domain Event
  static createDomainEvent(eventType, aggregateId, data, version = 1) {
    return {
      eventId: uuidv4(),
      eventType,
      aggregateId,
      data,
      version,
      timestamp: new Date().toISOString()
    };
  }

  // Integration Event
  static createIntegrationEvent(eventType, data, correlationId) {
    return {
      eventId: uuidv4(),
      eventType,
      data,
      correlationId: correlationId || uuidv4(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { EventBus, EventPatterns };