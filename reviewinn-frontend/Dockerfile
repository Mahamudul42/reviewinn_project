# Development Dockerfile for React frontend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variable to indicate Docker environment
ENV VITE_DOCKER=true

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"] 