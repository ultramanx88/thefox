#!/bin/bash

# Restore Script for TheFox Food Delivery Platform
# This script restores application data from backup

set -e

# Configuration
BACKUP_DIR="/var/backups/thefox"
DB_NAME="thefox_db"
DB_USER="postgres"
APP_DIR="/app/thefox"

# Check if backup name is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_name>"
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/*_manifest.json | sed 's/.*thefox_backup_\(.*\)_manifest.json/\1/'
    exit 1
fi

BACKUP_NAME="thefox_backup_$1"
MANIFEST_FILE="$BACKUP_DIR/${BACKUP_NAME}_manifest.json"

# Check if backup exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: Backup $BACKUP_NAME not found"
    exit 1
fi

echo "Starting restore process: $BACKUP_NAME"

# Read backup manifest
BACKUP_VERSION=$(jq -r '.version' "$MANIFEST_FILE")
BACKUP_TIMESTAMP=$(jq -r '.timestamp' "$MANIFEST_FILE")

echo "Backup version: $BACKUP_VERSION"
echo "Backup timestamp: $BACKUP_TIMESTAMP"

# Confirm restore
read -p "Are you sure you want to restore this backup? This will overwrite current data. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Create current backup before restore
echo "Creating safety backup of current state..."
SAFETY_BACKUP="safety_$(date +%Y%m%d_%H%M%S)"
./backup.sh > /dev/null 2>&1 || echo "Warning: Could not create safety backup"

# Stop application services
echo "Stopping application services..."
systemctl stop thefox || true
systemctl stop nginx || true

# Restore database
echo "Restoring database..."
dropdb -U "$DB_USER" "$DB_NAME" || true
createdb -U "$DB_USER" "$DB_NAME"
gunzip -c "$BACKUP_DIR/${BACKUP_NAME}_db.sql.gz" | psql -U "$DB_USER" "$DB_NAME"

# Restore application files
echo "Restoring application files..."
rm -rf "$APP_DIR.backup" || true
mv "$APP_DIR" "$APP_DIR.backup" || true
mkdir -p "$APP_DIR"
tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_files.tar.gz" -C /

# Restore uploads
echo "Restoring user uploads..."
rm -rf /app/uploads.backup || true
mv /app/uploads /app/uploads.backup || true
tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C /

# Restore configuration
echo "Restoring configuration..."
tar -xzf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" -C /

# Install dependencies
echo "Installing dependencies..."
cd "$APP_DIR"
npm install --production

# Run migrations if needed
echo "Running database migrations..."
npm run migrate || true

# Set proper permissions
echo "Setting permissions..."
chown -R app:app "$APP_DIR"
chown -R app:app /app/uploads
chmod +x "$APP_DIR/scripts/"*.sh

# Start services
echo "Starting services..."
systemctl start thefox
systemctl start nginx

# Verify services
echo "Verifying services..."
sleep 5
if systemctl is-active --quiet thefox && systemctl is-active --quiet nginx; then
    echo "✅ Services started successfully"
else
    echo "❌ Service startup failed"
    echo "TheFox service status: $(systemctl is-active thefox)"
    echo "Nginx service status: $(systemctl is-active nginx)"
    exit 1
fi

# Health check
echo "Performing health check..."
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ Application is responding"
else
    echo "❌ Application health check failed"
    exit 1
fi

# Log restore event
echo "$(date -Iseconds): Restored backup $BACKUP_NAME" >> /var/log/thefox-restore.log

# Send notification
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ Restore completed: $BACKUP_NAME\"}"
fi

echo "Restore process completed successfully"
echo "Previous state backed up to: $APP_DIR.backup and /app/uploads.backup"