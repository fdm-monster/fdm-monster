---
layout: default
title: Windows Service
parent: Installations
nav_order: 3
last_modified_at: 2023-05-09T10:04:00+02:00
---

# Windows Service

> :warning: **The installation on this page will be obsolote in FDM Monster 1.6.0! The replacement needs to be determined: pm2 with chocolatey or winget is most likely.**

If you're not an experienced user, you might find some of the steps below challenging. However, if you follow them carefully, you'll be able to install FDM Monster as a Windows service on your machine. 

The installation scripts are available in [installations/fdm-monster-node-windows](../../installations/fdm-monster-node-windows).

![Image](../images/server-running.png)
*This is the FDM Monster web app after installation (visit [http://localhost:4000](http://localhost:4000))*

## Preparation for the Windows service installation

The following steps will install:

- nodejs 18
- git
- yarn (npm package)
- fdm-monster (github cloned source code)
- node-windows (npm package)

### Caveats

- Internet access is required
- Windows only (if you use Linux, please use Docker)
- Pay attention to versions (e.g., Node 18)
- Understand PowerShell execution policy: `Set-ExecutionPolicy -ExecutionPolicy Unrestricted` will allow anything to run.

---
### Step 1) Installing NodeJS 18+

Install NodeJS LTS (long-term support) from [https://nodejs.org/en/download](https://nodejs.org/en/download). At the time of writing, this is Node 18. The FDM Monster server requires NodeJS 18 LTS or higher.

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

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/installations/fdm-monster-node-windows/download-fdm-monster-server.ps1 -OutFile .\download-fdm-monster-server.ps1
```
Please download this script in the preferred location where you want to install FDM Monster. For example, `C:\Users\User1\fdm-monster-service\`.

Followed by:
```powershell
./download-fdm-monster-server.ps1
```

During these steps the server will not be available for a short while. Please check [Step 6](#Step-6-Checking-the-service) for verifying whether your service is running.
If no errors occurred, FDM Monster should be running!

---

### Step 6) Checking the service

You've installed `fdmmonster.exe` using node-windows. Great! You should be able to check the service `fdmmonster.exe` with description `FDM Monster` in Task Manager.
The service should have Status: Running. If this is not the case, something went wrong. Reach out to us on for more help [Discord](https://discord.gg/mwA8uP8CMc)!

![Image](../images/task-manager.png)

If things are working, you can open fdm monster with this URL: [http://localhost:4000](http://localhost:4000) or [http://127.0.0.1:4000](http://127.0.0.1:4000).

---

## Updating the service
Updating the service is possible through a powershell, similar to the installation. Please open a Powershell window **without Administrator rights**. 

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/installations/fdm-monster-node-windows/update-fdm-monster.ps1 -OutFile .\update-fdm-monster.ps1
```
Please download this script in the preferred location where you have downloaded the installation script for installing FDM Monster previously. 
For example, `C:\Users\User1\fdm-monster-service\`, but not `C:\Users\User1\fdm-monster-service\fdm-monster\`! 

Followed by:
```powershell
./update-fdm-monster.ps1
```

The script should succeed with your FDM Monster server running again. Please have patience, as the server will not be available for a short while.


## Uninstalling the service
Uninstalling the service is possible through a Powershell script.

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/fdm-monster/fdm-monster/develop/installations/fdm-monster-node-windows/uninstall-fdm-monster.ps1 -OutFile .\uninstall-fdm-monster.ps1
```

Run the script as follows:
```powershell
./uninstall-fdm-monster.ps1
```


Please continue to [Environment configuration](../configuration/preconfiguration.md) to change environment configuration of the FDM Monster server.
