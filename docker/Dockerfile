FROM node:18-bookworm-slim as build
WORKDIR /build
COPY .yarn/releases ./.yarn/releases
RUN yarn set version berry
COPY .swcrc tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
COPY src/ ./src/
RUN yarn run build

FROM node:18-bookworm-slim as production
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates curl

RUN yarn global add pm2
COPY .yarn/releases ./.yarn/releases
RUN yarn set version berry

COPY .swcrc tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn workspaces focus --all --production

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
