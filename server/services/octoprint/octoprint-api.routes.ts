import { jsonContentType, contentTypeHeaderKey } from "./constants/octoprint-service.constants";
import { validateLogin, constructHeaders } from "./utils/api.utils";
import { getDefaultTimeout } from "../../constants/server-settings.constants";
import { normalizeUrl } from "../../utils/normalize-url";

export class OctoPrintRoutes {
  octoPrintBase = "/";
  apiBase = `${this.octoPrintBase}api`;
  apiSettingsPart = `${this.apiBase}/settings`;
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
  pluginBackupIndex = `${this.pluginsBase}/backup`;
  pluginBackupEndpoint = `${this.pluginsBase}/backup/backup`;
  pluginBackupFile = (filename) => `${this.pluginsBase}/backup/backup/${filename}`;
  pluginBackupFileDownload = (filename) => `${this.pluginsBase}/backup/download/${filename}`;
  pluginBackupFileRestore = `${this.pluginsBase}/backup/restore`; // Upload a backup on the fly
  pluginManager = `${this.pluginsBase}/pluginmanager`;
  pluginManagerPlugins = `${this.pluginManager}/plugins`; // Fast
  pluginManagerExport = `${this.pluginManager}/export`;
  pluginManagerOrphans = `${this.pluginManager}/orphans`;
  _settingsStore;
  _timeouts;

  constructor({ settingsStore }) {
    this._settingsStore = settingsStore;
  }

  get disconnectCommand() {
    return { command: "disconnect" };
  }

  get cancelJobCommand() {
    return { command: "cancel" };
  }

  get pauseJobCommand() {
    return { command: "pause", action: "pause" };
  }

  get resumeJobCommand() {
    return { command: "pause", action: "resume" };
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

  apiGetFiles = (recursive = false) => `${this.apiFiles}/local?recursive=${recursive}`;

  apiSoftwareUpdateCheck = (force) => `${this.octoPrintBase}plugin/softwareupdate/check${force ? "?force=true" : ""}`;

  selectCommand(print = false) {
    return { command: "select", print };
  }

  moveFileCommand(destination) {
    return { command: "move", destination };
  }

  printerNameSetting(printerName) {
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

  _ensureTimeoutSettingsLoaded() {
    const serverSettings = this._settingsStore.getSettings();
    this._timeouts = { ...serverSettings.timeout };

    if (!this._timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:ServerSettings:timeout didnt return anything"
      );
    }
  }

  /**
   *
   * @param {LoginDto} login
   * @param {string} path
   * @param {number|undefined} timeoutOverride
   * @param {string} contentType
   * @returns {{options: {headers: {"[apiKeyHeaderKey]": *, "[contentTypeHeaderKey]": string}, timeout: (number|{default: number, type: Number | NumberConstructor, required: boolean}|*)}, url: string}}
   * @protected
   */
  _prepareRequest(login, path, timeoutOverride, contentType = jsonContentType) {
    this._ensureTimeoutSettingsLoaded();

    const { apiKey, printerURL } = validateLogin(login);

    let headers = constructHeaders(apiKey, contentType);

    let timeout = timeoutOverride || this._timeouts.apiTimeout;
    if (timeout <= 0) {
      timeout = getDefaultTimeout().apiTimeout;
    }

    return {
      url: new URL(path, normalizeUrl(printerURL)).href,
      options: {
        headers,
        timeout,
      },
    };
  }

  _prepareAnonymousRequest(path, timeoutOverride, contentType = jsonContentType) {
    this._ensureTimeoutSettingsLoaded();

    let headers = {
      [contentTypeHeaderKey]: contentType,
    };
    let timeout = timeoutOverride || this._timeouts.apiTimeout;
    if (timeout <= 0) {
      timeout = getDefaultTimeout().apiTimeout;
    }

    return {
      url: path,
      options: {
        headers,
        timeout,
      },
    };
  }

  // Unused because we dont have any PUT/PATCH/POST with relevant data so far
  _prepareJsonRequest(printer, path, data, timeoutOverride) {
    const { url, options } = this._prepareRequest(printer, path, timeoutOverride);

    // We must allow file uploads elsewhere, so be explicit about the content type and data in this JSON request
    let serializedData = data ? JSON.stringify(data) : undefined;
    options.headers[contentTypeHeaderKey] = jsonContentType;

    return {
      url,
      data: serializedData,
      options,
    };
  }
}
