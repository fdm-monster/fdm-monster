const {
  jsonContentType,
  contentTypeHeaderKey
} = require("./constants/octoprint-service.constants");
const { validatePrinter, constructHeaders } = require("./utils/api.utils");
const { getDefaultTimeout } = require("../../constants/server-settings.constants");

class OctoPrintRoutes {
  octoPrintBase = "/";
  apiBase = `${this.octoPrintBase}api`;
  apiSettingsPart = `${this.apiBase}/settings`;
  apiFiles = `${this.apiBase}/files`;
  apiFilesLocation = `${this.apiFiles}/local`;
  apiConnection = `${this.apiBase}/connection`;
  apiJob = `${this.apiBase}/job`;
  apiPrinterOperations = `${this.apiBase}/printer`;
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

  pluginsBase = `${this.octoPrintBase}plugins`;
  pluginSoftwareUpdate = `${this.pluginsBase}/softwareupdate`;
  pluginSoftwareUpdateCheck = `${this.pluginSoftwareUpdate}/check`; // GET
  pluginSoftwareUpdateUpdate = `${this.pluginSoftwareUpdate}/update`; // POST
  pluginManager = `${this.pluginsBase}/pluginmanager`;
  pluginManagerPlugins = `${this.pluginManager}/plugins`; // Fast
  pluginManagerPlugin = (pluginName) => `${this.pluginManager}/${pluginName}`;
  pluginManagerExport = `${this.pluginManager}/export`;
  pluginManagerOrphans = `${this.pluginManager}/orphans`;
  pluginManagerRepository = (refresh = false) =>
    `${this.pluginManager}/repository?refresh=${refresh}`;
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

  get connectCommand() {
    return { command: "connect" };
  }

  apiFile = (path) => `${this.apiFilesLocation}/${path}`;

  apiGetFiles = (recursive = false) => `${this.apiFiles}/local?recursive=${recursive}`;

  apiSoftwareUpdateCheck = (force) =>
    `${this.octoPrintBase}plugin/softwareupdate/check${force ? "?force=true" : ""}`;

  selectCommand(print = false) {
    return { command: "select", print };
  }

  moveFileCommand(destination) {
    return { command: "move", destination };
  }

  gcodeAnalysisSetting(enabled) {
    return {
      gcodeAnalysis: {
        runAt: enabled ? "idle" : "never"
      }
    };
  }

  pluginManagerCommand(command, url) {
    return {
      command,
      url
    };
  }

  _ensureTimeoutSettingsLoaded() {
    const serverSettings = this._settingsStore.getServerSettings();
    this._timeouts = { ...serverSettings.timeout };

    if (!this._timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:ServerSettings:timeout didnt return anything"
      );
    }
  }

  _prepareRequest(printer, path, timeoutOverride, contentType = jsonContentType) {
    this._ensureTimeoutSettingsLoaded();

    const { apiKey, printerURL } = validatePrinter(printer);

    let headers = constructHeaders(apiKey, contentType);

    let timeout = timeoutOverride || this._timeouts.apiTimeout;
    if (timeout <= 0) {
      timeout = getDefaultTimeout().apiTimeout;
    }

    return {
      url: new URL(path, printerURL).href,
      options: {
        headers,
        timeout
      }
    };
  }

  _prepareAnonymousRequest(path, timeoutOverride, contentType = jsonContentType) {
    this._ensureTimeoutSettingsLoaded();

    let headers = {
      [contentTypeHeaderKey]: contentType
    };
    let timeout = timeoutOverride || this._timeouts.apiTimeout;
    if (timeout <= 0) {
      timeout = getDefaultTimeout().apiTimeout;
    }

    return {
      url: path,
      options: {
        headers,
        timeout
      }
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
      options
    };
  }
}

module.exports = OctoPrintRoutes;
