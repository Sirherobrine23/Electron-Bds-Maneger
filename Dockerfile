FROM ghcr.io/the-bds-maneger/base:main
WORKDIR /opt/BdsManegerWeb
COPY ./ ./
RUN npm install --no-save && chmod a+x -v index.js
EXPOSE 19132/udp 19133/udp 1932/tcp 3000:80/tcp

USER thebds
VOLUME [ "/home/bds/bds_core" ]

WORKDIR /home/bds/
ENTRYPOINT [ "/opt/BdsManegerWeb/index.js" , "--DockerImage" ]