FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY elasticsearch-mapping.json ./

EXPOSE 3007

CMD ["npm", "start"]