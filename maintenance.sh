#!/bin/bash

# Maintenance script for theFOX application
set -e

echo "🔧 Running maintenance for theFOX application..."

# Configuration
SERVICE_NAME="thefox"
REGION="asia-southeast1"
BACKUP_DIR="/app/backups"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            BACKUP=true
            shift
            ;;
        --cleanup)
            CLEANUP=true
            shift
            ;;
        --restart)
            RESTART=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --backup              Create backup before maintenance"
            echo "  --cleanup             Clean up old logs and temporary files"
            echo "  --restart             Restart the service"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create backup if requested
if [ "$BACKUP" = true ]; then
    echo "💾 Creating backup..."
    ./backup.sh
fi

# Clean up if requested
if [ "$CLEANUP" = true ]; then
    echo "🧹 Cleaning up old files..."
    
    # Clean up old logs
    find /var/log -name "*.log" -mtime +7 -delete
    
    # Clean up old backups
    find $BACKUP_DIR -name "thefox_backup_*.tar.gz" -mtime +30 -delete
    
    # Clean up temporary files
    find /tmp -name "thefox_*" -mtime +1 -delete
    
    echo "✅ Cleanup completed"
fi

# Restart service if requested
if [ "$RESTART" = true ]; then
    echo "🔄 Restarting service..."
    
    # Update service to trigger restart
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --update-env-vars MAINTENANCE_MODE=true
    
    # Wait a moment
    sleep 10
    
    # Remove maintenance mode
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --remove-env-vars MAINTENANCE_MODE
    
    echo "✅ Service restarted"
fi

# Check service health
echo "🏥 Checking service health..."
./health-check.sh

echo "✅ Maintenance completed!"
