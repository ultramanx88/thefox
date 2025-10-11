#!/bin/bash

# Environment management script for theFOX application
set -e

echo "🌍 Managing environment for theFOX application..."

# Configuration
ENVIRONMENT=""
PROJECT_ID=""
REGION="asia-southeast1"
SERVICE_NAME="thefox"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --create)
            CREATE=true
            shift
            ;;
        --update)
            UPDATE=true
            shift
            ;;
        --delete)
            DELETE=true
            shift
            ;;
        --list)
            LIST=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --env ENV            Environment name (dev, staging, prod)"
            echo "  --project ID         Google Cloud Project ID"
            echo "  --create             Create new environment"
            echo "  --update             Update existing environment"
            echo "  --delete             Delete environment"
            echo "  --list               List environments"
            echo "  --help               Show this help message"
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

# List environments
if [ "$LIST" = true ]; then
    echo "📋 Available environments:"
    gcloud run services list --format="table(metadata.name,status.url,spec.template.metadata.labels.environment)" | grep thefox
    exit 0
fi

# Get environment
if [ -z "$ENVIRONMENT" ]; then
    echo "🌍 Please select environment:"
    echo "1. development"
    echo "2. staging"
    echo "3. production"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1) ENVIRONMENT="development" ;;
        2) ENVIRONMENT="staging" ;;
        3) ENVIRONMENT="production" ;;
        *) echo "Invalid choice"; exit 1 ;;
    esac
fi

# Set environment-specific configuration
case $ENVIRONMENT in
    development)
        MEMORY="1Gi"
        CPU="1"
        MIN_INSTANCES="0"
        MAX_INSTANCES="3"
        CONCURRENCY="50"
        ;;
    staging)
        MEMORY="2Gi"
        CPU="2"
        MIN_INSTANCES="1"
        MAX_INSTANCES="5"
        CONCURRENCY="100"
        ;;
    production)
        MEMORY="4Gi"
        CPU="4"
        MIN_INSTANCES="2"
        MAX_INSTANCES="20"
        CONCURRENCY="200"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Create environment
if [ "$CREATE" = true ]; then
    echo "🆕 Creating $ENVIRONMENT environment..."
    
    # Deploy service
    gcloud run deploy $SERVICE_NAME-$ENVIRONMENT \
        --image gcr.io/$PROJECT_ID/thefox:latest \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --port 80 \
        --memory $MEMORY \
        --cpu $CPU \
        --min-instances $MIN_INSTANCES \
        --max-instances $MAX_INSTANCES \
        --concurrency $CONCURRENCY \
        --timeout 300s \
        --set-env-vars NODE_ENV=$ENVIRONMENT,PORT=80 \
        --set-labels environment=$ENVIRONMENT
    
    echo "✅ $ENVIRONMENT environment created successfully!"
fi

# Update environment
if [ "$UPDATE" = true ]; then
    echo "🔄 Updating $ENVIRONMENT environment..."
    
    # Update service
    gcloud run services update $SERVICE_NAME-$ENVIRONMENT \
        --region $REGION \
        --memory $MEMORY \
        --cpu $CPU \
        --min-instances $MIN_INSTANCES \
        --max-instances $MAX_INSTANCES \
        --concurrency $CONCURRENCY \
        --set-env-vars NODE_ENV=$ENVIRONMENT,PORT=80
    
    echo "✅ $ENVIRONMENT environment updated successfully!"
fi

# Delete environment
if [ "$DELETE" = true ]; then
    echo "🗑️ Deleting $ENVIRONMENT environment..."
    
    # Confirm deletion
    read -p "Are you sure you want to delete $ENVIRONMENT environment? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deletion cancelled"
        exit 0
    fi
    
    # Delete service
    gcloud run services delete $SERVICE_NAME-$ENVIRONMENT \
        --region $REGION \
        --quiet
    
    echo "✅ $ENVIRONMENT environment deleted successfully!"
fi

echo "✅ Environment management completed!"
