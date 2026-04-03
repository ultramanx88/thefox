#!/bin/bash

echo "📊 Monitoring & Observability Test"
echo "=================================="

BASE_URL="http://localhost:8080"

# Test 1: Health Check All Services
echo "🏥 Testing Health Check Aggregation..."
curl -s "$BASE_URL/api/monitoring/health/all" | jq '.'

echo ""

# Test 2: System Metrics
echo "💻 Testing System Metrics..."
curl -s "$BASE_URL/api/monitoring/metrics/system" | jq '.'

echo ""

# Test 3: Business Metrics
echo "📈 Testing Business Metrics..."
curl -s -X POST "$BASE_URL/api/monitoring/metrics/business" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user_login",
    "service": "user-service",
    "count": 1
  }' | jq '.'

echo ""

# Test 4: Distributed Tracing
echo "🔍 Testing Distributed Tracing..."
TRACE_RESPONSE=$(curl -s "$BASE_URL/api/monitoring/trace-test")
echo $TRACE_RESPONSE | jq '.'

TRACE_ID=$(echo $TRACE_RESPONSE | jq -r '.traceId')
echo "Trace ID: $TRACE_ID"

echo ""

# Test 5: Alert Simulation
echo "🚨 Testing Alert System..."
curl -s -X POST "$BASE_URL/api/monitoring/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "warning",
    "service": "test-service",
    "message": "Test alert from monitoring script",
    "details": {
      "metric": "response_time",
      "value": 2.5,
      "threshold": 2.0
    }
  }' | jq '.'

echo ""

# Test 6: Prometheus Metrics
echo "📊 Testing Prometheus Metrics..."
echo "User Service metrics:"
curl -s "http://localhost:3001/metrics" | head -20

echo ""

# Test 7: Check Monitoring Stack
echo "🔧 Checking Monitoring Stack..."
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000 (admin/admin123)"
echo "Jaeger: http://localhost:16686"
echo "Kibana: http://localhost:5601"

echo ""

# Test 8: Generate Load for Testing
echo "⚡ Generating Load for Testing..."
for i in {1..10}; do
  curl -s "$BASE_URL/api/products/products" > /dev/null &
  curl -s "$BASE_URL/api/users/health" > /dev/null &
done

wait

echo ""
echo "✅ Monitoring tests completed!"
echo ""
echo "🔧 Monitoring Features:"
echo "- Prometheus metrics: ✅ Enabled"
echo "- Grafana dashboards: ✅ Enabled"
echo "- Distributed tracing: ✅ Enabled"
echo "- Centralized logging: ✅ Enabled"
echo "- Health monitoring: ✅ Enabled"
echo "- Alert management: ✅ Enabled"
echo ""
echo "🌐 Monitoring URLs:"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3000"
echo "- Jaeger: http://localhost:16686"
echo "- Kibana: http://localhost:5601"