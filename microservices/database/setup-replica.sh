#!/bin/bash
set -e

# Wait for master to be ready
until pg_isready -h postgres-user-master -p 5432 -U postgres; do
  echo "Waiting for master database..."
  sleep 2
done

# Stop PostgreSQL
pg_ctl -D "$PGDATA" -m fast -w stop || true

# Remove existing data
rm -rf "$PGDATA"/*

# Create base backup from master
PGPASSWORD=replicator_password pg_basebackup -h postgres-user-master -D "$PGDATA" -U replicator -v -P -W

# Create recovery configuration
cat > "$PGDATA/postgresql.auto.conf" << EOF
primary_conninfo = 'host=postgres-user-master port=5432 user=replicator password=replicator_password'
hot_standby = on
EOF

# Create standby signal
touch "$PGDATA/standby.signal"

# Start PostgreSQL
pg_ctl -D "$PGDATA" -l "$PGDATA/log" start