FROM node:24-slim

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]
