FROM node:26-slim

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]
