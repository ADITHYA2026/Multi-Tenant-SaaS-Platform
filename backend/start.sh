#!/bin/sh

echo "Running database migrations..."
node scripts/init-db.js

echo "Starting server..."
node src/server.js