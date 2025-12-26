FROM node:22-bookworm-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates curl

RUN yarn global add pm2

COPY .swcrc tsconfig.json package.json jest.config.js yarn.lock ./
# Timeout is needed for yarn install to work on arm64 emulation (qemu)
RUN yarn install 

COPY src/ ./src/
COPY test/ ./test/
COPY .env.template \
    README.md \
    LICENSE CODE_OF_CONDUCT.md \
    CONTRIBUTING.md \
    SECURITY.md \
    .dockerignore ./

ENV NODE_OPTIONS="--max_old_space_size=4096"
CMD [ "yarn", "test:cov"]

# docker build . -f .\docker\test.Dockerfile -t fdm-monster:test
# docker run fdm-monster:test
