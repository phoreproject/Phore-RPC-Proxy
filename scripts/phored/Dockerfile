# Docker file used for creating image used by Fargate
FROM node:10

# RPC pass and username is necessary
# specify it with --build-arg docker command
ARG RPC_USER
RUN test -n "$RPC_USER"
ENV RPC_USER $RPC_USER

ARG RPC_PASS
RUN test -n "$RPC_PASS"
ENV RPC_PASS $RPC_PASS

# Update packages, download supervisord
RUN apt-get update && apt-get install -y supervisor

# Download node modules
WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm install

# Download and unpack phore binaries
RUN wget -O phore.tar.gz https://github.com/phoreproject/Phore/releases/download/v1.5.0/phore-1.5.0-x86_64-linux-gnu.tar.gz
RUN mkdir phore
RUN tar -xzf phore.tar.gz -C phore --strip-components=1
RUN cp ./phore/bin/phored ./phored

# Copy rest of scripts
COPY . /usr/src/app/
# Hack for supervisord problems with env variables
RUN echo command=./phored -printtoconsole -server -rpcuser=$RPC_USER -rpcpassword=$RPC_PASS -rest "\"-blocknotify=node ./notify.js blocknotify %%s\"" "\"-mempoolnotify=node ./notify.js mempoolnotify %%s\"" >> supervisord.conf

# Create dir for supervisord logs
RUN mkdir /usr/src/app/log

# Document necessary env variables
ENV REDIS_HOST 127.0.0.1
ENV REDIS_PORT 6379

# Document necessary ports
EXPOSE 11771
EXPOSE 11772
EXPOSE 80

# Run npm start script
CMD npm start
