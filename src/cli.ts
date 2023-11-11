/**
 * Created by D. J. Zwart
 * Description: Installs the Windows, macOS or Linux Service for FDM Monster
 * v0.1-alpha
 * October 28th, 2023
 */

import { join } from "path";
import { arch, platform } from "os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const cliCmd = "fdmm";
const cliVersion = "0.1.0-alpha";
const serverVersion = require(join(__dirname, "../package.json")).version;

if (!["arm64", "x64"].includes(arch())) {
  console.warn(
    `FDM Monster is installed on architecture ${arch()}. This seems unsupported and you are therefore operating at your own risk.`
  );
}
let serviceInstaller = "node-linux";
const platformOs = platform();
switch (platformOs) {
  case "darwin":
    serviceInstaller = "node-mac";
    break;
  case "win32":
    serviceInstaller = "node-windows";
    break;
  case "linux":
    serviceInstaller = "node-linux";
    break;
  default:
    console.warn(
      `The platform ${platformOs} is not supported, the service package ${serviceInstaller}. Please proceed with caution.`
    );
}

console.log(`Detected platform ${platformOs} and chose installer ${serviceInstaller}`);
const argv = yargs(hideBin(process.argv))
  .usage(`Usage: $0 install`)
  .scriptName(cliCmd)
  .demandCommand()
  .command(["install", "i"], "install the FDM Monster service", () => {
    console.log("Installing FDM Monster system service");
    const service = getService(serviceInstaller, __dirname);
    if (service.exists()) {
      service.uninstall();
    }
    service.install();
  })
  .command(["uninstall", "u", "r", "remove"], "uninstall the FDM Monster service", () => {
    console.log("Uninstalling FDM Monster system service");
    const service = getService(serviceInstaller, __dirname);
    service.uninstall();
  })
  .command(["status", "s"], "Status of the FDM Monster service", () => {
    const service = getService(serviceInstaller, __dirname);
    console.log("Service exists: ", service.exists);
  })
  .help("help")
  .alias("h", "help")
  .version("version", `@fdm-monster/server:\t\t${serverVersion}\nCommand Line Interface (CLI):\t${cliVersion}`) // the version string.
  .alias("version", "v")
  .epilog("For more information visit https://fdm-monster.net\nCopyright 2023 D. J. Zwart - AGPLv3 License").argv;

if (argv) {
  process.exit(0);
}

function getService(packageName: string, rootDir: string) {
  try {
    const { Service } = require(packageName);
  } catch (e) {
    console.error(
      `FDM Monster CLI: Could not find required package ${packageName}. This should be installed globally with f.e. 'yarn global add ${packageName}' or 'npm i -g ${packageName}'`
    );
    process.exit(2023);
  }

  // Create a new service object
  const rootPath = join(rootDir, "..");

  const { Service } = require(packageName);
  const service = new Service({
    name: "FDM Monster",
    description: "The 3D Printer Farm server for managing your 100+ OctoPrints printers.",
    script: join(rootPath, "./dist/index.js"),
    nodeOptions: ["--harmony", "--max_old_space_size=4096"],
    workingDirectory: rootPath,
  });
  service.on("uninstall", function () {
    console.log("Uninstall complete. Service exists?", service.exists());
  });
  service.on("stop", function () {
    console.log("Service stopped. Service exists?", service.exists());
  });
  service.on("install", function () {
    service.start();
    console.log("Install complete. Service exists?", service.exists());
    console.log("Service running: ", service.isRunning);
  });

  return service;
}
