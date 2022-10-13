FROM node:16.18-bullseye-slim
WORKDIR /app

RUN yarn global add pm2

COPY . .
RUN yarn install --production

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
