FROM bdsmaneger/node_image:latest
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -y install curl wget git zsh
RUN export username="vscodedev" && \
    export password="1a113Luca" && \
    pass=$(perl -e 'print crypt($ARGV[0], "password")' $password); \
    useradd -m -p "$pass" "$username"; \
    addgroup ${username} sudo; addgroup ${username} root; \
    usermod --shell /bin/bash --home /home/bds ${username}; \
    echo "${username}   ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    chmod 7777 -Rv /home && chown vscodedev:vscodedev /home -Rv