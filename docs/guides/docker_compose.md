---
layout: default
title: Docker Compose
parent: Installations
nav_order: 2
last_modified_at: 2023-05-05T10:01:00+02:00
---

> :warning: **This page is work in progress!**

# Running FDM Monster with docker-compose

Docker is a great tool! Using `docker-compose` is better and `portainer` is most awesome! Please read the following before continuing:
1) NOTE we assume you are familiar with `docker` and `docker-compose`. These are great tools for isolating your software deployment (+), but it be quite new to some users (-).
    - We cannot support each custom scenario or setup!
    - Take good care of checking your device's memory limits, architecture and CPU power (`docker stats` and for example `mem_limit: 400m` for 400MB limit in docker-compose)
    - If your device's CPU hits high percentages a lot or memory usage is high, please check your FDM Monster network timeout settings and inspect your FDM Monster <-> network latency.
    - 
2) NOTE we provide `davidzwa/fdm-monster:latest`, `davidzwa/fdm-monster:alpine` and `davidzwa/fdm-monster:monolithic`
    - `latest` and `alpine` require you to run MongoDB or a MongoDB container (see compose below)
    - `monolithic` does not require a separate MongoDB, but we at FDM Monster personally like MongoDB to be separate (docker = isolation remember?).

## Docker images 'latest' or ':'alpine' with separate MongoDb
**Pay good attention that you have to configure your root-user's username and password for MongoDB and that FDM Monster needs it to work!**
Why the MongoDB `?authSource=admin` addition, you might ask? Just to make sure the right table is checked if you set up a mongo username with password. This table is named `admin` by default.

```
version: '3.4' 

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    environment:
      MONGO_INITDB_DATABASE: fdm-monster
    ports:
     # HOST:CONTAINER
    - "28017:27017"
    volumes:
    - ./mongodb-data:/data/db
    restart: unless-stopped

  fdm-monster:
    container_name: fdm-monster    
    image: davidzwa/fdm-monster:latest
    restart: unless-stopped
    mem_limit: 400m # Feel free to adjust! 400 MB is quite high and a safety limit.
    ports:
    - "4000:4000"
    environment:
    - MONGO=mongodb://mongodb:27017/fdm-monster?authSource=admin
    volumes:
    # Volumes as local relative folders (validate with 'docker-compose config')
    - ./fdm-monster/media:/app/media
```

## Executing the compose stack
To run this stack, create a file `docker-compose.yml` and use the contents given above (or look at [docker-compose.yml](../../docker-compose.yml)).

Execute this command to run the containers:
```powershell
docker-compose up -d
```
