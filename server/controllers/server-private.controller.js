const { createController } = require("awilix-express");
const { authenticate, authorizeRoles } = require("../middleware/authenticate");
const Logger = require("../handlers/logger.js");
const { AppConstants } = require("../server.constants");
const { ROLES } = require("../constants/authorization.constants");
const { isTestEnvironment } = require("../utils/env.utils");
const { Printer } = require("../models");
const { PassThrough } = require("stream");

class ServerPrivateController {
  #logger = new Logger("Server-Private-API");
  #serverUpdateService;
  #serverReleaseService;
  clientBundleService;
  printerStore;
  yamlService;

  constructor({ serverUpdateService, serverReleaseService, clientBundleService, printerStore, floorStore, yamlService }) {
    this.#serverReleaseService = serverReleaseService;
    this.#serverUpdateService = serverUpdateService;
    this.clientBundleService = clientBundleService;
    this.printerStore = printerStore;
    this.yamlService = yamlService;
  }

  async updateClientBundleGithub(req, res) {
    await this.clientBundleService.downloadBundle();

    res.send({
      executed: true,
    });
  }

  async getReleaseStateInfo(req, res) {
    await this.#serverReleaseService.syncLatestRelease(false);
    const updateState = this.#serverReleaseService.getState();
    res.send(updateState);
  }

  async pullGitUpdates(req, res) {
    const result = await this.#serverUpdateService.checkGitUpdates();
    res.send(result);
  }

  async restartServer(req, res) {
    if (!isTestEnvironment()) {
      this.#logger.warning("Server restart command fired. Expect the server to be unavailable for a moment");
    }
    const result = await this.#serverUpdateService.restartServer();
    res.send(result);
  }

  async exportPrintersAndFloorsYaml(req, res) {
    const yaml = await this.yamlService.exportPrinterFloors(req.body);
    const fileContents = Buffer.from(yaml);
    const readStream = new PassThrough();
    readStream.end(fileContents);

    const fileName = "export-fdm-monster-" + Date.now() + ".yaml";
    res.set("Content-disposition", "attachment; filename=" + fileName);
    res.set("Content-Type", "text/plain");
    readStream.pipe(res);
  }

  async deleteAllPrinters(req, res) {
    await Printer.deleteMany({});
    await this.printerStore.loadPrinterStore();
    res.send();
  }
}

// prettier-ignore
module.exports = createController(ServerPrivateController)
  .prefix(AppConstants.apiRoute + "/server")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN])])
  .get("/", "getReleaseStateInfo")
  .get("/export-printers-floors-yaml", "exportPrintersAndFloorsYaml")
  .post("/git-update", "pullGitUpdates")
  .post("/restart", "restartServer")
  .post("/update-client-bundle-github", "updateClientBundleGithub")
  .delete("/delete-all-printers", "deleteAllPrinters");
