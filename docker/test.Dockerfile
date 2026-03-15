FROM node:24-bookworm-slim AS production
WORKDIR /app

COPY .yarn/releases ./.yarn/releases
COPY vite.config.ts tsconfig.json package.json yarn.lock ./
RUN yarn workspaces focus . --production

COPY src/ ./src/
COPY test/ ./test/
COPY .env.template \
    README.md \
    LICENSE \
    CODE_OF_CONDUCT.md \
    CONTRIBUTING.md \
    SECURITY.md \
    .dockerignore ./

ENV NODE_OPTIONS="--max_old_space_size=4096"
CMD [ "yarn", "test:cov"]

# docker build . -f .\docker\test.Dockerfile -t fdm-monster:test
# docker run fdm-monster:test
