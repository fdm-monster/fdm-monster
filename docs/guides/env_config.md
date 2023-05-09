# FDM Monster Server Environment Variables

FDM Monster Server can be configured with environment variables. There are different ways to do this for each setup:

- specify a `.env` file. This works for these setups:
  - NodeJS with `pm2`
  - NodeJS with `nodemon`
  - Windows service setup
  - Linux service setup
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
- `SERVER_SITE_TITLE` **Custom site title for FDM Monster**
> `SERVER_SITE_TITLE=FDM Monster`
- `SAFEMODE_ENABLED` **Safely start FDM Monster: without any task being run to avoid crashes.**
> `SAFEMODE_ENABLED=true`

## The `.env` file
A very simple text file with a variable per line. The following `.env` is often already enough to make sure FDM Monster works as you like:

```
MONGO=mongodb://127.0.0.1:27017/fdm-monster
SERVER_PORT=4000
```

## Applying it to your setup
So, you understand the variables to configure FDM Monster now. How do I set this up for my environment? Read below for your specific scenario.

### NodeJS with pm2 (or nodemon)
Create a `.env` file in the `fdm-monster/server` folder with the **required** and/or _optional_ variables! From version `1.2.4` there is a file `.env.template`. Copy this and rename it to `.env` to get started quicker. The server will automatically create the `.env` file for you, and the server logs will show what is going wrong if something is missing.

Feel adventurous? Customize the file to your liking, but again ALWAYS make sure the **required** variables are correctly set.

### Docker-compose
With docker-compose you have a great tool to pass environment variables use the `environment` section. Be aware of the following notes:
- the `.env` file for docker-compose is not applied to FDM Monster unless you use the variables in your `environment` section (more on that below)

Entirely up to you!

Here is how the environment section in docker would look.

```
services:
  fdm-monster:
    # ... other sections here
    
    # environment using colon syntax
    environment:
      - MONGO: mongodb://127.0.0.1:27017/fdm-monster
      - SERVER_PORT: 4000
    
    # ... alternative (watch for whitespace!!) 
    environment:
      MONGO=mongodb://127.0.0.1:27017/fdm-monster
      SERVER_PORT=4000
```
### Docker 
Please add each environment variable in a file named `.env` in the folder where you run your docker command. For example, if you have the following `.env` file:
```
MONGO=mongodb://127.0.0.1:27017/fdm-monster
SERVER_PORT=4000
```

Then you can run your Docker container using the following command:
```
docker run -p 4000:4000 --env-file ./.env my-fdm-monster-image
```

Alternatively, you can specify each variable separately using the `-e VARIABLE=value` command repeatedly:
```
docker run -p 4000:4000 -e MONGO=mongodb://127.0.0.1:27017/fdm-monster -e SERVER_PORT=4000 my-fdm-monster-image
```

However, this can become tedious if you have many variables to set.

### Using docker-compose with an environment file
With Docker Compose, you can specify environment variables using an environment file. This can be done by specifying the `--env-file` option followed by the path to the environment file, like this:
```
docker-compose --env-file ./.env up
```

### Using docker-compose with the `environment` section
You can also specify environment variables using the `environment` section in your `docker-compose.yml` file. Here's an example:
```
services:
  fdm-monster:
    image: my-fdm-monster-image
    ports:
      - "4000:4000"
    environment:
      MONGO: mongodb://127.0.0.1:27017/fdm-monster
      SERVER_PORT: 4000
```

This will set the `MONGO` and `SERVER_PORT` environment variables for the `fdm-monster` service. Note that the `.env` file is not applied to FDM Monster unless you use the variables in your `environment` section.

