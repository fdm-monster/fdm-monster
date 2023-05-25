import { contentTypeHeaderKey, jsonContentType } from "@/octoprint/octoprint.constants";

export class OctoPrintClientRoutes {
  octoPrintBase = "/";
  downloadsBase = `${this.octoPrintBase}downloads`;
  downloadsLocal = `${this.downloadsBase}/files/local`;
  apiBase = `${this.octoPrintBase}api`;
  apiSettings = `${this.apiBase}/settings`;
  apiFiles = `${this.apiBase}/files`;
  apiFilesLocation = `${this.apiFiles}/local`;
  apiConnection = `${this.apiBase}/connection`;
  apiJob = `${this.apiBase}/job`;
  apiPrinterOperations = `${this.apiBase}/printer`;
  apiPrinterBed = `${this.apiPrinterOperations}/bed`;
  apiPrinterCustomCommand = `${this.apiPrinterOperations}/command`;
  apiPrinterProfiles = `${this.apiBase}/printerprofiles`;
  apiSystem = `${this.apiBase}/system`;
  apiSystemInfo = `${this.apiSystem}/info`;
  apiSystemCommands = `${this.apiSystem}/commands`;
  apiSystemRestartCommand = `${this.apiSystemCommands}/core/restart`;
  apiCurrentUser = `${this.apiBase}/currentuser`;
  apiUsers = `${this.apiBase}/users`;
  apiLogin = `${this.apiBase}/login?passive=true`;
  apiPluginPiSupport = `${this.apiBase}/plugin/pi_support`;
  apiProfiles = `${this.apiBase}/plugin/printerprofiles`;
  apiTimelapse = `${this.apiBase}/timelapse`;
  apiPlugin = `${this.apiBase}/plugin`;
  apiPluginManager = `${this.apiPlugin}/pluginmanager`; // GET is deprecated, POST is in use

  pluginsBase = `${this.octoPrintBase}plugin`;
  pluginSoftwareUpdate = `${this.pluginsBase}/softwareupdate`;
  pluginSoftwareUpdateCheck = `${this.pluginSoftwareUpdate}/check`; // GET
  pluginSoftwareUpdateUpdate = `${this.pluginSoftwareUpdate}/update`; // POST
  pluginFirmwareUpdater = `${this.pluginsBase}/firmwareupdater`;
  pluginFirmwareUpdaterStatus = `${this.pluginsBase}/firmwareupdater/status`; // GET
  pluginFirmwareUpdaterFlash = `${this.pluginsBase}/firmwareupdater/flash`; // POST
  pluginManager = `${this.pluginsBase}/pluginmanager`;
  pluginManagerPlugins = `${this.pluginManager}/plugins`; // Fast
  pluginManagerExport = `${this.pluginManager}/export`;
  pluginManagerOrphans = `${this.pluginManager}/orphans`;

  constructor() {}

  get disconnectCommand() {
    return { command: "disconnect" };
  }

  get cancelJobCommand() {
    return { command: "cancel" };
  }

  get connectCommand() {
    return { command: "connect" };
  }

  getBedTargetCommand(targetTemperature) {
    return { command: "target", target: targetTemperature };
  }

  pluginManagerPlugin = (pluginName) => `${this.pluginManager}/${pluginName}`;

  pluginManagerRepository = (refresh = false) => `${this.pluginManager}/repository?refresh=${refresh}`;

  apiFile = (path) => `${this.apiFilesLocation}/${path}`;
  downloadLocalFilePath = (path: string) => `${this.downloadsLocal}/${path}`;

  apiGetFiles = (recursive = false) => `${this.apiFiles}/local?recursive=${recursive}`;

  apiSoftwareUpdateCheck = (force) => `${this.octoPrintBase}plugin/softwareupdate/check${force ? "?force=true" : ""}`;

  selectCommand(print = false) {
    return { command: "select", print };
  }

  moveFileCommand(destination) {
    return { command: "move", destination };
  }

  corsAccess() {
    return {
      api: {
        allowCrossOrigin: true,
      },
    };
  }

  nameSetting(printerName) {
    return {
      appearance: {
        name: printerName,
      },
    };
  }

  gcodeAnalysisSetting(enabled) {
    return {
      gcodeAnalysis: {
        runAt: enabled ? "idle" : "never",
      },
    };
  }

  pluginFirmwareUpdaterSettings(subsettings) {
    return {
      plugins: {
        firmwareupdater: subsettings,
      },
    };
  }

  pluginManagerCommand(command, url) {
    return {
      command,
      url,
    };
  }

  _prepareAnonymousRequest(path, contentType = jsonContentType) {
    let headers = {
      [contentTypeHeaderKey]: contentType,
    };

    return {
      url: path,
      options: {
        headers,
      },
    };
  }
}
