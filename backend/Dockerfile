FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Make start.sh executable
RUN chmod +x /app/start.sh

EXPOSE 5000

CMD ["/app/start.sh"]