# https://pkgs.alpinelinux.org/packages?name=nodejs&branch=v3.13
# Results in NodeJS 16.13.0
FROM alpine:3.17 as base

RUN apk add --no-cache --virtual .base-deps \
    nodejs \
    npm \
    tini

RUN yarn global add pm2

RUN adduser -D fdm --home /app && \
    mkdir -p /scripts && \
    chown -R fdm:fdm /scripts/

FROM base as compiler

RUN apk add --no-cache --virtual .build-deps \
    alpine-sdk \
    make \
    gcc \
    g++ \
    python3

WORKDIR /tmp/app
COPY package.json .
RUN yarn install --production

RUN apk del .build-deps

FROM base as runtime

COPY --chown=fdm:fdm --from=compiler /tmp/app/node_modules /app/node_modules
COPY --chown=fdm:fdm . /app
RUN rm -rf /tmp/app

USER fdm
WORKDIR /app

ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "./docker/entrypoint.sh" ]
