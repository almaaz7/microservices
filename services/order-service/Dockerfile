# 1. Start from a Node.js base image                                                                                                                       
FROM node:22-alpine

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy the root package.json and lockfile first (for layer caching)
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# 4. Copy only what this service needs
COPY packages/shared ./packages/shared
COPY services/order-service ./services/order-service

# 5. Install dependencies (workspace-aware)
RUN npm install

# 6. Build the shared package (services depend on its dist/)
RUN npm run build --workspace=packages/shared

# Generate Prisma Client
RUN npx prisma generate --schema=services/order-service/prisma/schema.prisma

# 7. Expose the port
EXPOSE 3003

# Run migrations, then start the service
CMD cd services/order-service && npx prisma migrate deploy && cd /app && npm run dev --workspace=services/order-service

# 8. Command to run when the container starts
# CMD ["npm", "run", "dev", "--workspace=services/order-service"]