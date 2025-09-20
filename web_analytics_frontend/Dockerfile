# frontend/Dockerfile

# Step 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Step 2: Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]
