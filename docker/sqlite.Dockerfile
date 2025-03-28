FROM node:18-bookworm-slim AS build
WORKDIR /build
COPY .yarn/releases ./.yarn/releases
RUN yarn set version berry
COPY .swcrc tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
COPY src/ ./src/
RUN yarn run build

FROM node:18-bookworm-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates curl

RUN yarn global add pm2
COPY .yarn/releases ./.yarn/releases
RUN yarn set version berry

COPY .swcrc tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn workspaces focus --all --production

COPY .env.template \
    README.md \
    LICENSE CODE_OF_CONDUCT.md \
    CONTRIBUTING.md \
    SECURITY.md \
    .dockerignore ./
COPY --from=build /build/dist/ ./dist/

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]

# SQLite Alpha adjustments
ENV ENABLE_EXPERIMENTAL_TYPEORM=true
ENV DATABASE_PATH="./database"
ENV DATABASE_FILE="fdm-monster.sqlite"
