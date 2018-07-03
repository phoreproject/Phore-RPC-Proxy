FROM node:10

WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm install
COPY . /usr/src/app/

ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379
# phored host must be specified with protocol
ENV PHORED_HOST http://127.0.0.1
ENV PHORED_PORT 11771
ENV RPC_USER phorerpc
ENV RPC_PASS CLQAWNfstzFzq3xm1qpG4aX75U2CoVpZqBkkz4QvzY7b

EXPOSE 80

CMD npm start