# Docker file used for creating image used by Fargate
FROM node:10

WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm install

RUN wget -O phore.tar.gz https://github.com/phoreproject/Phore/releases/download/v1.3.2/phore-1.3.2-x86_64-linux-gnu.tar.gz
RUN mkdir phore
RUN tar -xzf phore.tar.gz -C phore --strip-components=1
RUN cp ./phore/bin/phored ./phored

COPY . /usr/src/app/

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379

EXPOSE 11771
EXPOSE 11772
EXPOSE 80

CMD npm start
