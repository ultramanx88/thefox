#!/bin/bash

echo "🚀 Deploying TheFox Microservices..."

# Build all services
echo "📦 Building services..."
docker-compose build

# Start databases first
echo "🗄️ Starting optimized databases, cache cluster, and Kafka..."
docker-compose up -d postgres-user-master postgres-user-replica pgbouncer-user postgres-product postgres-order postgres-payment redis redis-1 redis-2 redis-3 redis-query-cache clickhouse elasticsearch zookeeper kafka-1 kafka-2 kafka-3

# Wait for databases and Kafka
echo "⏳ Waiting for databases, cache, and Kafka..."
sleep 40

# Initialize Redis cluster
echo "🔗 Initializing Redis cluster..."
docker-compose run --rm redis-cluster-init

# Start services
echo "🔧 Starting services..."
docker-compose up -d user-service product-service order-service payment-service notification-service analytics-service search-service cache-service security-service event-streaming-service monitoring-service database-service

# Start API Gateway
echo "🌐 Starting API Gateway..."
docker-compose up -d api-gateway

echo "✅ All services started!"
echo "🌍 API Gateway: http://localhost:8080"
echo "👤 User Service: http://localhost:3001"
echo "📦 Product Service: http://localhost:3002"
echo "🛒 Order Service: http://localhost:3003"
echo "💳 Payment Service: http://localhost:3004"
echo "🔔 Notification Service: http://localhost:3005"
echo "📊 Analytics Service: http://localhost:3006"
echo "🔍 Search Service: http://localhost:3007"
echo "⚡ Cache Service: http://localhost:3008"
echo "🛑 Security Service: http://localhost:3009"
echo "📨 Event Streaming Service: http://localhost:3010"
echo "📊 Monitoring Service: http://localhost:3011"
echo "💾 Database Service: http://localhost:3012"
echo ""
echo "🔍 Setting up search system..."
./setup-search.sh
echo ""
echo "⚡ Running performance tests..."
./performance-test.sh
echo ""
echo "🛑 Running security tests..."
./security-test.sh
echo ""
echo "📨 Running event streaming tests..."
./event-streaming-test.sh
echo ""
echo "📊 Running monitoring tests..."
./monitoring-test.sh
echo ""
echo "💾 Running database tests..."
./database-test.sh