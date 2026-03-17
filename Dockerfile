# Use Node.js LTS version
FROM node:20-alpine

# Set ENV for config to be stored in the persistent volume
ENV XDG_CONFIG_HOME=/usr/src/app/data/config

# Download and install gogcli
RUN apk add --no-cache curl tar && \
    curl -sL https://github.com/steipete/gogcli/releases/download/v0.12.0/gogcli_0.12.0_linux_amd64.tar.gz | tar xz -C /usr/local/bin gogcli && \
    mv /usr/local/bin/gogcli /usr/local/bin/gog

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
