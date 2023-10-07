FROM node:18-bookworm-slim as build
WORKDIR /build

COPY .swcrc tsconfig.json package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 1000000
COPY src/ ./src/
RUN yarn run build

FROM node:18-bookworm-slim as production
WORKDIR /app

RUN yarn global add pm2

COPY .swcrc tsconfig.json package.json yarn.lock ./
# Timeout is needed for yarn install to work on arm64 emulation (qemu)
RUN yarn install --production --frozen-lockfile --network-timeout 1000000

COPY .env.template \
    migrate-mongo-config.js \
    README.md \
    LICENSE CODE_OF_CONDUCT.md \
    CONTRIBUTING.md \
    SECURITY.md \
    .dockerignore ./
COPY --from=build /build/dist/ ./dist/

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
