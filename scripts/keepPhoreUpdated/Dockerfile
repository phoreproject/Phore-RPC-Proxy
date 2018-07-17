# To start that docker file use
# docker build -t keep_phore_updated .
# docker run -v LOCAL_BACKUP_DIR:/data/backup_dir -t keep_phore_updated
FROM node:10

WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm install
COPY . /usr/src/app/

RUN wget -O phore.tar.gz https://github.com/phoreproject/Phore/releases/download/v1.3.2/phore-1.3.2-x86_64-linux-gnu.tar.gz
RUN mkdir phored
RUN tar -xzf phore.tar.gz -C phored --strip-components=1

RUN mkdir /root/.phore/
RUN mkdir -p /data/backup_dir

ENV PHORE_CLI ./phored/bin/phore-cli
ENV PHORED_EXEC ./phored/bin/phored
ENV PHORED_DATA_DIR /root/.phore/
ENV PHORED_BACKUP_DIR /data/backup_dir
ENV RPC_USER phorerpc
ENV RPC_PASS CLQAWNfstzFzq3xm1qpG4aX75U2CoVpZqBkkz4QvzY7b

CMD npm start
