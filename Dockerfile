# Using Node.js image
FROM node:22

# Set working directory
WORKDIR /app

# Copy file package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy code into container
COPY . .

# Expose port Express.js
EXPOSE 3000

# Run APP
CMD ["node", "server.js"]
