# Use official Node runtime
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server with host option to bind external ports
CMD ["npm", "run", "dev", "--", "--host"]
