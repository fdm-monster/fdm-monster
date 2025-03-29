import { PassThrough } from "stream";
import { createController } from "awilix-express";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import { validateMiddleware } from "@/handlers/validators";
import { ServerReleaseService } from "@/services/core/server-release.service";
import { ClientBundleService } from "@/services/core/client-bundle.service";
import { PrinterCache } from "@/state/printer.cache";
import { YamlService } from "@/services/core/yaml.service";
import { MulterService } from "@/services/core/multer.service";
import { LogDumpService } from "@/services/core/logs-manager.service";
import { Request, Response } from "express";
import { demoUserNotAllowed } from "@/middleware/demo.middleware";
import { GithubService } from "@/services/core/github.service";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { updateClientBundleSchema } from "@/controllers/validation/server-private.validation";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class ServerPrivateController {
  private readonly logger;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly serverReleaseService: ServerReleaseService,
    private readonly printerCache: PrinterCache,
    private readonly printerService: IPrinterService,
    private readonly clientBundleService: ClientBundleService,
    private readonly githubService: GithubService,
    private readonly logDumpService: LogDumpService,
    private readonly yamlService: YamlService,
    private readonly multerService: MulterService
  ) {
    this.logger = loggerFactory(ServerPrivateController.name);
  }

  async getClientReleases(req: Request, res: Response) {
    const releaseSpec = await this.clientBundleService.getReleases();
    res.send(releaseSpec);
  }

  /**
   * It is not advised to downgrade beyond the default minimum version, any server restart will
   * update the bundle back to minimum version (if ENABLE_CLIENT_DIST_AUTO_UPDATE === 'true').
   // * @param {UpdateClientDistDto} updateDto
   */
  async updateClientBundleGithub(req: Request, res: Response) {
    const updateDto = await validateMiddleware(req, updateClientBundleSchema);

    const willExecute = await this.clientBundleService.shouldUpdateWithReason(
      true,
      AppConstants.defaultClientMinimum,
      updateDto.downloadRelease,
      updateDto.allowDowngrade
    );

    this.logger.log(`Will execute: ${willExecute?.shouldUpdate}, reason: ${willExecute?.reason}`);
    if (!willExecute?.shouldUpdate) {
      return res.send({
        executed: false,
        requestedVersion: willExecute.requestedVersion,
        currentVersion: willExecute.currentVersion,
        minimumVersion: willExecute.minimumVersion,
        shouldUpdate: willExecute.shouldUpdate,
        targetVersion: willExecute.targetVersion,
        reason: willExecute?.reason,
      });
    }

    const tag_name = await this.clientBundleService.downloadClientUpdate(willExecute.targetVersion);

    return res.send({
      executed: true,
      requestedVersion: willExecute.requestedVersion,
      currentVersion: willExecute.currentVersion,
      minimumVersion: willExecute.minimumVersion,
      shouldUpdate: willExecute.shouldUpdate,
      targetVersion: willExecute.targetVersion,
      reason: willExecute?.reason,
    });
  }

  async getGithubRateLimit(req: Request, res: Response) {
    const rateLimitResponse = await this.githubService.getRateLimit();
    res.send(rateLimitResponse.data);
  }

  async getReleaseStateInfo(req: Request, res: Response) {
    await this.serverReleaseService.syncLatestRelease();
    const updateState = this.serverReleaseService.getState();
    res.send(updateState);
  }

  async importPrintersAndFloorsYaml(req: Request, res: Response) {
    const files = await this.multerService.multerLoadFileAsync(req, res, [".yaml"], false);
    const firstFile = files[0];
    const spec = await this.yamlService.importPrintersAndFloors(firstFile.buffer.toString());

    res.send({
      success: true,
      spec,
    });
  }

  async exportPrintersAndFloorsYaml(req: Request, res: Response) {
    const yaml = await this.yamlService.exportPrintersAndFloors(req.body);
    const fileContents = Buffer.from(yaml);
    const readStream = new PassThrough();
    readStream.end(fileContents);

    const fileName = `export-${AppConstants.serverRepoName}-` + Date.now() + ".yaml";
    res.set("Content-disposition", "attachment; filename=" + fileName);
    res.set("Content-Type", "text/plain");
    readStream.pipe(res);
  }

  async deleteAllPrinters(req: Request, res: Response) {
    const printers = await this.printerCache.listCachedPrinters(true);
    const printerIds = printers.map((p) => p.id);
    await this.printerService.deleteMany(printerIds);
    res.send();
  }

  async clearLogs(req: Request, res: Response) {
    const counts = await this.logDumpService.deleteOlderThanWeekAndMismatchingLogFiles();
    res.send(counts);
  }

  async dumpLogZips(req: Request, res: Response) {
    const filePath = await this.logDumpService.dumpZip();
    res.sendFile(filePath);
  }
}

// prettier-ignore
export default createController(ServerPrivateController)
  .prefix(AppConstants.apiRoute + "/server")
  .before([authenticate(), authorizeRoles([ROLES.ADMIN]), demoUserNotAllowed])
  .get("/", "getReleaseStateInfo")
  .get("/client-releases", "getClientReleases")
  .get("/github-rate-limit", "getGithubRateLimit")
  .post("/update-client-bundle-github", "updateClientBundleGithub")
  .post("/export-printers-floors-yaml", "exportPrintersAndFloorsYaml")
  .post("/import-printers-floors-yaml", "importPrintersAndFloorsYaml")
  .get("/dump-fdm-monster-logs", "dumpLogZips")
  .post("/dump-fdm-monster-logs", "dumpLogZips")
  .delete("/clear-outdated-fdm-monster-logs", "clearLogs")
  .delete("/delete-all-printers", "deleteAllPrinters");
