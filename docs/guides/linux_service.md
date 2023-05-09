---
layout: default
title: Linux Service
parent: Installations
nav_order: 4
last_modified_at: 2023-09-05T10:03:00+02:00
---

# Linux Service

> :warning: **Note: This page is currently a work in progress!**

The scripts for this installation can be found in [installations/fdm-monster-node-linux](../../installations/fdm-monster-node-linux).

![Image](../images/server-running.png)
*Screenshot of the FDM Monster webapp after installation (accessible at [http://127.0.0.1:4000](http://127.0.0.1:4000))*


## Preparing for the Linux Service installation

Before proceeding with the installation, please ensure that the following dependencies are installed and properly functioning:

- Node.js version 16 or later
- Git
- Yarn (npm package)
- FDM Monster (GitHub cloned source code)
- Node-windows (npm package)

## Installing the service

To install the service, follow these steps:

1. Clone the repository.
2. Change directory to [installations/fdm-monster-node-linux](../../installations/fdm-monster-node-linux).
3. Install MongoDB version 4.4 or later.
4. Install `yarn` dependencies in `fdm-monster/server/`.
5. Install `yarn`/`npm` dependencies in `fdm-monster-node-linux/`.
6. Make sure the service is installed by running the following command inside `fdm-monster-node-linux`:

```shell
npm i
```

This will indirectly call `node ./install-fdm-monster.js`.

## Configuring the server environment

The server has configuration options that allow you to change how it operates. However, be aware that incorrect configuration might cause the server to fail to start up.

Each configuration change requires you to run the update script:

```shell
npm i
```

Please refer to the [Environment configuration](env_config.md) section for instructions on adjusting the `.env` file.

## Updating the server

To update the server, use the provided script `update-fdm-monster.sh`. Please note that you will need to run this script with elevation:

```bash
sudo bash ./update-fdm-monster.sh
```