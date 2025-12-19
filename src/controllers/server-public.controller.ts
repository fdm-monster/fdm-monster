import { before, GET, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { isNode } from "@/utils/env.utils";
import { authenticate, permission } from "@/middleware/authenticate";
import { PERMS } from "@/constants/authorization.constants";
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
  ) {
  }

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
    const prusaLinkEnabled = serverSettings.experimentalPrusaLinkSupport;
    const bambuEnabled = serverSettings.experimentalBambuSupport;
    res.send({
      printerGroupsApi: {
        // Only SQLite mode supported for this feature
        available: this.isTypeormMode,
        version: 1,
        subFeatures: {},
      },
      multiplePrinterServices: {
        available: true,
        version: 1,
        subFeatures: {
          types: [
            "octoprint",
            ...(moonrakerEnabled ? ["klipper"] : []),
            ...(prusaLinkEnabled ? ["prusaLink"] : []),
            ...(bambuEnabled ? ["bambu"] : []),            
          ],
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
