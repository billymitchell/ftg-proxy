FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production  # More reliable installations for production

# Copy the rest of your application code
COPY . .

# Add a non-root user
USER node

# Expose the port your app listens on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/ || exit 1

# Start your application
CMD ["node", "app.js"]
