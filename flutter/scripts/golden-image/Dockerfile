FROM ubuntu:24.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates curl git libfontconfig1 libglu1-mesa libstdc++6 libx11-6 libxrender1 \
    python3 unzip xz-utils \
    && rm -rf /var/lib/apt/lists/*
COPY record.sh /usr/local/bin/record
ENTRYPOINT ["/usr/local/bin/record"]
