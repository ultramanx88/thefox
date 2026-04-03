#!/bin/bash

echo "🔍 Setting up Search & Discovery System..."

# Wait for Elasticsearch
echo "⏳ Waiting for Elasticsearch..."
until curl -s http://localhost:9200/_cluster/health | grep -q '"status":"yellow\|green"'; do
  sleep 2
done

# Create products index
echo "📊 Creating products index..."
curl -X PUT "localhost:9200/products" \
  -H "Content-Type: application/json" \
  -d @microservices/search-service/elasticsearch-mapping.json

# Index sample products
echo "📦 Indexing sample products..."
curl -X POST "localhost:3007/index" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "id": 1,
        "name": "iPhone 15 Pro",
        "description": "Latest Apple smartphone with A17 Pro chip",
        "brand": "Apple",
        "category": "Electronics",
        "price": 35900,
        "tags": ["smartphone", "apple", "ios"],
        "popularity": 95,
        "rating": 4.8,
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "Samsung Galaxy S24",
        "description": "Premium Android phone with AI features",
        "brand": "Samsung",
        "category": "Electronics", 
        "price": 28900,
        "tags": ["smartphone", "samsung", "android"],
        "popularity": 88,
        "rating": 4.6,
        "created_at": "2024-01-02T00:00:00Z"
      }
    ]
  }'

echo "✅ Search system initialized!"
echo "🔍 Search API: http://localhost:8080/api/search/"
echo "💡 Try: curl 'http://localhost:8080/api/search/search?q=iphone'"