# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Declare build arguments
ARG NEXT_PUBLIC_COMMIT_HASH
ARG PRISMA_CLI_QUERY_ENGINE_TYPE
ARG PRISMA_CLIENT_ENGINE_TYPE
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG DATABASE_URL

# Convert build args to environment variables if needed
ENV NEXT_PUBLIC_COMMIT_HASH=${NEXT_PUBLIC_COMMIT_HASH}
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=${PRISMA_CLI_QUERY_ENGINE_TYPE}
ENV PRISMA_CLIENT_ENGINE_TYPE=${PRISMA_CLIENT_ENGINE_TYPE}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL:?"DATABASE_URL is required"}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:?"NEXTAUTH_URL is required"}

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Add OpenSSL installation
# RUN apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/v3.14/main openssl1.1
RUN apk add --no-cache openssl1.1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure DATABASE_URL and NEXTAUTH_URL are valid during build
ARG DATABASE_URL
ARG NEXTAUTH_URL

ENV DATABASE_URL=${DATABASE_URL:?"DATABASE_URL is required"}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:?"NEXTAUTH_URL is required"}
ENV NEXT_PUBLIC_COMMIT_HASH=${NEXT_PUBLIC_COMMIT_HASH}
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=${PRISMA_CLI_QUERY_ENGINE_TYPE}
ENV PRISMA_CLIENT_ENGINE_TYPE=${PRISMA_CLIENT_ENGINE_TYPE}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client before building
RUN npx prisma generate

RUN npm run build
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl1.1

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

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]