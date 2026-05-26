# Stage 1: Build React frontend
FROM node:16-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:16-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build:server

# Stage 3: Production
FROM node:16-alpine
WORKDIR /app

# Copy backend dependencies and built files
COPY package*.json ./
RUN npm install --production
COPY --from=backend-builder /app/dist ./dist

# Copy frontend built files
COPY --from=frontend-builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["npm", "start"]

# Made with Bob
