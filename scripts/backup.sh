#!/bin/bash

# Automated Backup Script for TheFox Food Delivery Platform
# This script creates automated backups of the application data

set -e

# Configuration
BACKUP_DIR="/var/backups/thefox"
DB_NAME="thefox_db"
DB_USER="postgres"
RETENTION_DAYS=30
MAX_BACKUPS=50

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="thefox_backup_$TIMESTAMP"

echo "Starting backup process: $BACKUP_NAME"

# Database backup
echo "Backing up database..."
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_DIR/${BACKUP_NAME}_db.sql.gz"

# Application files backup
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_files.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='tmp' \
    /app/thefox

# User uploads backup
echo "Backing up user uploads..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" /app/uploads

# Configuration backup
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    /app/config \
    /etc/nginx/sites-available/thefox \
    /etc/systemd/system/thefox.service

# Create backup manifest
cat > "$BACKUP_DIR/${BACKUP_NAME}_manifest.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$(date -Iseconds)",
  "version": "$(cat /app/thefox/package.json | grep version | cut -d'"' -f4)",
  "components": {
    "database": "${BACKUP_NAME}_db.sql.gz",
    "application": "${BACKUP_NAME}_files.tar.gz",
    "uploads": "${BACKUP_NAME}_uploads.tar.gz",
    "config": "${BACKUP_NAME}_config.tar.gz"
  },
  "sizes": {
    "database": "$(stat -c%s "$BACKUP_DIR/${BACKUP_NAME}_db.sql.gz")",
    "application": "$(stat -c%s "$BACKUP_DIR/${BACKUP_NAME}_files.tar.gz")",
    "uploads": "$(stat -c%s "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz")",
    "config": "$(stat -c%s "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz")"
  }
}
EOF

# Calculate total backup size
TOTAL_SIZE=$(du -sb "$BACKUP_DIR"/${BACKUP_NAME}_* | awk '{sum += $1} END {print sum}')
echo "Backup completed. Total size: $(numfmt --to=iec $TOTAL_SIZE)"

# Cleanup old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "thefox_backup_*" -mtime +$RETENTION_DAYS -delete

# Keep only the latest N backups
ls -t "$BACKUP_DIR"/thefox_backup_*_manifest.json | tail -n +$((MAX_BACKUPS + 1)) | while read manifest; do
    backup_prefix=$(basename "$manifest" _manifest.json)
    echo "Removing old backup: $backup_prefix"
    rm -f "$BACKUP_DIR"/${backup_prefix}_*
done

# Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 sync "$BACKUP_DIR" "s3://$AWS_S3_BUCKET/backups/" --exclude "*" --include "${BACKUP_NAME}_*"
fi

# Send notification
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ Backup completed: $BACKUP_NAME ($(numfmt --to=iec $TOTAL_SIZE))\"}"
fi

echo "Backup process completed successfully"