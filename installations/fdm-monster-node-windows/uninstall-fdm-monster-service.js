/**
 * Created by D. Zwart
 * Description: Uninstalls the Windows Service for FDM Monster
 * v1.0
 * 05/05/2023
 */

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
