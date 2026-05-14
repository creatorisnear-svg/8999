FROM node:24-slim

# Install pnpm (lockfile v9)
RUN npm install -g pnpm@9

WORKDIR /app

# Copy full workspace
COPY . .

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Build frontend + bundle into api-server/dist
RUN NODE_ENV=production pnpm --filter @workspace/api-server run build

# Ensure start script is executable
RUN chmod +x scripts/start-prod.sh

EXPOSE 8080

# Runs DB migration then starts the server
CMD ["sh", "scripts/start-prod.sh"]
