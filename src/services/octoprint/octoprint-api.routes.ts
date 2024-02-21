import { contentTypeHeaderKey, jsonContentType } from "./constants/octoprint-service.constants";
import { constructHeaders, validateLogin } from "./utils/api.utils";
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
  apiPrinter = `${this.apiBase}/printer`;
  apiPrinterHead = `${this.apiBase}/printer/printhead`;
  apiPrinterBed = `${this.apiPrinter}/bed`;
  apiPrinterCustomCommand = `${this.apiPrinter}/command`;
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
  settingsStore: SettingsStore;
  timeouts: ITimeoutSettings;

  constructor({ settingsStore }: { settingsStore: SettingsStore }) {
    this.settingsStore = settingsStore;
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

  apiPrinterCurrent = (history?: boolean, limit?: number, exclude?: ("temperature" | "sd" | "state")[]) => {
    exclude = exclude?.filter((e) => !!e.length);
    const excludeParam = exclude?.length ? `&exclude=${exclude?.join(",")}` : "";
    const limitParam = !!limit ? "&limit=limit" : "";
    return `${this.apiPrinter}?history=${!!history}${limitParam}${excludeParam}`;
  };

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

  ensureTimeoutSettingsLoaded() {
    const serverSettings = this.settingsStore.getSettings();
    this.timeouts = { ...serverSettings[timeoutSettingKey] };

    if (!this.timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:Settings:timeout didnt return anything"
      );
    }
  }

  protected prepareRequest(login: LoginDto, path: string, timeoutOverride?: number, contentType = jsonContentType) {
    this.ensureTimeoutSettingsLoaded();

    const { apiKey, printerURL } = validateLogin(login);

    let headers = constructHeaders(apiKey, contentType);

    let timeout = timeoutOverride || this.timeouts.apiTimeout;
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

  prepareAnonymousRequest(path: string, timeoutOverride?: number, contentType = jsonContentType) {
    this.ensureTimeoutSettingsLoaded();

    let headers = {
      [contentTypeHeaderKey]: contentType,
    };
    let timeout = timeoutOverride || this.timeouts.apiTimeout;
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
  prepareJsonRequest(login: LoginDto, path: string, data: any, timeoutOverride?: number) {
    const { url, options } = this.prepareRequest(login, path, timeoutOverride);

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
