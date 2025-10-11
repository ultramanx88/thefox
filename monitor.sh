#!/bin/bash

# Monitoring script for theFOX application
set -e

echo "📊 Managing monitoring for theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
PROJECT_ID=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --setup)
            SETUP=true
            shift
            ;;
        --status)
            STATUS=true
            shift
            ;;
        --metrics)
            METRICS=true
            shift
            ;;
        --alerts)
            ALERTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --project ID          Google Cloud Project ID"
            echo "  --setup               Setup monitoring"
            echo "  --status              Show monitoring status"
            echo "  --metrics             Show metrics"
            echo "  --alerts              Show alerts"
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

# Setup monitoring
if [ "$SETUP" = true ]; then
    echo "🔧 Setting up monitoring..."
    
    # Enable monitoring APIs
    gcloud services enable monitoring.googleapis.com
    gcloud services enable logging.googleapis.com
    gcloud services enable cloudtrace.googleapis.com
    
    # Create monitoring workspace
    gcloud alpha monitoring workspaces create \
        --display-name="theFOX Monitoring" \
        --project=$PROJECT_ID
    
    # Create notification channels
    echo "📧 Creating notification channels..."
    gcloud alpha monitoring channels create \
        --display-name="theFOX Alerts" \
        --type=email \
        --channel-labels=email_address="admin@thefox.com"
    
    # Create alert policies
    echo "🚨 Creating alert policies..."
    ./alerts.sh --create --channel admin@thefox.com
    
    echo "✅ Monitoring setup completed!"
fi

# Show status
if [ "$STATUS" = true ]; then
    echo "📊 Monitoring status:"
    
    # Service status
    echo "🔍 Service status:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(
        metadata.name,
        status.conditions[0].type,
        status.conditions[0].status,
        status.conditions[0].lastTransitionTime
    )"
    
    # Resource usage
    echo "📈 Resource usage:"
    gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(
        spec.template.spec.containers[0].resources.limits.cpu,
        spec.template.spec.containers[0].resources.limits.memory,
        spec.template.metadata.annotations.autoscaling.knative.dev/minScale,
        spec.template.metadata.annotations.autoscaling.knative.dev/maxScale
    )"
    
    # Recent logs
    echo "📋 Recent logs:"
    gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=10
fi

# Show metrics
if [ "$METRICS" = true ]; then
    echo "📊 Metrics:"
    
    # Request count
    echo "📈 Request count (last 1 hour):"
    gcloud alpha monitoring metrics list \
        --filter="resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
        --limit=10
    
    # Error rate
    echo "❌ Error rate (last 1 hour):"
    gcloud alpha monitoring metrics list \
        --filter="resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND metric.type=run.googleapis.com/request_count" \
        --limit=10
    
    # Response time
    echo "⏱️ Response time (last 1 hour):"
    gcloud alpha monitoring metrics list \
        --filter="resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND metric.type=run.googleapis.com/request_latency" \
        --limit=10
fi

# Show alerts
if [ "$ALERTS" = true ]; then
    echo "🚨 Alerts:"
    
    # List alert policies
    gcloud alpha monitoring policies list \
        --filter="displayName:theFOX" \
        --format="table(displayName,conditions[0].displayName,enabled)"
    
    # List incidents
    echo "📋 Recent incidents:"
    gcloud alpha monitoring incidents list \
        --filter="resource.labels.service_name=$SERVICE_NAME" \
        --limit=10
fi

echo "✅ Monitoring management completed!"
