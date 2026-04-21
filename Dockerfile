# Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend and serve
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production
COPY backend/ ./
WORKDIR /app
COPY --from=frontend-builder /app/frontend/build ./frontend/build

ENV PORT=7860
EXPOSE 7860

CMD ["node", "backend/server.js"]
