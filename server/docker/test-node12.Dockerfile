# Test the Node12 environment to crash in a friendly manner
FROM node:12-stretch-slim
WORKDIR /app

RUN yarn global add pm2

COPY ../.. /app

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
