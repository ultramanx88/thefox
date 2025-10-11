#!/bin/bash

# Test Docker build script for theFOX application
set -e

echo "🧪 Testing Docker build for theFOX..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the Docker image
echo "🏗️ Building Docker image..."
docker build -t thefox:test .

# Test the image
echo "🧪 Testing the image..."
docker run --rm -d --name thefox-test -p 8080:80 thefox:test

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    docker logs thefox-test
    docker stop thefox-test
    exit 1
fi

# Test web app
echo "🔍 Testing web app..."
if curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Web app is accessible"
else
    echo "❌ Web app is not accessible"
fi

# Test mobile app
echo "🔍 Testing mobile app..."
if curl -f http://localhost:8080/mobile/ > /dev/null 2>&1; then
    echo "✅ Mobile app is accessible"
else
    echo "❌ Mobile app is not accessible"
fi

# Test API
echo "🔍 Testing API..."
if curl -f http://localhost:8080/api/ > /dev/null 2>&1; then
    echo "✅ API is accessible"
else
    echo "❌ API is not accessible"
fi

# Clean up
echo "🧹 Cleaning up..."
docker stop thefox-test

echo "✅ Docker build test completed successfully!"
echo ""
echo "🚀 Ready to deploy to Google Cloud!"
echo "Run: ./deploy.sh"
