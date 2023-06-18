---
layout: default
title: Setup Client
parent: Development Setup
nav_order: 2
last_modified_at: 2023-06-04T13:00:00+02:00
---

# FDM Monster Client Installation Guide

This guide will walk you through the process of setting up the FDM Monster Vue client.
Please note that this chapter focuses on installing the client component only.
If you haven't set up the FDM Monster server yet, please refer to the [Server Installation Guide](./setup_server.md).

## Prerequisites

Before you begin, ensure that you have the following tools installed on your system:

- Node.js 18 LTS
- Yarn 1.22.0 or higher
- VS Code or WebStorm (your choice of IDE)

## Clone the Repository

To get started, clone the FDM Monster Vue client repository from GitHub:

```bash
git clone https://github.com/fdm-monster/fdm-monster-client.git
```

## Setting Up the Development Environment

1) Navigate to the cloned repository:
    ```bash
    cd fdm-monster-client
    ```
   
2) If yarn is not yet installed:
   ```bash
   npm install -g yarn
   ```
      
3) Install the dependencies using Yarn:
   ```bash
   yarn install
   ```
   
4) Create a run configuration for the Vue development server in your IDE of choice (either VS Code or WebStorm):
    - VS Code: Create a run configuration that executes `yarn run serve` as the command. (Refer to the VS Code Run
      Configuration section below for detailed steps.)
    - WebStorm: Create a run configuration that executes `yarn run serve` as the command. (Refer to the WebStorm
      Run Configuration section below for detailed steps.)
   
5) Launch the Vue development server. Please note that the server will automatically reload if you make any changes to
   the source code. Please ensure that the FDM Monster server is running as well.

6) Access the running server at http://localhost:8080 in your preferred web browser.

## VS Code Run Configuration

1) If the file ".vscode/launch.json" exists and looks alright, you can skip steps 2 to 4. Open VS Code and navigate to
   the "Run and Debug" panel.

2) Click on the link `create a launch.json file` to open the `launch.json` file. You should select Node.js as the type.
   If this does not work, you can manually create the file in the `.vscode` folder in the project root directory.

3) Paste the following JSON script into the launch.json file:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "FDM Monster Vue Client (serve)",
         "type": "node",
         "request": "launch",
         "runtimeExecutable": "yarn",
         "runtimeArgs": [
           "run",
           "serve"
         ],
         "cwd": "${workspaceFolder}"
       }
     ]
   }
   ```

4) Save the configuration and close the launch.json file.

5) In the "Run and Debug" panel, select "FDM Monster Vue Client (serve)" from the dropdown.

- Press Ctrl + F5 to launch the Vue development server without debugging. Alternatively, you can press F5 to launch the
  Vue development server with debugging (this could be a lot slower).
- For more information on how to develop Vue with VS Code (f.e. using Vetur), refer to
  the [VS Code VueJS Tutorial](https://code.visualstudio.com/docs/nodejs/vuejs-tutorial.

## WebStorm NPM Configuration

1) Open WebStorm and go to the "Run" menu.

2) Click on "Edit Configurations..." to open the "Run/Debug Configurations" dialog.

3) Click on the "+" icon to add a new configuration and select "NPM" from the dropdown.

4) Provide a name for the configuration (e.g., `FDM Monster Vue Client (serve)`).

5) Set the package.json to the one in the cloned repository root folder: fdm-monster-client/package.json.

6) Set the Command to `run`.

7) Set the Scripts to `serve`.

8) Set the "Node interpreter" to the appropriate Node.js executable (v18.14.2 at the moment of writing).

9) Click "OK" to save the configuration.

10) In the top-right corner of WebStorm, select the created configuration from the dropdown.

11) Click on the green play button or press Shift + F10 to launch the Vue development server without debugging.

## Next Steps

Congratulations! You have successfully set up the FDM Monster client. You can now start developing the client.
Please follow the contribution guidelines outlined in
the [CONTRIBUTING.MD file](https://github.com/fdm-monster/fdm-monster/blob/develop/CONTRIBUTING.md) for more steps.
