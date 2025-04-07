import { before, GET, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { isNode } from "@/utils/env.utils";
import { authenticate, permission } from "@/middleware/authenticate";
import { PERMS } from "@/constants/authorization.constants";
import { isDocker } from "@/utils/is-docker";
import { SettingsStore } from "@/state/settings.store";
import { ServerReleaseService } from "@/services/core/server-release.service";
import { MonsterPiService } from "@/services/core/monsterpi.service";
import { Request, Response } from "express";

@route(AppConstants.apiRoute)
export class ServerPublicController {
  constructor(
    private readonly settingsStore: SettingsStore,
    private readonly serverVersion: string,
    private readonly serverReleaseService: ServerReleaseService,
    private readonly monsterPiService: MonsterPiService,
    private readonly isTypeormMode: boolean,
  ) {}

  @GET()
  @route("/")
  @before([authenticate(), permission(PERMS.ServerInfo.Get)])
  welcome(req: Request, res: Response) {
    this.settingsStore.getSettings();

    if (!this.settingsStore.getLoginRequired()) {
      return res.send({
        message: "Login disabled. Please load the Vue app.",
      });
    }

    return res.send({
      message: "Login required. Please load the Vue app.",
    });
  }

  @GET()
  @route("/features")
  @before([authenticate()])
  getFeatures(req: Request, res: Response) {
    const serverSettings = this.settingsStore.getServerSettings();
    const moonrakerEnabled = serverSettings.experimentalMoonrakerSupport;
    res.send({
      batchReprintCalls: {
        available: true,
        // API duplicated at /batch/reprint (deprecated but backwards compatible)
        version: 2,
      },
      batchConnectSocketCalls: {
        available: true,
        version: 1,
      },
      batchConnectUsbCalls: {
        available: true,
        version: 1,
      },
      newSockets: {
        available: true,
        version: 1,
      },
      anonymousDiagnosticsToggle: {
        available: true,
        version: 1,
      },
      pauseResumePrinterCommand: {
        available: true,
        version: 1,
      },
      logDumpZip: {
        available: true,
        version: 1,
      },
      clearLogFiles: {
        available: true,
        version: 1,
      },
      batchTogglePrinterEnabled: {
        available: true,
        version: 1,
      },
      cameraStream: {
        available: true,
        version: 1,
        subFeatures: {},
      },
      printerGroupsApi: {
        // Only SQLite mode supported for this feature
        available: this.isTypeormMode,
        version: 1,
        subFeatures: {},
      },
      printerControlApi: {
        available: true,
        version: 1,
      },
      githubRateLimitApi: {
        available: true,
        version: 1,
      },
      multiplePrinterServices: {
        available: true,
        version: 1,
        subFeatures: {
          types: moonrakerEnabled ? ["octoprint", "klipper"] : ["octoprint"],
        },
      },
    });
  }

  @GET()
  @route("/version")
  @before([authenticate(), permission(PERMS.ServerInfo.Get)])
  async getVersion(req: Request, res: Response) {
    const updateState = this.serverReleaseService.getState();
    const monsterPiVersion = this.monsterPiService.getMonsterPiVersionSafe();

    res.json({
      version: this.serverVersion,
      isDockerContainer: isDocker(),
      isNode: isNode(),
      os: process.env.OS,
      monsterPi: monsterPiVersion,
      update: {
        synced: updateState.synced,
        updateAvailable: updateState.updateAvailable,
        airGapped: updateState.airGapped,
      },
    });
  }

  @GET()
  @route("/test")
  async test(req: Request, res: Response) {
    res.send({
      message: "Test successful. Please load the Vue app.",
    });
  }
}
