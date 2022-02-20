FROM node:17.5-bullseye-slim
WORKDIR /app

RUN npm install -g pm2

COPY . .
RUN npm ci --production

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
