FROM node:22-bookworm-slim

USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    HF_SPACE_PUBLIC_MODE=true \
    NEXT_PUBLIC_HF_SPACE_PUBLIC_MODE=true \
    PORT=7860 \
    HOSTNAME=0.0.0.0 \
    API_ORIGIN=http://127.0.0.1:4000

WORKDIR $HOME/app

COPY --chown=node:node . $HOME/app

RUN npm ci --include=dev
RUN npm run build:runtime-packages
RUN npm run build --workspace=@apps/web

ENV NODE_ENV=production

EXPOSE 7860

CMD ["npm", "run", "start", "--workspace=@apps/web", "--", "-H", "0.0.0.0", "-p", "7860"]
