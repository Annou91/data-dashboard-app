FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --timeout=300000

COPY . .

EXPOSE 3000

ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "start"]