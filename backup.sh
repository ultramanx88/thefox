#!/bin/bash

# Backup script for theFOX application
set -e

echo "💾 Starting backup for theFOX application..."

# Configuration
BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="thefox_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
echo "📦 Creating backup..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    /app/data \
    /app/uploads \
    /var/log/supervisor \
    /var/log/nginx

# Upload to Google Cloud Storage (optional)
if [ ! -z "$GCS_BUCKET" ]; then
    echo "☁️ Uploading backup to Google Cloud Storage..."
    gsutil cp "$BACKUP_DIR/$BACKUP_FILE" "gs://$GCS_BUCKET/backups/$BACKUP_FILE"
    
    # Clean up local backup
    rm "$BACKUP_DIR/$BACKUP_FILE"
fi

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "thefox_backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_FILE"
