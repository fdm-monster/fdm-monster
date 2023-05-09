---
layout: default
title: Windows Service
parent: Installations
nav_order: 3
last_modified_at: 2023-09-05T10:04:00+02:00
---

# Windows Service

**Note**: the Windows service installation involves quite some steps and is relatively new.

If you're not an experienced user, you might find some of the steps below challenging. However, if you follow them carefully, you'll be able to install FDM Monster as a Windows service on your machine. 

The installation scripts are available in [installations/fdm-monster-node-windows](../../installations/fdm-monster-node-windows).

![Image](../images/server-running.png)
*This is the FDM Monster web app after installation (visit [http://localhost:4000](http://localhost:4000))*

## Preparation for the Windows service installation

The following steps will install:

- nodejs 16+
- git
- yarn (npm package)
- fdm-monster (github cloned source code)
- node-windows (npm package)

### Caveats

- Internet access is required
- Windows only (if you use Linux, please use Docker)
- Pay attention to versions (e.g., Node 16 or 18, not Node 15/17)
- Understand PowerShell execution policy: `Set-ExecutionPolicy -ExecutionPolicy Unrestricted` will allow anything to run.
---
### Step 1) Installing NodeJS 16+

Install NodeJS LTS (long-term support) from [https://nodejs.org/en/download](https://nodejs.org/en/download). At the time of writing, this is Node 18. The FDM Monster server requires NodeJS LTS 16 or higher.

To check whether Node is installed properly, execute this in Command Prompt or PowerShell:

```
node -v
```

The output should be:
```
PS C:\Users\SomeUser> node -v
v18.14.2
```
---
### Step 2) Installing MongoDB 5+

Install MongoDB Community Edition from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community). 
You can use [this URL](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5-signed.msi) to download the MongoDB installation setup 
if the previous link doesn't work.

---
### Step 2b) (Optional)

If you're an experienced user, you might want to install the [MongoDB Developer Tools](https://www.mongodb.com/developer-tools), which provide extra tools to get insight into your database. The following tools might be of interest:

- [Compass](https://www.mongodb.com/products/compass): Connects to your database and query/adjust collections or documents.
- [MongoDB VS Code Extension](https://www.mongodb.com/products/vs-code): Connects to your database inside VS Code and allows you to see/adjust data in place.
- [MongoDB Shell](https://www.mongodb.com/products/shell): Provides shell access to the database. For advanced users only!
---
### Step 3) Installing Git

Prepare the installation by ensuring you have Git installed. This will help you in updating FDM Monster in the future. Find it here: [Git Download](https://git-scm.com/downloads)

---

### Step 4) Downloading FDM Monster
From now on we will be working inside the Powershell (preferred), or Command Prompt (CMD). You should **not** use Administrator mode.

During first installation, it's required to run the powershell script download-fdm-monster-server.ps1 inside a powershell instance:

```powershell
cd installations/fdm-monster-node-windows
```
Followed by:
```powershell
./download-fdm-monster-server.ps1
```

If no errors occurred, FDM Monster should be running! You're almost done.

### Step 5) Updating the service
The powershell script `download-update.ps1` has been created to update the service.

Execute the update with:
```powershell
powershell ./download-update.ps1
```

This script will do the following things:
- stop and uninstall the previous service
- update fdm-monster
- create a new service instance

During these steps the server will not be available for a short while. Please check [Step 7](#Step-7-Checking-the-service) for verifying whether your service is running.

### Step 6) Uninstalling the service
Uninstalling the service is possible through a node script.

Run the script as follows:
```powershell
node ./uninstall-fdm-monster-service.js
```

### Step 7) Checking the service

You've installed `fdmmonster.exe` using node-windows. Great! You should be able to check the service `fdmmonster.exe` with description `FDM Monster` in Task Manager.
The service should have Status: Running. If this is not the case, something went wrong. Reach out to us on for more help [Discord](https://discord.gg/mwA8uP8CMc)!

![Image](../images/task-manager.png)

If things are working, you can open fdm monster with this URL: [http://localhost:4000](http://localhost:4000) or [http://127.0.0.1:4000](http://127.0.0.1:4000).

Documentation on how to create and place printers on the grid will follow asap!

Please continue to [Environment configuration](env_config.md) to change environment configuration of the FDM Monster server.
