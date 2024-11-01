FROM node:18-bookworm-slim as build
WORKDIR /build

# Install only essential build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Copy yarn configuration first
COPY .yarn/releases ./.yarn/releases
RUN yarn set version berry

# Copy package files
COPY .swcrc tsconfig.json package.json yarn.lock .yarnrc.yml ./

# Enable yarn's network concurrency for faster installs
ENV YARN_NETWORK_CONCURRENCY=10

# Install dependencies with optimizations
RUN yarn config set enableGlobalCache true && \
    yarn install --immutable --inline-builds

COPY src/ ./src/
RUN yarn run build

FROM node:18-bookworm-slim as production
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

RUN yarn global add pm2
COPY .yarn/releases ./.yarn/releases
RUN yarn set version berry

# Copy package files
COPY .swcrc tsconfig.json package.json yarn.lock .yarnrc.yml ./

# Enable yarn's network concurrency for faster installs
ENV YARN_NETWORK_CONCURRENCY=10

# Install production dependencies with optimizations
RUN yarn config set enableGlobalCache true && \
    yarn workspaces focus --all --production

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
