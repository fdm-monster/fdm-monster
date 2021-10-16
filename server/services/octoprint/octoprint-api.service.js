const fs = require("fs");
const request = require("request");
const {
  OPClientErrors,
  contentTypeHeaderKey,
  apiKeyHeaderKey,
  FileLocation,
  multiPartContentType
} = require("./constants/octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const {
  processResponse,
  validatePrinter,
  constructHeaders,
  processGotResponse
} = require("./utils/api.utils");
const { jsonContentType } = require("./constants/octoprint-service.constants");
const { getDefaultTimeout } = require("../../constants/server-settings.constants");
const FormData = require("form-data");
const got = require("got");

const defaultResponseOptions = { unwrap: true };
const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";
const apiSettingsPart = apiBase + "/settings";
const apiFiles = apiBase + "/files";
const apiFilesLocation = (location) => `${apiFiles}/${location}`;
const apiFile = (path, location) => `${apiFilesLocation(location)}/${path}`;
const apiGetFiles = (recursive = true, location) =>
  `${apiFiles}/${location}?recursive=${recursive}`;
const apiConnection = apiBase + "/connection";
const apiJob = apiBase + "/job";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiUsers = apiBase + "/users";
const apiLogin = apiBase + "/login?passive=true";

const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiPluginManagerRepository1_6_0 = octoPrintBase + "plugin/pluginmanager/repository";
const apiSoftwareUpdateCheck = (force) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "?force=true" : "");
const apiPluginPiSupport = apiBase + "/plugin/pi_support";
const apiPluginFilamentManagerSpools = apiBase + "/plugin/filamentmanager/spools";
const apiPluginFilamentManagerProfiles = apiBase + "/plugin/filamentmanager/profiles";
const apiTimelapse = apiBase + "/timelapse";

class OctoprintApiService {
  #settingsStore;
  #httpClient;
  #timeouts; // TODO apply apiTimeout, but apply apiRetry, apiRetryCutoff elsewhere (and webSocketRetry)

  #logger;

  constructor({ settingsStore, httpClient, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#httpClient = httpClient;
    this.#logger = loggerFactory("OctoPrint-API-Service");
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

  selectCommand(print = false) {
    return { command: "select", print };
  }

  #ensureTimeoutSettingsLoaded() {
    const serverSettings = this.#settingsStore.getServerSettings();
    this.#timeouts = { ...serverSettings.timeout };

    if (!this.#timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:ServerSettings:timeout didnt return anything"
      );
    }
  }

  #prepareRequest(printer, path, timeoutOverride, contentType = jsonContentType) {
    this.#ensureTimeoutSettingsLoaded();

    const { apiKey, printerURL } = validatePrinter(printer);

    let headers = constructHeaders(apiKey, contentType);

    let timeout = timeoutOverride || this.#timeouts.apiTimeout;
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

  // Unused because we dont have any PUT/PATCH/POST with relevant data so far
  #prepareJSONRequest(printer, path, data, timeoutOverride) {
    const { url, options } = this.#prepareRequest(printer, path, timeoutOverride);

    // We must allow file uploads elsewhere, so be explicit about the content type and data in this JSON request
    let serializedData = data ? JSON.stringify(data) : undefined;
    options.headers[contentTypeHeaderKey] = jsonContentType;

    return {
      url,
      data: serializedData,
      options
    };
  }

  async login(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiLogin);

    const response = await this.#httpClient.post(url, {}, options);

    return processResponse(response, responseOptions);
  }

  async sendConnectionCommand(printer, commandData, responseOptions = defaultResponseOptions) {
    const { url, options, data } = this.#prepareJSONRequest(printer, apiConnection, commandData);

    const response = await this.#httpClient.post(url, data, options);

    return processResponse(response, responseOptions);
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   * @param printer
   * @param commandData command: start, cancel, restart
   * @param responseOptions
   * @returns {Promise<*|{data: *, status: *}>}
   */
  async sendJobCommand(printer, commandData, responseOptions = defaultResponseOptions) {
    const { url, options, data } = this.#prepareJSONRequest(printer, apiJob, commandData);

    const response = await this.#httpClient.post(url, data, options);

    return processResponse(response, responseOptions);
  }

  async getSettings(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSettingsPart);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async setGCodeAnalysis(printer, { enabled }, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSettingsPart);

    const settingPatch = {
      gcodeAnalysis: {
        runAt: enabled ? "idle" : "never"
      }
    };
    const response = await this.#httpClient.post(url, settingPatch, options);

    return processResponse(response, responseOptions);
  }

  async getAdminUserOrDefault(printer) {
    const data = await this.getUsers(printer, defaultResponseOptions);

    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  async getUsers(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiUsers);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getFiles(
    printer,
    recursive = false,
    location = FileLocation.local,
    responseOptions = defaultResponseOptions
  ) {
    const { url, options } = this.#prepareRequest(printer, apiGetFiles(recursive, location));

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getFile(
    printer,
    path,
    location = FileLocation.local,
    responseOptions = defaultResponseOptions
  ) {
    const { url, options } = this.#prepareRequest(printer, apiFile(path, location));

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async selectPrintFile(
    printer,
    path,
    location = FileLocation.local,
    command,
    responseOptions = defaultResponseOptions
  ) {
    const { url, options } = this.#prepareRequest(printer, apiFile(path, location));

    const response = await this.#httpClient.post(url, command, options);

    return processResponse(response, responseOptions);
  }

  async uploadFilesAsMultiPart(
    printer,
    fileBuffers,
    commands,
    location = FileLocation.local,
    responseOptions = defaultResponseOptions
  ) {
    const { url, options } = this.#prepareRequest(
      printer,
      apiFilesLocation(location),
      null,
      multiPartContentType
    );

    const formData = new FormData();

    fileBuffers.forEach((b) => {
      if (typeof b?.pipe === "function") {
        formData.append("file", b);
      } else {
        formData.append("file", b.buffer, { filename: b.originalname });
      }
    });

    if (fileBuffers.length === 1) {
      if (commands.select) {
        formData.append("select", "true");
      }
      if (commands.print) {
        formData.append("print", "true");
      }
    }

    try {
      const headers = {
        ...options.headers,
        ...formData.getHeaders()
      };

      // Not awaited to maintain promise calls like .json()/.text() etc
      const response = await got
        .post(url, {
          body: formData,
          headers
        })
        .on("uploadProgress", (p) => {
          console.log(p.percent);
        });

      return await processGotResponse(response, responseOptions);
    } catch (e) {
      return { error: e.message, success: false, stack: e.stack };
    }
  }

  async deleteFile(
    printer,
    path,
    location = FileLocation.local,
    responseOptions = defaultResponseOptions
  ) {
    const { url, options } = this.#prepareRequest(printer, apiFile(path, location));

    const response = await this.#httpClient.delete(url, options);

    return processResponse(response, responseOptions);
  }

  async getConnection(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiConnection);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPrinterProfiles(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPrinterProfiles);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPluginManager(printer, responseOptions = defaultResponseOptions) {
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);

    const path = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getSystemInfo(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSystemInfo);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getSystemCommands(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSystemCommands);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getSoftwareUpdateCheck(printer, force, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSoftwareUpdateCheck(force));

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPluginPiSupport(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPluginPiSupport);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async deleteTimeLapse(printer, fileName, responseOptions = defaultResponseOptions) {
    if (!fileName) {
      throw new Error("Cant delete timelapse file without providing filename");
    }

    const path = `${apiTimelapse}/${fileName}`;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.delete(url, options);

    return processResponse(response, responseOptions);
  }

  async listUnrenderedTimeLapses(printer, responseOptions = defaultResponseOptions) {
    const path = `${apiTimelapse}?unrendered=true`;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async listPluginFilamentManagerProfiles(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPluginFilamentManagerProfiles);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async listPluginFilamentManagerFilament(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPluginFilamentManagerSpools);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPluginFilamentManagerFilament(
    printer,
    filamentID,
    responseOptions = defaultResponseOptions
  ) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }

    const path = `${apiPluginFilamentManagerSpools}/${parsedFilamentID}`;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  // TODO WIP with axios
  async downloadFile(printerConnection, fetchPath, targetPath, callback) {
    const fileStream = fs.createWriteStream(targetPath);

    // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile

    // TODO
    const res = await this.#httpClient.get(printerConnection, fetchPath, false);

    return await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", async () => {
        await callback(resolve, reject);
      });
    });
  }

  // TODO WIP
  async downloadImage({ printerURL, apiKey }, fetchPath, targetPath, callback) {
    const fileStream = fs.createWriteStream(targetPath);

    // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile

    // TODO
    const downloadURL = new URL(fetchPath, printerURL);
    return request.head(downloadURL, (err, res, body) => {
      res.headers[contentTypeHeaderKey] = "image/png";
      res.headers[apiKeyHeaderKey] = apiKey;
      request(url).pipe(fs.createWriteStream(targetPath)).on("close", callback);
    });
  }
}

module.exports = OctoprintApiService;
