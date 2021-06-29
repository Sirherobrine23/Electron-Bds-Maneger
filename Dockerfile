FROM bdsmaneger/node_image:latest
RUN export username="thebds" && export password="123aa3456s7" && \
    pass=$(perl -e 'print crypt($ARGV[0], "password")' $password); \
    useradd -m -p "$pass" "$username"; \
    addgroup ${username} sudo; \
    addgroup ${username} root; \
    usermod --shell /bin/bash --home /home/bds ${username}; \
    echo "${username}   ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    mkdir -vp /home/bds/bds_core; chmod -Rv 7777 /home && chown thebds:thebds -Rv /home
COPY ./ /opt/BdsManegerWeb
WORKDIR /opt/BdsManegerWeb
RUN npm install --no-save && chmod a+x -v index.js
EXPOSE 19132/udp 19133/udp 1932/tcp 3000:80/tcp

USER thebds
VOLUME [ "/home/bds/bds_core" ]

WORKDIR /home/bds/
ENTRYPOINT [ "/opt/BdsManegerWeb/index.js" , "--DockerImage" ]