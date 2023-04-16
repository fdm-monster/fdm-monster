# Getting started
To install FDM Monster please select a type of installation:
- Windows service
  - Read steps below 
- Docker-compose installation (Windows & Linux) 
  - Read the docker-compose instructions [Docker instructions](3_USING_DOCKER.md)

Note: the Windows service installation involves quite some steps, and it's quite new and untested. Please reach out on Discord for 
reporting problems, or on how you would like to see this setup improved! <br/>
Discord: https://discord.gg/mwA8uP8CMc

## Preparation of the Windows service installation

The following steps will install the following:
- nodejs 16+
- git
- yarn (npm package)
- fdm-monster (github cloned source code)
- node-windows (npm package)

At step 4 you **can** choose to skip the remaining steps by running the `installations/fdm-monster-node-service` installation scripts.
Step 5 to 8 are just there to let you know how the scripts work.

### Step 1) 
Install NodeJS LTS (long-term support) from https://nodejs.org/en/download. 
At the moment of writing this is Node 18. The FDM Monster server requires you to use at least NodeJS LTS 16.

To check Node is installed properly, you can execute this in command prompt, or in powershell:
> PS C:\Users\SomeUser> node -v
<br/> v18.14.2

### Step 2)
Install MongoDB Community Edition. This URL should allow you to download the MongoDB installation setup: https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5-signed.msi. 
If not select the Windows MSI package: https://www.mongodb.com/try/download/community.

### Step 2b) (Optional)
Please skip this if you're not an experienced user! 

MongoDB provides extra tools for you to get insight in your database.
https://www.mongodb.com/developer-tools

The following tools might be of interest:
- Compass, https://www.mongodb.com/products/compass. Connect to your database and query/adjust collections or documents.
- MongoDB VS Code Extension https://www.mongodb.com/products/vs-code. Inside VS Code, connect to your database and see/adjust the data in place.
- MongoDB shell https://www.mongodb.com/products/shell. Shell access to the database. For advanced users only!

### Step 3a)
Prepare the installation, by ensuring you have git installed. This will help you in updating FDM Monster in the future.
Find it here: https://git-scm.com/downloads

### Step 4)
The following steps 5-9 will install FDM Monster as a service manually. If you'd like to skip this, please use the `installations/fdm-monster-node-service` where I've provided scripts that will install the necessary stuff for you.

### Step 5)
From now on we will be working inside the Powershell (preferred), or Command Prompt (CMD). You should **not** use Administrator mode. 
Execute the following git clone command in a folder. This will create the `fdm-monster` sub-folder for you with all the code inside.

> git clone https://github.com/fdm-monster/fdm-monster.git --branch 1.2.4

Note that I added `--branch 1.2.4`? This is the latest stable release of FDM Monster. You can find them all here:
https://github.com/fdm-monster/fdm-monster/releases

Please head inside the `fdm-monster/server` sub-folder.

> cd fdm-monster/server

Once another version is available, you can run the following commands in sequence to prepare updating your service. 
Note that we are now **inside** the `fdm-monster/server/` folder.
Note that I filled in the unstable release `1.3.0-rc3` for the `git switch` command, please replace this with the relevant release of your choice:

> git fetch --prune
> git switch --detach 1.3.0-rc3

### Step 6)
The folder `fdm-monster` is now present, and you've changed to the directory `fdm-monster/server/` with Powershell or CMD.

We will install `yarn`, a package manager for NodeJS.
> npm i --global yarn

Please check yarn is installed. This is how that works with the `yarn -v` command:
> PS C:\Users\SomeUser> yarn -v <br/>
> 1.22.19

Execute this yarn installation command inside the `fdm-monster/server` folder to install the required dependencies to `node_modules`. This might take some time:
> yarn install --production --pure-lockfile

### Step 7) Installing the service
Prepare a file called `install-fdm-monster-service.js`. You can add the following code:
```
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

svc.install();
```

After that, run this installation script:

> node ./install-fdm-monster-service.js

### Step 7b) Updating the service

You should create a script to simplify this! I've created the following powershell script `download-update.ps1`:

``` 
npm run uninstall

cd fdm-monster
git fetch --prune
# Get the latest release (also unstable ones!)
$tag = git describe --tags --abbrev=0
git switch --detach $tag

cd server
npm install --global yarn
yarn -v
yarn install --production --pure-lockfile

cd ../../
node ./run_fdm_service.js
```

If you prefer to install specific versions, it's advised to replace this line: 
> $tag = git describe --tags --abbrev=0
 
with for example:

> $tag = 1.3.0

Execute the update with:
> powershell ./download-update.ps1

This will do the following:
- stop and uninstall the previous service
- update fdm-monster
- create a new service instance

During these steps the server will not be available for a short while. Please check [Step 9](#Step-9) for verifying whether your service is running.

### Step 8) Uninstalling the service. 
Create a file called `install-fdm-monster-service.js`. Write this code to it:

```
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
  console.log("Service stopped,. Service exists:", svc.exists);
});
svc.on("uninstall", function () {
  console.log("Uninstall complete. Service exists:", svc.exists);
});

svc.stop();
svc.uninstall();
```

Run the file as follows:

> node ./uninstall-fdm-monster-service.js

### Step 9)

You've installed `fdmmonster.exe` using node-windows. Great! You should be able to check the service `fdmmonster.exe` with description `FDM Monster` in Task Manager.
The service should have Status: Running. If this is not the case, something went wrong. Reach out to us on for more help [Discord](https://discord.gg/mwA8uP8CMc)!

![Image](images/task-manager.png)


If things are working, you can open fdm monster with this URL: http://localhost:4000 or http://127.0.0.1:4000

Please continue to [2_ENVIRONMENT_SETUP.md](2_ENVIRONMENT_SETUP.md) to change setup configurations.
