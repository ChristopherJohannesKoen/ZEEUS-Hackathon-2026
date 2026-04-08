FROM node:22-bookworm-slim

RUN useradd -m -u 1000 user

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HF_SPACE_PUBLIC_MODE=true \
    NEXT_PUBLIC_HF_SPACE_PUBLIC_MODE=true \
    PORT=7860 \
    HOSTNAME=0.0.0.0 \
    API_ORIGIN=http://127.0.0.1:4000

WORKDIR $HOME/app

COPY --chown=user . $HOME/app

RUN npm ci
RUN npm run build:runtime-packages
RUN npm run build --workspace=@apps/web

EXPOSE 7860

CMD ["npm", "run", "start", "--workspace=@apps/web", "--", "-H", "0.0.0.0", "-p", "7860"]
