# syntax=docker/dockerfile:1.23

# This Dockerfile uses a multi-stage build for optimal image size and security
# Supports multi-platform builds (AMD64/ARM64) via Docker buildx

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM node:24.14.1-alpine AS deps
WORKDIR /app

# Install libc6-compat for Alpine compatibility with Node packages
RUN apk add --no-cache libc6-compat

# Copy package files for dependency installation
COPY package.json yarn.lock ./

# Install dependencies using yarn with frozen lockfile for reproducibility
# --frozen-lockfile ensures the exact versions from yarn.lock are used
RUN yarn install --frozen-lockfile --production=false

# -----------------------------------------------------------------------------
# Stage 2: Build the application
# -----------------------------------------------------------------------------
FROM node:24.14.1-alpine AS builder
WORKDIR /app

# Placeholder values so next build can inline NEXT_PUBLIC_* references.
# Real values are injected at container startup via docker-entrypoint.sh.
ENV NEXT_PUBLIC_API_BASE_URL=http://placeholder \
    NEXT_PUBLIC_WS_URL=ws://placeholder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Explicitly set HOSTNAME to prevent capturing build container's ID
ENV HOSTNAME=0.0.0.0

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build the application
# The build script already includes --turbopack flag for faster builds
RUN yarn build

# -----------------------------------------------------------------------------
# Stage 3: Production runner
# -----------------------------------------------------------------------------
FROM node:24.14.1-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone build output from builder
# Next.js standalone output includes only necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy entrypoint script that generates runtime env vars
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Health check to ensure the container is healthy
# Checks if the Next.js server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start via entrypoint that generates runtime env config
ENTRYPOINT ["/app/docker-entrypoint.sh"]
