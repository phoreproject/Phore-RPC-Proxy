# Docker file used for creating image used by Fargate
FROM node:10

# Update packages, download supervisord
RUN apt-get update && apt-get install -y supervisor

# Download node modules
WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm install

# Download and unpack phore binaries
RUN wget -O phore.tar.gz https://github.com/phoreproject/Phore/releases/download/v1.3.3.1/phore-1.3.3.1-x86_64-linux-gnu.tar.gz
RUN mkdir phore
RUN tar -xzf phore.tar.gz -C phore --strip-components=1
RUN cp ./phore/bin/phored ./phored

# Copy rest of scripts
COPY . /usr/src/app/

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
