FROM node:18-bullseye-slim
WORKDIR /app

RUN npm i -g pnpm
RUN pnpm add -g pm2

COPY . .
RUN pnpm install --prod

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
