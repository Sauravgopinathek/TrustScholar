FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Hugging Face Spaces strictly run on port 7860
ENV PORT=7860
EXPOSE 7860

# Start the server
CMD ["npm", "start"]