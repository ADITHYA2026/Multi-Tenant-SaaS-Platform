FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create a startup script
RUN echo '#!/bin/sh\n\
echo "Running database migrations..."\n\
node scripts/init-db.js\n\
echo "Starting server..."\n\
node src/server.js\n' > /app/start.sh && \
chmod +x /app/start.sh

EXPOSE 5000

# Use the startup script
CMD ["/app/start.sh"]