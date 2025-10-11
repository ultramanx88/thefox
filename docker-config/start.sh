#!/bin/bash

# Start script for theFOX application
set -e

echo "Starting theFOX application..."

# Initialize database if it doesn't exist
if [ ! -f /app/data/thefox.db ]; then
    echo "Initializing database..."
    mkdir -p /app/data
    cd /app/backend
    ./thefox-backend migrate
fi

# Start all services with supervisor
echo "Starting services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
