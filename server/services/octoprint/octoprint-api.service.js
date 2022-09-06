const fs = require("fs");
const {
  multiPartContentType,
  pluginRepositoryUrl
} = require("./constants/octoprint-service.constants");
const { processResponse, processGotResponse } = require("./utils/api.utils");
const FormData = require("form-data");
const got = require("got");
const { uploadProgressEvent, firmwareFlashUpload } = require("../../constants/event.constants");
const { ExternalServiceError } = require("../../exceptions/runtime.exceptions");
const OctoPrintRoutes = require("./octoprint-api.routes");

class OctoPrintApiService extends OctoPrintRoutes {
  _httpClient;
  _eventEmitter2;

  _logger;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    super({ settingsStore });
    this._httpClient = httpClient;
    this._eventEmitter2 = eventEmitter2;
    this._logger = loggerFactory("OctoPrint-API-Service");
  }

  async login(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiLogin);
    const response = await this._httpClient.post(url, {}, options);
    return processResponse(response, responseOptions);
  }

  async sendConnectionCommand(printer, commandData, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(
      printer,
      this.apiConnection,
      commandData
    );
    const response = await this._httpClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async sendCustomGCodeCommand(printer, commandString, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(printer, this.apiPrinterCustomCommand, {
      command: commandString
    });
    const response = await this._httpClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   * @param printer
   * @param commandData command: start, cancel, restart
   * @param responseOptions
   * @returns {Promise<*|{data: *, status: *}>}
   */
  async sendJobCommand(printer, commandData, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(printer, this.apiJob, commandData);
    const response = await this._httpClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async getSettings(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async updateFirmwareUpdaterSettings(printer, firmwareUpdateConfig, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
    const settingPatch = this.pluginFirmwareUpdaterSettings(firmwareUpdateConfig);
    const response = await this._httpClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async setGCodeAnalysis(printer, { enabled }, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
    const settingPatch = this.gcodeAnalysisSetting(enabled);
    const response = await this._httpClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async getAdminUserOrDefault(printer) {
    const data = await this.getUsers(printer);

    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  async getUsers(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiUsers);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFiles(printer, recursive = false, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiGetFiles(recursive));
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFile(printer, path, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async createFolder(printer, path, foldername, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFilesLocation);

    const formData = new FormData();
    formData.append("path", path);
    formData.append("foldername", foldername);

    const headers = {
      ...options.headers,
      ...formData.getHeaders(),
      "Content-Length": formData.getLengthSync()
    };

    const response = await this._httpClient.post(url, formData, {
      headers
    });

    return processResponse(response, responseOptions);
  }

  async moveFileOrFolder(printer, path, destination, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const command = this.moveFileCommand(destination);
    const response = await this._httpClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async selectPrintFile(printer, path, print, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const command = this.selectCommand(print);
    const response = await this._httpClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async uploadFileAsMultiPart(printer, fileStreamOrBuffer, commands, token, responseOptions) {
    const { url, options } = this._prepareRequest(
      printer,
      this.apiFilesLocation,
      null,
      multiPartContentType
    );

    const formData = new FormData();
    if (commands.select) {
      formData.append("select", "true");
    }
    if (commands.print) {
      formData.append("print", "true");
    }

    let source = fileStreamOrBuffer.buffer;
    const isPhysicalFile = !source;
    if (!source) {
      source = fs.createReadStream(fileStreamOrBuffer.path);
    }
    formData.append("file", source, { filename: fileStreamOrBuffer.originalname });

    try {
      const headers = {
        ...options.headers,
        ...formData.getHeaders()
      };

      const response = await got
        .post(url, {
          body: formData,
          headers
        })
        .on("uploadProgress", (p) => {
          if (token) {
            this._eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, p);
          }
        });

      // Cleanup
      if (isPhysicalFile) {
        fs.unlinkSync(fileStreamOrBuffer.path);
      }

      return await processGotResponse(response, responseOptions);
    } catch (e) {
      this._eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, { failed: true }, e);
      let data;
      try {
        data = JSON.parse(e.response?.body);
      } catch {
        data = e.response?.body;
      }
      throw new ExternalServiceError({
        error: e.message,
        statusCode: e.response?.statusCode,
        data,
        success: false,
        stack: e.stack
      });
    }
  }

  // TODO implement when UI is ready, preferably using websocket stream and timing
  // async getSoftwareUpdateCheck(printer, responseOptions) {
  //   const { url, options } = this._prepareRequest(printer, this.pluginSoftwareUpdateCheck);
  //
  //   const response = await this._httpClient.get(url, options);
  //   return processResponse(response, responseOptions);
  // }

  async deleteFileOrFolder(printer, path, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const response = await this._httpClient.delete(url, options);
    return processResponse(response, responseOptions);
  }

  async getConnection(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiConnection);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPrinterProfiles(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPrinterProfiles);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Based on https://github.com/OctoPrint/OctoPrint/blob/f430257d7072a83692fc2392c683ed8c97ae47b6/src/octoprint/plugins/softwareupdate/__init__.py#L1265
   * @param printer
   * @param targets
   * @param responseOptions
   * @returns {Promise<{data, status}|*>}
   */
  async postSoftwareUpdate(printer, targets, responseOptions) {
    const { url, options } = this._prepareJsonRequest(printer, this.pluginSoftwareUpdateUpdate, {
      targets
    });

    const response = await this._httpClient.post(url, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Only queries OS, pip and plugin information (quickest call)
   * @param printer
   * @param responseOptions
   * @returns {Promise<{data, status}|*>}
   */
  async getPluginManagerPlugins(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.pluginManagerPlugins);

    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginManagerPlugin(printer, pluginName, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.pluginManagerPlugin(pluginName));

    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async postApiPluginManagerCommand(printer, pluginCommand, pluginUrl, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPluginManager);
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    const response = await this._httpClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async postPluginFirmwareUpdateFlash(
    currentPrinterId,
    printer,
    hardwareFlashCommand,
    firmwarePath,
    responseOptions
  ) {
    const { url, options } = this._prepareRequest(
      printer,
      this.pluginFirmwareUpdaterFlash,
      null,
      multiPartContentType
    );

    const formData = new FormData();
    formData.append("port", "/dev/op2");
    formData.append("profile", "default");
    const filename = path.basename(firmwarePath);
    const fileReadStream = fs.createReadStream(firmwarePath);
    formData.append("file", fileReadStream, { filename });

    try {
      const headers = {
        ...options.headers,
        ...formData.getHeaders()
      };

      const response = await got
        .post(url, {
          body: formData,
          headers
        })
        .on("uploadProgress", (p) => {
          if (currentPrinterId) {
            this._eventEmitter2.emit(
              `${firmwareFlashUpload(currentPrinterId)}`,
              currentPrinterId,
              p
            );
          }
        });

      return await processGotResponse(response, responseOptions);
    } catch (e) {
      this._eventEmitter2.emit(
        `${uploadProgressEvent(currentPrinterId)}`,
        currentPrinterId,
        { failed: true },
        e
      );
      let data;
      try {
        data = JSON.parse(e.response?.body);
      } catch {
        data = e.response?.body;
      }
      throw new ExternalServiceError({
        error: e.message,
        statusCode: e.response?.statusCode,
        data,
        success: false,
        stack: e.stack
      });
    }
  }

  async getPluginFirmwareUpdateStatus(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.pluginFirmwareUpdaterStatus);

    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Does not require printer login, much faster, requires internet connectivity
   * @param responseOptions
   * @returns {Promise<{data, status}|*>}
   */
  async fetchOctoPrintPlugins(responseOptions) {
    const { url, options } = this._prepareAnonymousRequest(pluginRepositoryUrl);

    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getSystemInfo(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSystemInfo);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getSystemCommands(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSystemCommands);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async postSystemRestartCommand(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSystemRestartCommand);
    const response = await this._httpClient.post(url, options);
    return processResponse(response, responseOptions);
  }

  async getSoftwareUpdateCheck(printer, force, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSoftwareUpdateCheck(force));
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginPiSupport(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPluginPiSupport);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async deleteTimeLapse(printer, fileName, responseOptions) {
    const path = `${this.apiTimelapse}/${fileName}`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this._httpClient.delete(url, options);
    return processResponse(response, responseOptions);
  }

  async listUnrenderedTimeLapses(printer, responseOptions) {
    const path = `${this.apiTimelapse}?unrendered=true`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async listProfiles(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiProfiles);
    const response = await this._httpClient.get(url, options);
    return processResponse(response, responseOptions);
  }
}

module.exports = OctoPrintApiService;
