FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# copy app files
COPY . .

EXPOSE 8000
CND ["node", "server.js"]
