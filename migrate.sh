#!/bin/bash

# Database migration script for theFOX application
set -e

echo "🗄️ Running database migrations for theFOX application..."

# Configuration
DATABASE_URL="sqlite:///app/data/thefox.db"
MIGRATIONS_DIR="backend/migrations"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --up)
            UP=true
            shift
            ;;
        --down)
            DOWN=true
            shift
            ;;
        --status)
            STATUS=true
            shift
            ;;
        --create)
            CREATE_MIGRATION="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --up                  Run pending migrations"
            echo "  --down                Rollback last migration"
            echo "  --status              Show migration status"
            echo "  --create NAME         Create new migration"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create migration
if [ ! -z "$CREATE_MIGRATION" ]; then
    echo "📝 Creating migration: $CREATE_MIGRATION"
    
    # Get next migration number
    NEXT_NUM=$(ls $MIGRATIONS_DIR/*.sql 2>/dev/null | wc -l | awk '{print $1+1}')
    MIGRATION_FILE=$(printf "%04d_%s.sql" $NEXT_NUM $CREATE_MIGRATION)
    
    # Create migration file
    cat > "$MIGRATIONS_DIR/$MIGRATION_FILE" << EOF
-- Migration: $CREATE_MIGRATION
-- Created: $(date)

-- Up migration
-- Add your SQL statements here

-- Down migration
-- Add your rollback statements here
EOF
    
    echo "✅ Migration created: $MIGRATION_FILE"
    exit 0
fi

# Show status
if [ "$STATUS" = true ]; then
    echo "📊 Migration status:"
    
    if [ -f "$DATABASE_URL" ]; then
        echo "✅ Database exists"
    else
        echo "❌ Database not found"
    fi
    
    echo "📁 Available migrations:"
    ls -la $MIGRATIONS_DIR/*.sql 2>/dev/null || echo "No migrations found"
    
    exit 0
fi

# Run migrations
if [ "$UP" = true ]; then
    echo "⬆️ Running pending migrations..."
    
    # Create database directory if it doesn't exist
    mkdir -p $(dirname $DATABASE_URL | sed 's|sqlite://||')
    
    # Run migrations
    for migration in $MIGRATIONS_DIR/*.sql; do
        if [ -f "$migration" ]; then
            echo "Running migration: $(basename $migration)"
            sqlite3 "$(echo $DATABASE_URL | sed 's|sqlite://||')" < "$migration"
        fi
    done
    
    echo "✅ Migrations completed"
fi

# Rollback migrations
if [ "$DOWN" = true ]; then
    echo "⬇️ Rolling back last migration..."
    
    # Get last migration
    LAST_MIGRATION=$(ls $MIGRATIONS_DIR/*.sql 2>/dev/null | tail -1)
    
    if [ -z "$LAST_MIGRATION" ]; then
        echo "❌ No migrations to rollback"
        exit 1
    fi
    
    echo "Rolling back: $(basename $LAST_MIGRATION)"
    
    # Extract down migration from file
    DOWN_SQL=$(awk '/^-- Down migration/,/^-- /' "$LAST_MIGRATION" | sed '1d;$d')
    
    if [ ! -z "$DOWN_SQL" ]; then
        echo "$DOWN_SQL" | sqlite3 "$(echo $DATABASE_URL | sed 's|sqlite://||')"
        echo "✅ Rollback completed"
    else
        echo "⚠️ No down migration found in $LAST_MIGRATION"
    fi
fi

echo "✅ Migration operations completed!"
