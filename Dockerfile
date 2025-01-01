# Use debian-based image instead of alpine
FROM node:18-alpine AS base

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

# Install OpenSSL for Alpine
RUN apk add --no-cache openssl libc6-compat

# Set Prisma binary target for Alpine
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_COMMIT_HASH
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG NEXTAUTH_SECRET

ENV DATABASE_URL=${DATABASE_URL:?"DATABASE_URL is required"}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:?"NEXTAUTH_URL is required"}
ENV NEXT_PUBLIC_COMMIT_HASH=${NEXT_PUBLIC_COMMIT_HASH}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Generate Prisma Client
# RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install OpenSSL in the final image
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ARG DATABASE_URL
ARG NEXTAUTH_URL

ENV NODE_ENV=production
# Ensure required URLs are set in production
ENV DATABASE_URL=${DATABASE_URL:?"DATABASE_URL is required"}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:?"NEXTAUTH_URL is required"}
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

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]