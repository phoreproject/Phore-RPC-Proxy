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
ENV PHORED_RPC_PORT 11772
ENV PHORED_WEB_PORT 80

EXPOSE 80

CMD npm start
