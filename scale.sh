#!/bin/bash

# Scaling script for theFOX application
set -e

echo "📈 Scaling theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
MIN_INSTANCES=1
MAX_INSTANCES=10
CPU=2
MEMORY="2Gi"
CONCURRENCY=100

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --min-instances)
            MIN_INSTANCES="$2"
            shift 2
            ;;
        --max-instances)
            MAX_INSTANCES="$2"
            shift 2
            ;;
        --cpu)
            CPU="$2"
            shift 2
            ;;
        --memory)
            MEMORY="$2"
            shift 2
            ;;
        --concurrency)
            CONCURRENCY="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --min-instances NUM    Minimum number of instances (default: 1)"
            echo "  --max-instances NUM    Maximum number of instances (default: 10)"
            echo "  --cpu NUM             CPU allocation (default: 2)"
            echo "  --memory SIZE         Memory allocation (default: 2Gi)"
            echo "  --concurrency NUM     Concurrent requests per instance (default: 100)"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Update Cloud Run service
echo "🔄 Updating Cloud Run service..."
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --min-instances=$MIN_INSTANCES \
    --max-instances=$MAX_INSTANCES \
    --cpu=$CPU \
    --memory=$MEMORY \
    --concurrency=$CONCURRENCY

# Get current status
echo "📊 Current service status:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(
    metadata.name,
    spec.template.spec.containerConcurrency,
    spec.template.spec.containers[0].resources.limits.cpu,
    spec.template.spec.containers[0].resources.limits.memory,
    spec.template.metadata.annotations.autoscaling.knative.dev/minScale,
    spec.template.metadata.annotations.autoscaling.knative.dev/maxScale
)"

echo "✅ Scaling completed!"
echo "📈 Service scaled to:"
echo "  - Min instances: $MIN_INSTANCES"
echo "  - Max instances: $MAX_INSTANCES"
echo "  - CPU: $CPU"
echo "  - Memory: $MEMORY"
echo "  - Concurrency: $CONCURRENCY"
