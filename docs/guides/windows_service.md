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

At step 4, you **can** choose to skip the remaining steps by running the `installations/fdm-monster-node-windows` installation scripts. Step 5 to 8 are there to explain how the scripts work. Step 9 concludes the installation.

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

Install MongoDB Community Edition from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community). You can use [this URL](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5-signed.msi) to download the MongoDB installation setup if the previous link doesn't work.

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

### Step 4)
During first installation, it's required to run the powershell script download-fdm-monster-server.ps1 inside a powershell instance:


```powershell
cd installations/fdm-monster-node-windows
```
Followed by:
```powershell
./download-fdm-monster-server.ps1
```
If no errors occurred, please continue with Step 5!

---
### Step 5) Cloning the FDM Monster server code
From now on we will be working inside the Powershell (preferred), or Command Prompt (CMD). You should **not** use Administrator mode. 
Execute the following git clone command in a folder. This will create the `fdm-monster` sub-folder for you with all the code inside.

```powershell
git clone https://github.com/fdm-monster/fdm-monster.git --branch 1.3.2
```

Note that I added `--branch 1.3.2`? This is the latest release of FDM Monster. You can find them all here:
[FDM Monster Release](https://github.com/fdm-monster/fdm-monster/releases)

Please head inside the `fdm-monster/server` sub-folder.

```powershell
cd fdm-monster/server
```

Once another version is available, you can run the following commands in sequence to prepare updating your service. 
Note that we are now **inside** the `fdm-monster/server/` folder.
Note that I filled in the unstable release `1.3.2` for the `git checkout` command, please replace this with the relevant release of your choice:

```powershell
git fetch --prune
git checkout 1.3.2
```
---
### Step 6) Install the necessary dependencies
The folder `fdm-monster` is now present, and you've changed to the directory `fdm-monster/server/` with Powershell or CMD.

We will install `yarn`, a package manager for NodeJS.
```powershell
npm i --global yarn
```
---
### Step 7) Build the FDM Monster server
```powershell
yarn install
yarn run build
```
---
### Step 8) Install the service
We will now install the FDM Monster server as a service with the help of `node-windows`.

Run this command in Powershell (not CMD):
```powershell
npm i --global node-windows
```

Inside the `fdm-monster/server` folder, run this command:
```powershell
npm run service-install
```
---
### Step 9) Start the service
From this point on, you can start, stop and remove the service. Starting the service is done as follows:
```powershell
npm run service-start
```

That's it! The FDM Monster service should now be up and running.

---
### Additional notes
If you want to remove the service, you can execute the following command inside the `fdm-monster/server` folder:
```powershell
npm run service-remove
```

It's highly recommended to also update the service with the following steps:
```powershell
git fetch --prune
git checkout 1.3.2
yarn install
yarn run build
npm run service-install
npm run service-restart
```

This will fetch the latest version, install dependencies, rebuild the server, reinstall the service and restart the service.

---

I hope this information helps! Let me know if you have any further questions.
