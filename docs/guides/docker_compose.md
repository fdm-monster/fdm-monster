---
layout: default
title: Docker Compose
parent: Installations
nav_order: 2
last_modified_at: 2023-05-10T14:00:00+02:00
---

# Docker Compose for FDM Monster

This is a guide on how to use Docker Compose to run FDM Monster.

## Prerequisites

Familiarity with Docker and Docker Compose is assumed. While these tools are beneficial, they may be unfamiliar to some users. 
Please note that we cannot support custom scenarios or setups. Therefore, it is essential to check your device's memory limits, architecture, and CPU power.

## Running FDM Monster with Docker Compose

In the next steps we will guide you through the process of running FDM Monster with Docker Compose.

### Step 1) Selecting a FDM Monster image
We provide `davidzwa/fdm-monster:latest`, `davidzwa/fdm-monster:alpine`, and `davidzwa/fdm-monster:monolithic`.
   - `latest` and `alpine` require you to run MongoDB or a MongoDB container (see compose below)
   - `monolithic` does not require a separate MongoDB, but we at FDM Monster personally like MongoDB to be separate (docker = isolation remember?).

### Step 2) Create a docker-compose.yml file
To run a Docker Compose stack, create a file named `docker-compose.yml` and use the following contents (or look at [docker-compose.yml](../../docker-compose.yml)):

```yaml
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
_An example docker-compose.yml file with the mongodb and fdm-monster services in one stack._

### Step 3) Execute the docker-compose stack 
Execute this command to run the containers:

```powershell
docker-compose up -d
```

Please note that FDM Monster requires a MongoDB database to function properly. When using the `latest` or `alpine` images, 
make sure to configure your root-user's username and password for MongoDB. 
Additionally, FDM Monster needs to access the `admin` table, which is the default table name for the authentication source.
