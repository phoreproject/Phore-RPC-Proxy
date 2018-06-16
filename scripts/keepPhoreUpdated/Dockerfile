FROM node:10

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app

RUN wget -O phore.tar.gz https://github.com/phoreproject/Phore/releases/download/v1.2.2/phore-1.2.2-x86_64-linux-gnu.tar.gz
RUN mkdir phored
RUN tar -xzf phore.tar.gz -C phored --strip-components=1

RUN mkdir ~/.phore
RUN echo "rpcuser=phorerpc" >> ~/.phore/phore.conf
RUN echo "rpcpassword=CLQAWNfstzFzq3xm1qpG4aX75U2CoVpZqBkkz4QvzY7b" >> ~/.phore/phore.conf

ENV PHORE_CLI ./phored/bin/phore-cli
ENV PHORED_EXEC ./phored/bin/phored
ENV PHORED_DATA_DIR ~/.phore/
ENV PHORED_BACKUP_DIR ./backup_dir

CMD node keepPhoreUpdated.js
