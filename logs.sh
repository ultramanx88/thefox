#!/bin/bash

# Logs script for theFOX application
set -e

echo "📋 Viewing logs for theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
LOG_LEVEL="info"
LINES=100

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        --lines)
            LINES="$2"
            shift 2
            ;;
        --follow)
            FOLLOW=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --level LEVEL         Log level (default: info)"
            echo "  --lines NUM           Number of lines to show (default: 100)"
            echo "  --follow              Follow logs in real-time"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Build log filter
FILTER="resource.type=cloud_run_revision"
if [ "$LOG_LEVEL" != "all" ]; then
    FILTER="$FILTER AND severity>=$LOG_LEVEL"
fi

# Show logs
if [ "$FOLLOW" = true ]; then
    echo "🔄 Following logs (press Ctrl+C to stop)..."
    gcloud run services logs tail $SERVICE_NAME --region=$REGION --filter="$FILTER"
else
    echo "📋 Showing last $LINES lines of logs..."
    gcloud run services logs read $SERVICE_NAME --region=$REGION --filter="$FILTER" --limit=$LINES
fi

echo "✅ Logs displayed!"
