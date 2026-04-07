# Use Node.js LTS version
FROM node:20-alpine

# Set ENV for config to be stored in the persistent volume
ENV XDG_CONFIG_HOME=/usr/src/app/data/config
ENV NODE_OPTIONS=--openssl-legacy-provider

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN apk add --no-cache docker-cli git openssh
RUN npm install

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
