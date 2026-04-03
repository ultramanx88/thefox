#!/bin/bash

echo "🔍 TheFox Backend Status Check"
echo "================================"

# Check Docker
if docker info > /dev/null 2>&1; then
    echo "✅ Docker: Running"
else
    echo "❌ Docker: Not running - Please start Docker Desktop"
    echo "   💡 Run: open -a Docker"
    exit 1
fi

# Check if services are running
echo ""
echo "📊 Service Status:"

services=("postgres-user:5432" "redis:6379" "elasticsearch:9200")
for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ $name: Running on port $port"
    else
        echo "❌ $name: Not running on port $port"
    fi
done

echo ""
echo "🚀 To start backend:"
echo "   cd microservices"
echo "   docker-compose up -d postgres-user redis elasticsearch"
echo "   docker-compose up -d user-service product-service"
echo "   docker-compose up -d api-gateway"