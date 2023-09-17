FROM node:18-bookworm-slim as build
WORKDIR /build

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY server/ ./server/
RUN yarn build

FROM node:18-bookworm-slim as production
WORKDIR /app

RUN yarn global add pm2

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY .env.template \
    migrate-mongo-config.js \
    tsconfig.json \
    README.md \
    LICENSE CODE_OF_CONDUCT.md CONTRIBUTING.md \
    SECURITY.md \
    .swcrc \
    .dockerignore ./
COPY --from=build /build/dist/ ./dist/

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
