# Use a lightweight Node image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install npm dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy your React app
COPY frontend/ ./

# Expose React dev server port
EXPOSE 3000

# Start in development mode
CMD ["npm", "start"]
