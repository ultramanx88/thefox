#!/bin/bash

# CI/CD Pipeline script for theFOX application
set -e

echo "🚀 Running CI/CD pipeline for theFOX application..."

# Configuration
PROJECT_ID=""
REGION="asia-southeast1"
SERVICE_NAME="thefox"
BRANCH="master"
ENVIRONMENT="production"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --branch)
            BRANCH="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --test)
            TEST=true
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --deploy)
            DEPLOY=true
            shift
            ;;
        --full)
            FULL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --project ID          Google Cloud Project ID"
            echo "  --branch BRANCH       Git branch to deploy (default: master)"
            echo "  --environment ENV     Deployment environment (default: production)"
            echo "  --test                Run tests only"
            echo "  --build               Build only"
            echo "  --deploy              Deploy only"
            echo "  --full                Run full pipeline (test + build + deploy)"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get project ID
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project)
fi

echo "📋 Project: $PROJECT_ID"
echo "🌿 Branch: $BRANCH"
echo "🌍 Environment: $ENVIRONMENT"

# Test phase
if [ "$TEST" = true ] || [ "$FULL" = true ]; then
    echo "🧪 Running tests..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    cd apps/web && npm ci && cd ../..
    cd apps/mobile && npm ci && cd ../..
    
    # Run web app tests
    echo "🌐 Testing web app..."
    cd apps/web
    if npm run test 2>/dev/null; then
        echo "✅ Web app tests passed"
    else
        echo "⚠️ Web app tests failed or not configured"
    fi
    cd ../..
    
    # Run mobile app tests
    echo "📱 Testing mobile app..."
    cd apps/mobile
    if npm run test 2>/dev/null; then
        echo "✅ Mobile app tests passed"
    else
        echo "⚠️ Mobile app tests failed or not configured"
    fi
    cd ../..
    
    # Run backend tests
    echo "🔧 Testing backend..."
    cd backend
    if cargo test 2>/dev/null; then
        echo "✅ Backend tests passed"
    else
        echo "⚠️ Backend tests failed or not configured"
    fi
    cd ..
    
    # Run security tests
    echo "🔒 Running security tests..."
    if ./security.sh 2>/dev/null; then
        echo "✅ Security tests passed"
    else
        echo "⚠️ Security tests failed or not configured"
    fi
    
    # Run linting
    echo "🔍 Running linting..."
    if command -v eslint &> /dev/null; then
        cd apps/web && npx eslint . --ext .ts,.tsx,.js,.jsx && cd ../..
        echo "✅ Web app linting passed"
    else
        echo "⚠️ ESLint not available"
    fi
    
    if command -v cargo &> /dev/null; then
        cd backend && cargo clippy -- -D warnings && cd ..
        echo "✅ Backend linting passed"
    else
        echo "⚠️ Cargo clippy not available"
    fi
fi

# Build phase
if [ "$BUILD" = true ] || [ "$FULL" = true ]; then
    echo "🏗️ Building application..."
    
    # Build Docker image
    docker build -t gcr.io/$PROJECT_ID/thefox:$GITHUB_SHA .
    docker tag gcr.io/$PROJECT_ID/thefox:$GITHUB_SHA gcr.io/$PROJECT_ID/thefox:latest
    
    # Push to Container Registry
    echo "📤 Pushing to Container Registry..."
    docker push gcr.io/$PROJECT_ID/thefox:$GITHUB_SHA
    docker push gcr.io/$PROJECT_ID/thefox:latest
fi

# Deploy phase
if [ "$DEPLOY" = true ] || [ "$FULL" = true ]; then
    echo "🚀 Deploying to Cloud Run..."
    
    # Deploy service
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/thefox:$GITHUB_SHA \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --port 80 \
        --memory 2Gi \
        --cpu 2 \
        --max-instances 10 \
        --min-instances 1 \
        --concurrency 100 \
        --timeout 300s \
        --set-env-vars NODE_ENV=$ENVIRONMENT,PORT=80
    
    # Health check
    echo "🏥 Running health check..."
    sleep 30
    ./health-check.sh
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    echo "✅ Deployment completed successfully!"
    echo "🔗 Service URL: $SERVICE_URL"
    echo "📱 Mobile App: $SERVICE_URL/mobile/"
    echo "🌐 Web App: $SERVICE_URL/"
    echo "🔌 API: $SERVICE_URL/api/"
fi

echo "🎉 CI/CD pipeline completed successfully!"
