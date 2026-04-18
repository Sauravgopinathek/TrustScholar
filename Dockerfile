FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY backend/ ./

# Expose port (Hugging Face uses 7860)
ENV PORT=7860
EXPOSE 7860

# Start the server
CMD ["npm", "start"]
