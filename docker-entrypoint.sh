#!/bin/sh
set -e

echo "Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "DATABASE_URL is configured"

# Optional: Run any runtime Prisma operations here if needed
# For example, if you want to run migrations at startup:
echo "Running database migrations..."
npx prisma migrate deploy

# Optional: Seed the database if needed
# echo "Seeding database..."
# npm run seed

echo "Starting Next.js server..."
exec "$@" 