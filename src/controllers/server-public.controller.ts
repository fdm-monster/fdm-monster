import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { isNodemon, isNode, isPm2 } from "@/utils/env.utils";
import { authenticate, authorizePermission } from "@/middleware/authenticate";
import { PERMS } from "@/constants/authorization.constants";
import { isDocker } from "@/utils/is-docker";
import { serverSettingsKey } from "@/constants/server-settings.constants";
import { RoleService } from "@/services/authentication/role.service";
import { SettingsStore } from "@/state/settings.store";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { ServerReleaseService } from "@/services/server-release.service";
import { MonsterPiService } from "@/services/monsterpi.service";
import { UserService } from "@/services/authentication/user.service";

export class ServerPublicController {
  serverVersion: string;
  settingsStore: SettingsStore;
  printerSocketStore: PrinterSocketStore;
  serverReleaseService: ServerReleaseService;
  monsterPiService: MonsterPiService;
  userService: UserService;
  roleService: RoleService;

  constructor({
    settingsStore,
    printerSocketStore,
    serverVersion,
    serverReleaseService,
    monsterPiService,
    userService,
    roleService,
  }) {
    this.settingsStore = settingsStore;
    this.serverVersion = serverVersion;
    this.printerSocketStore = printerSocketStore;
    this.serverReleaseService = serverReleaseService;
    this.monsterPiService = monsterPiService;
    this.userService = userService;
    this.roleService = roleService;
  }

  welcome(req, res) {
    const serverSettings = this.settingsStore.getSettings();

    if (serverSettings[serverSettingsKey].loginRequired === false) {
      return res.send({
        message: "Login disabled. Please load the Vue app.",
      });
    }

    return res.send({
      message: "Login successful. Please load the Vue app.",
    });
  }

  getFeatures(req, res) {
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
    });
  }

  async getVersion(req, res) {
    let updateState = this.serverReleaseService.getState();
    const monsterPiVersion = this.monsterPiService.getMonsterPiVersionSafe();

    res.json({
      version: this.serverVersion,
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      os: process.env.OS,
      monsterPi: monsterPiVersion,
      update: {
        synced: updateState.synced,
        updateAvailable: updateState.updateAvailable,
        airGapped: updateState.airGapped,
      },
    });
  }
}

export default createController(ServerPublicController)
  .prefix(AppConstants.apiRoute + "/")
  .before([authenticate()])
  .get("", "welcome", { before: [authorizePermission(PERMS.ServerInfo.Get)] })
  .get("features", "getFeatures", { before: [authorizePermission(PERMS.ServerInfo.Get)] })
  .get("version", "getVersion", { before: [authorizePermission(PERMS.ServerInfo.Get)] });
