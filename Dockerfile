FROM node:25-slim

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]
