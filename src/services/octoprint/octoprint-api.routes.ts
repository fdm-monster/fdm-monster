import { jsonContentType, contentTypeHeaderKey } from "./constants/octoprint-service.constants";
import { validateLogin, constructHeaders } from "./utils/api.utils";
import { getDefaultTimeout, timeoutSettingKey } from "@/constants/server-settings.constants";
import { normalizeUrl } from "@/utils/normalize-url";
import { LoginDto } from "@/services/interfaces/login.dto";
import { SettingsStore } from "@/state/settings.store";
import { ITimeoutSettings } from "@/models/Settings";

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
  pluginBackupFile = (filename: string) => `${this.pluginsBase}/backup/backup/${filename}`;
  pluginBackupFileDownload = (filename: string) => `${this.pluginsBase}/backup/download/${filename}`;
  pluginBackupFileRestore = `${this.pluginsBase}/backup/restore`; // Upload a backup on the fly
  pluginManager = `${this.pluginsBase}/pluginmanager`;
  pluginManagerPlugins = `${this.pluginManager}/plugins`; // Fast
  pluginManagerExport = `${this.pluginManager}/export`;
  pluginManagerOrphans = `${this.pluginManager}/orphans`;
  _settingsStore;
  _timeouts: ITimeoutSettings;

  constructor({ settingsStore }: { settingsStore: SettingsStore }) {
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

  getBedTargetCommand(targetTemperature: number) {
    return { command: "target", target: targetTemperature };
  }

  pluginManagerPlugin = (pluginName: string) => `${this.pluginManager}/${pluginName}`;

  pluginManagerRepository = (refresh = false) => `${this.pluginManager}/repository?refresh=${refresh}`;

  apiFile = (path: string) => `${this.apiFilesLocation}/${path}`;

  apiGetFiles = (recursive = false) => `${this.apiFiles}/local?recursive=${recursive}`;

  apiSoftwareUpdateCheck = (force: boolean) => `${this.octoPrintBase}plugin/softwareupdate/check${force ? "?force=true" : ""}`;

  selectCommand(print = false) {
    return { command: "select", print };
  }

  moveFileCommand(destination: string) {
    return { command: "move", destination };
  }

  printerNameSetting(name: string) {
    return {
      appearance: {
        name: name,
      },
    };
  }

  gcodeAnalysisSetting(enabled: boolean) {
    return {
      gcodeAnalysis: {
        runAt: enabled ? "idle" : "never",
      },
    };
  }

  pluginFirmwareUpdaterSettings(subsettings: any) {
    return {
      plugins: {
        firmwareupdater: subsettings,
      },
    };
  }

  pluginManagerCommand(command: string, url: string) {
    return {
      command,
      url,
    };
  }

  _ensureTimeoutSettingsLoaded() {
    const serverSettings = this._settingsStore.getSettings();
    this._timeouts = { ...serverSettings[timeoutSettingKey] };

    if (!this._timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:Settings:timeout didnt return anything"
      );
    }
  }

  protected _prepareRequest(login: LoginDto, path: string, timeoutOverride?: number, contentType = jsonContentType) {
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

  _prepareAnonymousRequest(path: string, timeoutOverride?: number, contentType = jsonContentType) {
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
  _prepareJsonRequest(login: LoginDto, path: string, data: any, timeoutOverride?: number) {
    const { url, options } = this._prepareRequest(login, path, timeoutOverride);

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
