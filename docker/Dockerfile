FROM node:24-bookworm-slim AS build
WORKDIR /build

COPY .yarn/releases ./.yarn/releases
COPY vite.config.ts tsconfig.json package.json yarn.lock .yarnrc.yml ./

# Hack: allows immutable lock check without limited yarn workspaces command
COPY packages ./packages
RUN yarn install --immutable

COPY src/ ./src/

RUN yarn run build

FROM node:24-bookworm-slim AS production
WORKDIR /app

RUN apt update && apt install -y ca-certificates curl &&  \
    apt clean && rm -rf /var/lib/apt/lists/*

RUN yarn global add pm2
COPY .yarn/releases ./.yarn/releases

COPY vite.config.ts tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn workspaces focus --production

COPY .env.template \
    README.md \
    LICENSE \
    CODE_OF_CONDUCT.md \
    CONTRIBUTING.md \
    SECURITY.md \
    .dockerignore ./
COPY --from=build /build/dist/ ./dist/

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["bash", "/usr/local/bin/entrypoint.sh"]
