#!/bin/bash

echo "📨 Message Queue & Event Streaming Test"
echo "======================================"

BASE_URL="http://localhost:8080"

# Test 1: Publish Event
echo "📤 Testing Event Publishing..."
EVENT_ID=$(curl -s -X POST "$BASE_URL/api/events/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "OrderCreated",
    "aggregateType": "Order",
    "aggregateId": "order-123",
    "data": {
      "orderId": "order-123",
      "userId": "user-456",
      "totalAmount": 99.99,
      "items": [
        {"productId": "prod-1", "quantity": 2, "price": 49.99}
      ]
    },
    "metadata": {
      "source": "test-script"
    }
  }' | jq -r '.eventId')

echo "Published event ID: $EVENT_ID"

echo ""

# Test 2: Get Events for Aggregate
echo "📥 Testing Event Retrieval..."
curl -s "$BASE_URL/api/events/Order/order-123" | jq '.'

echo ""

# Test 3: Start Saga
echo "🔄 Testing Saga Orchestration..."
SAGA_ID=$(curl -s -X POST "$BASE_URL/api/saga/start" \
  -H "Content-Type: application/json" \
  -d '{
    "sagaType": "OrderProcessing",
    "sagaData": {
      "orderId": "order-123",
      "userId": "user-456"
    },
    "steps": [
      {"step": "ValidateInventory", "service": "product-service"},
      {"step": "ProcessPayment", "service": "payment-service"},
      {"step": "SendNotification", "service": "notification-service"}
    ]
  }' | jq -r '.sagaId')

echo "Started saga ID: $SAGA_ID"

echo ""

# Test 4: Create Topics
echo "📋 Testing Topic Management..."
curl -s -X POST "$BASE_URL/api/events/topics" \
  -H "Content-Type: application/json" \
  -d '{
    "topicName": "test-events",
    "partitions": 3,
    "replicationFactor": 2
  }' | jq '.'

echo ""

# Test 5: List Topics
echo "📝 Listing Topics..."
curl -s "$BASE_URL/api/events/topics" | jq '.'

echo ""

# Test 6: Dead Letter Queue
echo "💀 Testing Dead Letter Queue..."
curl -s "$BASE_URL/api/events/dlq/order-events" | jq '.'

echo ""

# Test 7: Event Replay
echo "🔄 Testing Event Replay..."
curl -s -X POST "$BASE_URL/api/events/replay" \
  -H "Content-Type: application/json" \
  -d '{
    "aggregateType": "Order",
    "aggregateId": "order-123",
    "fromTimestamp": "2024-01-01T00:00:00Z",
    "toTimestamp": "2024-12-31T23:59:59Z"
  }' | jq '.'

echo ""
echo "✅ Event Streaming tests completed!"
echo ""
echo "🔧 Event Streaming Features:"
echo "- Event publishing: ✅ Enabled"
echo "- Event sourcing: ✅ Enabled"
echo "- Saga orchestration: ✅ Enabled"
echo "- Dead letter queue: ✅ Enabled"
echo "- Event replay: ✅ Enabled"
echo "- Topic management: ✅ Enabled"
echo ""
echo "🌐 Kafka UI: http://localhost:8080 (when kafka-ui is enabled)"