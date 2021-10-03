# https://pkgs.alpinelinux.org/packages?name=nodejs&branch=v3.13
# Results in NodeJS 14.17.0
FROM alpine:3.14 as base

RUN apk add --no-cache --virtual .base-deps \
    nodejs \
    npm \
    tini

RUN npm install -g pm2

RUN adduser -D 3dpf --home /app && \
    mkdir -p /scripts && \
    chown -R 3dpf:3dpf /scripts/

FROM base as compiler

RUN apk add --no-cache --virtual .build-deps \
    alpine-sdk \
    make \
    gcc \
    g++ \
    python3

WORKDIR /tmp/app
COPY package.json .
RUN npm install --only=production

RUN apk del .build-deps

FROM base as runtime

COPY --chown=3dpf:3dpf --from=compiler /tmp/app/node_modules /app/node_modules
COPY --chown=3dpf:3dpf . /app
RUN rm -rf /tmp/app

USER 3dpf
WORKDIR /app

ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "./docker/entrypoint.sh" ]
