## Running 3DPF with docker-compose.yml

Docker is a great tool! Using `docker-compose` is better and `portainer` is most awesome! Please read the following before continuing:
1) NOTE we assume you are familiar with `docker` and `docker-compose`. These are great tools for isolating your software deployment (+), but it be quite new to some users (-).
    - We cannot support each custom scenario or setup!
    - Take good care of checking your device's memory limits, architecture and CPU power (`docker stats` and for example `mem_limit: 400m` for 400MB limit in docker-compose)
    - If your device's CPU hits high percentages a lot or memory usage is high, please check your 3DPF network timeout settings and inspect your 3DPF <-> network latency. 
2) NOTE we provide `davidzwa/3d-print-farm:latest`, `davidzwa/3d-print-farm:alpine-latest` and `davidzwa/3d-print-farm:monolithic-latest`
    - `latest` and `alpine-latest` require you to run MongoDB or a MongoDB container (see compose below)
    - `monolithic` does not require a separate MongoDB, but we at 3DPF personally like MongoDB to be separate (docker = isolation remember?).

### Docker images 'latest' or ':'alpine-latest' with separate MongoDb
**Pay good attention that you have to configure your root-user's username and password for MongoDB and that 3DPF needs it to work!**

Replace the values for `MONGO_ROOTUSER_HERE`, `MONGO_PASSWORD_HERE` below!
We don't advise using MongoDB without username/password, although you can do so by removing the environment variables for MongoDB and 3DPF. IF and ONLY IF you dont want a username/password, make sure that the URL makes sense in that **special** case: `MONGO= mongodb://mongo:27017/3dpf`.

Why the MongoDB `?authSource=admin` addition, you might ask? Just to make sure the right table is checked for the username you setup, if that's the case. This table is named `admin` by default. Glad you asked!

```
# Just pick a compose spec version >3
version: '3.4' 

# (Optional) named database volume (uncomment in case you dont want a local database volume folder, see below)
# volumes:
#   mongodb-data:

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: MONGO_ROOTUSER_HERE
      MONGO_INITDB_ROOT_PASSWORD: MONGO_PASSWORD_HERE
      MONGO_INITDB_DATABASE: 3dpf
    ports:
     # HOST:CONTAINER
    - 27017:27017
    volumes:
    # Local volume (change to mongodb-data for a named volume folder)
    - ./mongodb-data:/data/db
    restart: unless_stopped

  3d-print-farm:
    container_name: 3d-print-farm
    # choose davidzwa/3d-print-farm:latest or davidzwa/3d-print-farm:alpine-latest    
    image: davidzwa/3d-print-farm:latest
    restart: always
    mem_limit: 400m # Feel free to adjust! 400 MB is quite high and a safety limit.
    ports:
    - 4000:4000 # port of SYSTEM : port of CONTAINER
    environment:
    - MONGO=mongodb://MONGO_ROOTUSER_HERE:MONGO_PASSWORD_HERE@mongodb:27017/3dpf2?authSource=admin
    volumes:
    # Volumes as local relative folders (validate with 'docker-compose config')
    - ./3DPF/logs:/app/logs
    - ./3DPF/scripts:/app/scripts
    - ./3DPF/images:/app/images
```
### Docker image 'monolithic-latest'
The monolithic image does not require MongoDB externally, but it also has less control over MongoDB setup:
```
 3d-print-farm-monolithic:
    container_name: 3d-print-farm-monolithic
    image: davidzwa/3d-print-farm:monolithic-latest
    restart: always
    volumes:
    # Local volumes, can be made named
    - ./3DPF/logs:/app/logs   
    - ./3DPF/scripts:/app/scripts
    - ./3DPF/images:/app/images
    - ./mongodb-data:/data/db 
    ports:
    # SYSTEM:CONTAINER
    - 4000:4000
```

### Docker or docker-compose for version 2.0 (not released yet!)
In version 2.0 we will stop using MongoDB and move to a much simpler database MySQL. This means that you won't have to do anything and you can remove your MongoDB database!
Of course we will provide the tools to hop on to the 2.0 train, when the time comes. The only change is that the `monolithic-latest` will become the same as the `latest` image. Less setup, nice ey?
