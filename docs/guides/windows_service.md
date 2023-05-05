---
layout: default
title: Windows Service
parent: Installations
nav_order: 3
last_modified_at: 2023-05-05T10:01:00+02:00
---

# Windows Service
**Note**: the Windows service installation involves quite some steps, and it's quite new and new.

The scripts are available in [installations/fdm-monster-node-windows](../../installations/fdm-monster-node-windows)

![Image](../images/server-running.png)
*This is the FDM Monster webapp after installation (visit [http://localhost:4000](http://localhost:4000))*

## Preparation of the Windows service installation

The following steps will install the following:
- nodejs 16+
- git
- yarn (npm package)
- fdm-monster (github cloned source code)
- node-windows (npm package)

At step 4 you **can** choose to skip the remaining steps by running the `installations/fdm-monster-node-windows` installation scripts.
Step 5 to 8 are just there to let you know how the scripts work. Step 9 concludes the installation.

### Caveats

- Internet is required
- Windows only (please use docker on Linux)
- Pay attention to versions (f.e. Node 16 or 18, and not Node 15/17)
- Understand powershell execution policy: `Set-ExecutionPolicy -ExecutionPolicy Unrestricted` will allow anything to run.

### Step 1) Installing NodeJS 16+
Install NodeJS LTS (long-term support) from [https://nodejs.org/en/download](https://nodejs.org/en/download). 
At the moment of writing this is Node 18. The FDM Monster server requires you to use at least NodeJS LTS 16.

To check Node is installed properly, you can execute this in command prompt, or in powershell:
```
node -v
```

The output should be:
> PS C:\Users\SomeUser> node -v
<br/> v18.14.2

### Step 2) Installing MongoDB 5+
Install MongoDB Community Edition. This URL should allow you to download the MongoDB installation setup: 
[MongoDB Download](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5-signed.msi). 
If not visit [MongoDB MSI download page](https://www.mongodb.com/try/download/community).

### Step 2b) (Optional)
Please skip this if you're not an experienced user! 

MongoDB provides extra tools for you to get insight in your database, the [MongoDB Developer Tools](https://www.mongodb.com/developer-tools).

The following tools might be of interest:
- [Compass](https://www.mongodb.com/products/compass) connects to your database and query/adjust collections or documents.
- [MongoDB VS Code Extension](https://www.mongodb.com/products/vs-code), inside VS Code, it connects to your database and see/adjust the data in place.
- [MongoDB shell](https://www.mongodb.com/products/shell) provides shell access to the database. For advanced users only!

### Step 3) Installing Git
Prepare the installation, by ensuring you have git installed. This will help you in updating FDM Monster in the future.
Find it here: [Git Download](https://git-scm.com/downloads)

### Step 4)
The following steps 5-8 will install FDM Monster as a service manually. If you'd like to skip this, please use the `installations/fdm-monster-node-windows` where I've provided scripts that will install the necessary stuff for you.

The first time I would run the powershell script `download-fdm-monster-server.ps1` inside a powershell instance:

```powershell
cd installations/fdm-monster-node-windows
```
Followed by:
```powershell
./download-fdm-monster-server.ps1
```

If no errors occurred, please skip to Step 9! You're almost done.

### Step 5)
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

### Step 6)
The folder `fdm-monster` is now present, and you've changed to the directory `fdm-monster/server/` with Powershell or CMD.

We will install `yarn`, a package manager for NodeJS.
```powershell
npm i --global yarn
```

Please check yarn is installed. This is how that works with the `yarn -v` command:
```powershell
yarn -v
```
With the output being:
> PS C:\Users\SomeUser> yarn -v <br/>
> 1.22.19

Execute this yarn installation command inside the `fdm-monster/server` folder to install the required dependencies to `node_modules`. This might take some time:
```powershell
yarn install --production --pure-lockfile
```

### Step 7) Installing the service
Prepare a file called `install-fdm-monster-service.js`. You can add the following code:
```javascript
const { Service } = require("node-windows");
const { join } = require("path");

// Create a new service object
const rootPath = join(__dirname, "fdm-monster/server/");
const svc = new Service({
  name: "FDM Monster",
  description: "The 3D Printer Farm server for managing your 100+ OctoPrints printers.",
  script: join(rootPath, "index.mjs"),
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
  workingDirectory: rootPath,
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on("install", function () {
  svc.start();
  console.log("Install complete. Service exists:", svc.exists);
  console.log("Service running: ", svc.isRunning);
});

if (svc.isRunning) {
  svc.stop();
  svc.uninstall();
}

svc.install();
```

After that, run this installation script:

```powershell
node ./install-fdm-monster-service.js
```

### Step 7b) Updating the service

You should create a script to simplify this! I've created the following powershell script `download-update.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$org= "fdm-monster"
$repo= "fdm-monster"
$repoUrl = "https://github.com/${org}/${repo}"
$serverPath = "./fdm-monster/server"

# Get tags selecting the newest only
$latestTag = git ls-remote --tags --sort=-v:refname $repoUrl | Select-Object -First 1
# Extract the tag name from the tag reference
$latestTagName = $latestTag.Substring($latestTag.LastIndexOf("/") + 1)
# Output the latest tag name
Write-Host "Latest tag in $repoUrl is $latestTagName"

# Uninstall the service
npm run uninstall

# Visit the FDM Monster server folder
Push-Location $serverPath

# Perform package updates
npm i -g yarn
yarn -v
yarn install --production --pure-lockfile

# Switch to the latest release tag of FDM Monster
git fetch --prune
git checkout $latestTagName

# Go back and enable the Windows service
Pop-Location
node ./install-fdm-monster-service.js
```

If you prefer to install specific versions, it's advised to replace this line: 
> $latestTag = git ls-remote --tags --sort=-v:refname $repoUrl | Select-Object -First 1
 
with for example:

> $latestTag = 1.3.1-rc2

Execute the update with:
```powershell
powershell ./download-update.ps1
```

This will do the following:
- stop and uninstall the previous service
- update fdm-monster
- create a new service instance

During these steps the server will not be available for a short while. Please check [Step 9](#Step-9) for verifying whether your service is running.

### Step 8) Uninstalling the service. 
Create a file called `uninstall-fdm-monster-service.js`. Write this code to it:

```javascript
const { Service } = require("node-windows");
const { join } = require("path");

// Create a new service object
const rootPath = join(__dirname, "fdm-monster/server/");
const svc = new Service({
  name: "FDM Monster",
  description: "The 3D Printer Farm server for managing your 100+ OctoPrints printers.",
  script: join(rootPath, "index.mjs"),
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
  workingDirectory: rootPath,
});

svc.on("stop", function () {
  console.log("Service stopped. Service exists:", svc.exists);
});
svc.on("uninstall", function () {
  console.log("Uninstall complete. Service exists:", svc.exists);
});

svc.stop();
svc.uninstall();
```

Run the file as follows:
```powershell
node ./uninstall-fdm-monster-service.js
```

### Step 9)

You've installed `fdmmonster.exe` using node-windows. Great! You should be able to check the service `fdmmonster.exe` with description `FDM Monster` in Task Manager.
The service should have Status: Running. If this is not the case, something went wrong. Reach out to us on for more help [Discord](https://discord.gg/mwA8uP8CMc)!

![Image](../images/task-manager.png)

If things are working, you can open fdm monster with this URL: [http://localhost:4000](http://localhost:4000) or [http://127.0.0.1:4000](http://127.0.0.1:4000).

Documentation on how to create and place printers on the grid will follow asap!

Please continue to [Environment configuration](env_config.md) to change environment configuration of the FDM Monster server.
