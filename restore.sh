#!/bin/bash

# Restore script for theFOX application
set -e

echo "🔄 Starting restore for theFOX application..."

# Configuration
BACKUP_DIR="/app/backups"
RESTORE_FILE=""
GCS_BUCKET=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --file)
            RESTORE_FILE="$2"
            shift 2
            ;;
        --bucket)
            GCS_BUCKET="$2"
            shift 2
            ;;
        --list)
            LIST=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --file FILE           Backup file to restore from"
            echo "  --bucket BUCKET       Google Cloud Storage bucket"
            echo "  --list                List available backups"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# List available backups
if [ "$LIST" = true ]; then
    echo "📋 Available backups:"
    
    if [ ! -z "$GCS_BUCKET" ]; then
        echo "☁️ From Google Cloud Storage:"
        gsutil ls "gs://$GCS_BUCKET/backups/" | grep "thefox_backup_" | sort -r
    fi
    
    echo "💾 From local storage:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR" | grep "thefox_backup_" | sort -r
    else
        echo "No local backups found"
    fi
    
    exit 0
fi

# Get restore file
if [ -z "$RESTORE_FILE" ]; then
    echo "📋 Please enter the backup file to restore from:"
    read -p "Backup file: " RESTORE_FILE
fi

# Download from GCS if needed
if [ ! -z "$GCS_BUCKET" ] && [ ! -f "$RESTORE_FILE" ]; then
    echo "☁️ Downloading backup from Google Cloud Storage..."
    gsutil cp "gs://$GCS_BUCKET/backups/$RESTORE_FILE" "$BACKUP_DIR/$RESTORE_FILE"
    RESTORE_FILE="$BACKUP_DIR/$RESTORE_FILE"
fi

# Check if backup file exists
if [ ! -f "$RESTORE_FILE" ]; then
    echo "❌ Backup file not found: $RESTORE_FILE"
    exit 1
fi

# Confirm restore
echo "⚠️ WARNING: This will overwrite current data!"
echo "Backup file: $RESTORE_FILE"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Stop services
echo "🛑 Stopping services..."
gcloud run services update thefox \
    --region=asia-southeast1 \
    --update-env-vars MAINTENANCE_MODE=true

# Wait for services to stop
sleep 10

# Create current backup before restore
echo "💾 Creating current backup before restore..."
./backup.sh

# Extract backup
echo "📦 Extracting backup..."
tar -xzf "$RESTORE_FILE" -C /

# Restart services
echo "🔄 Restarting services..."
gcloud run services update thefox \
    --region=asia-southeast1 \
    --remove-env-vars MAINTENANCE_MODE

# Wait for services to start
sleep 30

# Verify restore
echo "🔍 Verifying restore..."
./health-check.sh

echo "✅ Restore completed!"
echo "📋 Restored from: $RESTORE_FILE"
echo "🕐 Restore time: $(date)"
