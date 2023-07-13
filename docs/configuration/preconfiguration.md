---
layout: default
title: Preconfiguring the FDM Monster Server
parent: Configuration
nav_order: 1
last_modified_at: 2023-05-10T14:00:00+02:00
---

# Preconfiguring the FDM Monster Server

> :warning: **After each environment change the FDM Monster server must be restarted for the change to take effect!**

FDM Monster Server can be configured with environment variables. There are different ways to do this for each setup:

- specify a `.env` file. This works for these setups:
  - Windows service setup with `node-windows`
  - Linux service setup with `node-linux`
  - NodeJS with `pm2`
  - NodeJS with `nodemon`
- docker - specify each variable separately, this can become tedious:
  - docker: using the `-e VARIABLE=value` command repeatedly
- docker - all at once
  - docker: using the `--env-file ./.env` command [(Read docker options)](https://docs.docker.com/engine/reference/commandline/run/#options)
  - docker-compose: using the `environment` section [(Read docker-compose environment)](https://docs.docker.com/compose/environment-variables/)

## Required and optional variables
The following variables are read and used by FDM Monster at startup. Always restart your server after a change.

- `MONGO` (Required) **the connection to mongodb**. For example:
> `MONGO=mongodb://127.0.0.1:27017/fdm-monster`
- `SERVER_PORT` (Optional, default=4000) **the port of the local FDM Monster website**. For example:
> `SERVER_PORT=4000`
- `SAFEMODE_ENABLED` **Safely start FDM Monster: without any task being run to avoid crashes.**
> `SAFEMODE_ENABLED=true`

## The `.env` file
A very simple text file with a variable per line. The following `.env` is often already enough to make sure FDM Monster works as you like:

```dotenv
MONGO=mongodb://127.0.0.1:27017/fdm-monster
SERVER_PORT=4000
```

## Applying it to your setup
So, you understand the variables to configure FDM Monster now. How do I set this up for my environment? Read below for your specific scenario.

### NodeJS with node-linux, node-windows or pm2
Create a `.env` file in the `fdm-monster/server` folder with the **required** and/or _optional_ variables by copying the `.env.template` file. 
Copy this and rename it to `.env` to get started quicker. 
The server will automatically create the `.env` file for you, and the server logs will show what is going wrong if something is missing.

Feel adventurous? Customize the file to your liking, but again ALWAYS make sure the **required** variables are correctly set.

### Docker-compose
With docker-compose you have a great tool to pass environment variables use the `environment` section.
Here is how the environment section in docker would look.

```yaml
services:
  fdm-monster:
    # ... other sections here
    environment:
      - MONGO: mongodb://127.0.0.1:27017/fdm-monster
      - SERVER_PORT: 4000
```

Please continue by reading the [Docker Compose section](../installations/docker_compose.md) for more information on how to setup FDM Monster and MongoDB with docker-compose.
