
# --- Stage 1: Deps ---
FROM node:20-slim AS deps
WORKDIR /app
# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
# Install dependencies including devDependencies (needed for prisma generate/build)
RUN npm ci

# --- Stage 2: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create the SQLite database and seed it during build (Baking data into image)
# This ensures the app starts with data immediately.
# Note: In Cloud Run, changes to this DB are ephemeral (lost on restart).
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma migrate deploy
RUN npx tsx prisma/seed.ts

# Build Next.js
RUN npm run build

# --- Stage 3: Python/Runner (Optimized) ---
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install OpenSSL (runtime dependency for Prisma)
RUN apt-get update -y && apt-get install -y openssl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy the baked database and prisma schema (client needs schema sometimes, or just for clarity)
# We copy dev.db to a location. Note that standalone build usually doesn't include the DB file.
COPY --from=builder --chown=nextjs:nodejs /app/dev.db ./dev.db
# Prisma client might expect the DB at the configured path
ENV DATABASE_URL="file:/app/dev.db"

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
