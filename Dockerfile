# Build stage
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Runtime stage
FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

RUN addgroup -S botgroup && adduser -S botuser -G botgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/data /app/logs && chown -R botuser:botgroup /app

USER botuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]