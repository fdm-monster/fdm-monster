---
layout: default
title: Docker Compose
parent: Installations
nav_order: 2
last_modified_at: 2023-06-20T14:00:00+02:00
---

# Docker Compose for FDM Monster

This is a guide on how to use Docker Compose to run FDM Monster.

## Prerequisites

Familiarity with Docker and Docker Compose is assumed. While these tools are beneficial, they may be unfamiliar to some users. 
Please note that we cannot support custom scenarios or setups. Therefore, it is essential to check your device's memory limits, architecture, and CPU power.

## Running FDM Monster with Docker Compose

In the next steps we will guide you through the process of running FDM Monster with Docker Compose.

### Step 1) FDM Monster image and version tag
We provide the `davidzwa/fdm-monster` image. This image requires you to run a MongoDB service, MongoDB Atlas (cloud offering) or a MongoDB docker container (see compose file below).
Find it on [Docker Hub](https://hub.docker.com/r/davidzwa/fdm-monster/tags).

There are multiple tags available for the `davidzwa/fdm-monster` image.
- `latest` - The latest version of FDM Monster. This is the default tag.
- `x`, `x.y`, `x.y.z` - A specific version of FDM Monster. For example, `1`, `1.4` or `1.4.0`.
- `main` - The latest development version of FDM Monster. This version is the same as the `latest` tag and it is stable.
- `develop` - The latest development version of FDM Monster. This version is not recommended for production use.
- `x.y.z-rc?-1234` - A specific release candidate of FDM Monster with a specific build number. For example, `1.4.0-rc1-1234`. These are development versions and are not recommended for production use.
- `x.y.z-1234` - A specific version of FDM Monster with a specific build number. For example, `1.4.0-1234`. These are development versions and are not recommended for production use.

### Step 2) Create a docker-compose.yml file
To run a Docker Compose stack, create a file named `docker-compose.yml` and use the file contents presented below. Note that an option has been added for adding MongoDB authentication. 
If you choose not to use authentication, you can remove the `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` environment variables.
In that case you should leave out the `<username>:<password>@` part of the `MONGO` environment variable. 

{: .warning }
> It's important to protect your MongoDB database with authentication. If you choose not to use authentication, you should at least use a firewall to protect your database.
> Do not simply expose your database over the internet without any protection! You have been warned.

There is also a development (`NODE_ENV=development`) compose file here: [docker-compose.yml](../../docker-compose.yml)):

```yaml
version: '3.4'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    environment:
      # MongoDB with authentication (optional)
      - MONGO_INITDB_ROOT_USERNAME=YOUR_ROOT_NAME
      - MONGO_INITDB_ROOT_PASSWORD=YOUR_ROOT_PASSWORD
    ports:
      - "28017:27017"
    volumes:
      - ./mongodb-data:/data/db
      - ./mongoconfig:/data/configdb
    restart: unless-stopped

  fdm-monster:
    container_name: fdm-monster
    image: davidzwa/fdm-monster:latest
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      # MongoDB with authentication (optional) - see MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD above
      - MONGO=mongodb://YOUR_ROOT_NAME:YOUR_ROOT_PASSWORD@mongodb:27017/fdm-monster?authSource=admin
      # MongoDB without authentication
#      - MONGO=mongodb://mongodb:27017/fdm-monster?authSource=admin
    volumes:
      - ./fdm-monster/media:/app/media
```
_An example docker-compose.yml file with the mongodb and fdm-monster services in one stack._

### Step 3) Execute the docker-compose stack 
Execute this command to run the containers:

```powershell
docker-compose up -d
```

Please note that FDM Monster requires a MongoDB database to function properly. When using the `latest` or `alpine` images, 
make sure to configure your root-user's username and password for MongoDB. 
Additionally, FDM Monster needs to access the `admin` table, which is the default table name for the authentication source.

Now you can access FDM Monster at `http://localhost:4000`, `http://127.0.0.1:4000` or `http://<your-ip>:4000`.
