#!/bin/bash

# Health check script for theFOX application
set -e

echo "🏥 Running health check for theFOX application..."

# Configuration
SERVICE_URL=""
REGION="asia-southeast1"
SERVICE_NAME="thefox"

# Get service URL
if [ -z "$SERVICE_URL" ]; then
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
fi

echo "🔍 Checking service at: $SERVICE_URL"

# Check health endpoint
echo "🏥 Checking health endpoint..."
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Health endpoint is responding"
else
    echo "❌ Health endpoint is not responding"
    exit 1
fi

# Check web app
echo "🌐 Checking web app..."
if curl -f -s "$SERVICE_URL/" > /dev/null; then
    echo "✅ Web app is responding"
else
    echo "❌ Web app is not responding"
fi

# Check mobile app
echo "📱 Checking mobile app..."
if curl -f -s "$SERVICE_URL/mobile/" > /dev/null; then
    echo "✅ Mobile app is responding"
else
    echo "❌ Mobile app is not responding"
fi

# Check API
echo "🔌 Checking API..."
if curl -f -s "$SERVICE_URL/api/" > /dev/null; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi

# Check response time
echo "⏱️ Checking response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$SERVICE_URL/health")
echo "📊 Response time: ${RESPONSE_TIME}s"

# Check if response time is acceptable
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "✅ Response time is acceptable"
else
    echo "⚠️ Response time is slow: ${RESPONSE_TIME}s"
fi

# Check service status
echo "📊 Checking service status..."
gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(
    metadata.name,
    status.conditions[0].type,
    status.conditions[0].status,
    status.conditions[0].lastTransitionTime
)"

echo "✅ Health check completed!"
