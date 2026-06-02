# syntax=docker/dockerfile:1

# ── Builder ──────────────────────────────────────────────
# Build context is the repo root so the npm workspaces
# (apps/web + apps/rag) resolve correctly.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Install all deps (incl. dev) using the workspace manifests first
# so this layer caches when only source changes.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/rag/package.json apps/rag/package.json
RUN npm ci

# Copy sources and build: rag → web server (tsc) → web client (vite)
COPY apps/rag apps/rag
COPY apps/web apps/web
RUN npm --workspace apps/rag run build \
 && npm --workspace apps/web run build

# Drop dev dependencies to slim the runtime image
RUN npm prune --omit=dev

# ── Runtime ──────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Hoisted workspace node_modules (incl. the training-rag symlink)
COPY --from=builder /app/node_modules ./node_modules
# Built rag package (training-rag → apps/rag/dist/index.js)
COPY --from=builder /app/apps/rag ./apps/rag
# Built web server + bundled client (apps/web/dist/{server.js,db.js,client/})
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# The server resolves dist/client relative to process.cwd()
WORKDIR /app/apps/web
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/server.js"]
