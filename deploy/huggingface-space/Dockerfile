FROM node:22-bookworm-slim

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    git \
    git-lfs \
    openssl \
    ca-certificates \
    curl \
    postgresql \
    redis-server \
    util-linux \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    API_ORIGIN=http://127.0.0.1:4000 \
    PORT=7860 \
    HOSTNAME=0.0.0.0

WORKDIR $HOME/app

COPY . $HOME/app

RUN npm ci --include=dev
RUN npx playwright install --with-deps chromium
RUN npm run build:runtime-packages
RUN npm run build --workspace=@apps/api
RUN npm run build --workspace=@apps/worker
RUN npm run build --workspace=@apps/web

ENV NODE_ENV=production

EXPOSE 7860

COPY deploy/huggingface-space/space-entrypoint.sh /usr/local/bin/space-entrypoint.sh
RUN chmod +x /usr/local/bin/space-entrypoint.sh

CMD ["/usr/local/bin/space-entrypoint.sh"]
