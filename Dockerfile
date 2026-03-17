# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p data

# Expose data volume
VOLUME [ "/usr/src/app/data" ]

# Start the bot
CMD [ "npm", "start" ]
