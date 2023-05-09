---
layout: default
title: Docker Compose
parent: Installations
nav_order: 2
last_modified_at: 2023-09-05T10:012:00+02:00
---

## Docker Compose for FDM Monster

This is a guide on how to use Docker Compose to run FDM Monster. Please note that this page is a work in progress.

### Prerequisites

Familiarity with Docker and Docker Compose is assumed. While these tools are beneficial, they may be unfamiliar to some users. Please note that we cannot support custom scenarios or setups. Therefore, it is essential to check your device's memory limits, architecture, and CPU power.

### Running FDM Monster with Docker Compose

1. We provide `davidzwa/fdm-monster:latest`, `davidzwa/fdm-monster:alpine`, and `davidzwa/fdm-monster:monolithic`.
   - `latest` and `alpine` require you to run MongoDB or a MongoDB container (see compose below)
   - `monolithic` does not require a separate MongoDB, but we at FDM Monster personally like MongoDB to be separate (docker = isolation remember?).

2. To use Docker Compose, create a file named `docker-compose.yml` and use the following contents (or look at [docker-compose.yml](../../docker-compose.yml)):

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
    ports:
    - "4000:4000"
    environment:
    - MONGO=mongodb://mongodb:27017/fdm-monster?authSource=admin
    volumes:
    # Volumes as local relative folders (validate with 'docker-compose config')
    - ./fdm-monster/media:/app/media
```

3. Execute this command to run the containers:

```powershell
docker-compose up -d
```

Please note that FDM Monster requires a MongoDB database to function properly. When using the `latest` or `alpine` images, make sure to configure your root-user's username and password for MongoDB. Additionally, FDM Monster needs to access the `admin` table, which is the default table name for the authentication source.
