# Use alpine slim for smaller image size
FROM node:18-alpine AS base

# Use debian for prisma generation to avoid binary issues
FROM node:18-slim AS prisma-builder
WORKDIR /app

# Install dependencies for Prisma generation
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# Set environment for Prisma generation
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x,debian-openssl-3.0.x,rhel-openssl-1.0.x"

# Generate Prisma Client
RUN npx prisma generate

# Install dependencies only when needed
FROM base AS deps
COPY ../prisma  ./app

WORKDIR /app

# Install OpenSSL and other required dependencies for Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
COPY ../prisma  ./app
WORKDIR /app

# Install OpenSSL and build dependencies for Alpine
RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
# Copy the pre-generated Prisma client from debian builder
COPY --from=prisma-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY . .

# Environment variables for build time
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_COMMIT_HASH
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG NEXTAUTH_SECRET
ARG API_ENDPOINT
ARG AWS_REGION
ARG AWS_SNS_TOPIC_ARN
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

# Use a dummy DATABASE_URL for build time (Prisma needs this to exist)
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV NEXTAUTH_URL=${NEXTAUTH_URL:?"NEXTAUTH_URL is required"}
ENV NEXT_PUBLIC_COMMIT_HASH=${NEXT_PUBLIC_COMMIT_HASH}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV API_ENDPOINT=${API_ENDPOINT}
ENV AWS_REGION=${AWS_REGION}
ENV AWS_SNS_TOPIC_ARN=${AWS_SNS_TOPIC_ARN}
ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

# Build application (Prisma client already generated)
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install OpenSSL in the final image
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy the entrypoint script
COPY --from=builder --chown=root:root /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a startup script that can handle runtime initialization
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]