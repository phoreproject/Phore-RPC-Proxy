# Docker file used for creating image used by Fargate
FROM node:10

WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm install

RUN wget -O phore.tar.gz https://github.com/phoreproject/Phore/releases/download/v1.2.2/phore-1.2.2-x86_64-linux-gnu.tar.gz
RUN mkdir phored
RUN tar -xzf phore.tar.gz -C phored --strip-components=1

COPY . /usr/src/app/phored/bin
WORKDIR /usr/src/app/phored/bin

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379

EXPOSE 11772
EXPOSE 80

ENTRYPOINT npm prestart && npm start
