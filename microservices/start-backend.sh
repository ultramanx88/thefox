#!/bin/bash

echo "🚀 Starting TheFox Backend Services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start core services first
echo "📦 Starting databases and infrastructure..."
docker-compose up -d postgres-user postgres-product postgres-order redis elasticsearch

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Start microservices
echo "🔧 Starting microservices..."
docker-compose up -d user-service product-service order-service

# Start API Gateway
echo "🌐 Starting API Gateway..."
docker-compose up -d api-gateway

echo "✅ Backend services started successfully!"
echo ""
echo "📋 Available Services:"
echo "   🌐 API Gateway: http://localhost:8080"
echo "   👤 User Service: http://localhost:3001"
echo "   📦 Product Service: http://localhost:3002"
echo "   🛒 Order Service: http://localhost:3003"
echo ""
echo "📊 Infrastructure:"
echo "   🗄️  PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo "   🔍 Elasticsearch: localhost:9200"
echo ""
echo "🔧 To start all services: docker-compose up -d"
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop all: docker-compose down"