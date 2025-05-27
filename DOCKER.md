# Docker Setup Guide

This document explains how to build and run the workout tracker application using Docker, without requiring a database connection during the build process.

## Key Changes Made

### 1. Fixed Prisma Connection Issues
- Modified `src/lib/prisma.ts` to use lazy database connections
- Removed immediate database connection calls that were causing build failures
- Added environment checks to prevent build-time database operations

### 2. Updated Dockerfile
- Uses a dummy `DATABASE_URL` during build time to satisfy Prisma requirements
- Enables `RUN npx prisma generate` which doesn't require database connection
- Separates build-time and runtime environment variables
- Added proper Alpine Linux dependencies for Prisma

### 3. Added Runtime Initialization
- Created `docker-entrypoint.sh` for runtime database operations
- Added environment validation utilities
- Proper error handling for missing environment variables

## Building the Docker Image

You can now build the Docker image without needing an active database connection:

```bash
# Build the image (no DATABASE_URL required at build time)
docker build -t workout-tracker \
  --build-arg NEXTAUTH_URL=http://localhost:3000 \
  --build-arg NEXTAUTH_SECRET=your-secret-here \
  .
```

### Required Build Arguments
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secret for NextAuth.js

### Optional Build Arguments
- `GOOGLE_CLIENT_ID`: For Google OAuth
- `GOOGLE_CLIENT_SECRET`: For Google OAuth  
- `NEXT_PUBLIC_COMMIT_HASH`: Git commit hash
- `API_ENDPOINT`: External API endpoint
- `AWS_*`: AWS configuration

## Running the Container

When running the container, you **must** provide the real database URL and other runtime environment variables:

```bash
# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e GOOGLE_CLIENT_ID="your-google-client-id" \
  -e GOOGLE_CLIENT_SECRET="your-google-secret" \
  workout-tracker
```

### Required Runtime Environment Variables
- `DATABASE_URL`: Real PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secret for NextAuth.js

### Optional Runtime Environment Variables
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google OAuth
- `AWS_*`: AWS configuration for additional features

## Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/workout_tracker
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-here
      - GOOGLE_CLIENT_ID=your-google-client-id
      - GOOGLE_CLIENT_SECRET=your-google-client-secret
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=workout_tracker
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Then run:
```bash
docker-compose up --build
```

## Troubleshooting

### Build Fails with Database Connection Error
- Ensure you're using the updated Dockerfile with dummy DATABASE_URL
- Check that `src/lib/prisma.ts` has been updated to remove immediate connections

### Runtime Database Connection Issues
- Verify your `DATABASE_URL` is correct and accessible
- Check that the database server is running and reachable
- Ensure your database user has the necessary permissions

### Prisma Issues
- The Prisma client is generated during build time (no DB connection needed)
- Database migrations should be run separately or via the entrypoint script
- Check that the Prisma schema matches your database structure

## Optional: Database Migrations at Runtime

If you want to run database migrations when the container starts, uncomment the relevant lines in `docker-entrypoint.sh`:

```bash
# Uncomment these lines in docker-entrypoint.sh
echo "Running database migrations..."
npx prisma migrate deploy
```

## Development vs Production

### Development
- The application connects to the database lazily
- Connection failures are logged as warnings, not errors
- Hot reloading works normally

### Production  
- Database connection is required at runtime
- The entrypoint script validates environment variables
- Prisma client is pre-generated for optimal performance

This setup allows you to build Docker images in CI/CD pipelines without requiring database access, while ensuring proper database connectivity at runtime. 