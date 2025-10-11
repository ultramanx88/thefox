#!/bin/bash

# Dashboard script for theFOX application
set -e

echo "📊 Managing monitoring dashboard for theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
DASHBOARD_FILE="dashboard.html"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --open)
            OPEN=true
            shift
            ;;
        --deploy)
            DEPLOY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --open                Open dashboard in browser"
            echo "  --deploy              Deploy dashboard to Cloud Run"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Open dashboard
if [ "$OPEN" = true ]; then
    echo "🌐 Opening dashboard in browser..."
    
    if [ -f "$DASHBOARD_FILE" ]; then
        # Get service URL
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
        
        # Open dashboard
        if command -v open &> /dev/null; then
            open "$DASHBOARD_FILE"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$DASHBOARD_FILE"
        else
            echo "Please open $DASHBOARD_FILE in your browser"
        fi
        
        echo "✅ Dashboard opened!"
    else
        echo "❌ Dashboard file not found: $DASHBOARD_FILE"
        exit 1
    fi
fi

# Deploy dashboard
if [ "$DEPLOY" = true ]; then
    echo "🚀 Deploying dashboard to Cloud Run..."
    
    # Create dashboard service
    gcloud run deploy thefox-dashboard \
        --source . \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --port 80 \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 3 \
        --min-instances 0 \
        --concurrency 50 \
        --timeout 60s \
        --set-env-vars DASHBOARD_FILE=$DASHBOARD_FILE
    
    # Get dashboard URL
    DASHBOARD_URL=$(gcloud run services describe thefox-dashboard --region=$REGION --format="value(status.url)")
    
    echo "✅ Dashboard deployed successfully!"
    echo "🔗 Dashboard URL: $DASHBOARD_URL"
fi

echo "✅ Dashboard management completed!"