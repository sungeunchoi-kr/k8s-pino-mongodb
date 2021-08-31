FROM node:14-slim

ENV PATH="node_modules/.bin:${PATH}"

RUN apt-get update && \
    apt-get install -y python

WORKDIR /usr/src/app

#COPY package*.json ./

#RUN npm install
RUN npm install -g pino-mongodb

COPY . .

CMD [ "node", "index.js" ]
