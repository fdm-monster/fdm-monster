import fs from "fs";
import path from "path";
import FormData from "form-data";
import got from "got";
import { multiPartContentType, pluginRepositoryUrl } from "./constants/octoprint-service.constants";
import { processResponse, processGotResponse } from "./utils/api.utils";
import { uploadProgressEvent, firmwareFlashUploadEvent } from "../../constants/event.constants";
import { ExternalServiceError } from "../../exceptions/runtime.exceptions";
import { OctoPrintRoutes } from "./octoprint-api.routes";

export class OctoPrintApiService extends OctoPrintRoutes {
  /**
   * @type {AxiosInstance}
   */
  axiosClient;
  /**
   * @type {EventEmitter2}
   */
  eventEmitter2;
  /**
   * @type {LoggerService}
   * @private
   */
  logger;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    super({ settingsStore });
    this.axiosClient = httpClient;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoPrintApiService.name);
  }

  /**
   *
   * @param {LoginDto} login
   * @param responseOptions
   * @returns {Promise<{data, status}|*>}
   */
  async login(login, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.apiLogin);
    const response = await this.axiosClient.post(url, {}, options);
    return processResponse(response, responseOptions);
  }

  async sendConnectionCommand(printer, commandData, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(printer, this.apiConnection, commandData);
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async sendCustomGCodeCommand(printerLogin, commandString, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(printerLogin, this.apiPrinterCustomCommand, {
      command: commandString,
    });
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   * @param printer
   * @param commandData command: start, cancel, restart
   * @param responseOptions
   * @returns {Promise<*|{data: *, status: *}>}
   */
  async sendJobCommand(printerLogin, commandData, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(printerLogin, this.apiJob, commandData);
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async sendBedTempCommand(printerLogin, targetTemp, responseOptions) {
    const { url, options, data } = this._prepareJsonRequest(
      printerLogin,
      this.apiPrinterBed,
      this.getBedTargetCommand(targetTemp)
    );
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async getSettings(printerLogin, responseOptions) {
    const { url, options } = this._prepareRequest(printerLogin, this.apiSettingsPart);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async updatePrinterNameSetting(printerLogin, printerName, responseOptions) {
    const { url, options } = this._prepareRequest(printerLogin, this.apiSettingsPart);
    const settingPatch = this.printerNameSetting(printerName);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async updateFirmwareUpdaterSettings(printer, firmwareUpdateConfig, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
    const settingPatch = this.pluginFirmwareUpdaterSettings(firmwareUpdateConfig);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async setGCodeAnalysis(printer, { enabled }, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSettingsPart);
    const settingPatch = this.gcodeAnalysisSetting(enabled);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  /**
   * @param {LoginDto} login
   * @returns {Promise<string>}
   */
  async getAdminUserOrDefault(login) {
    const data = await this.getUsers(login);

    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data.users)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  /**
   * @param  {LoginDto} login
   * @param responseOptions
   * @returns {Promise<{data, status}|*>}
   */
  async getUsers(login, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.apiUsers);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFiles(printer, recursive = false, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiGetFiles(recursive));
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFile(printer, path, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const response = await this.axiosClient.get(url, options);
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
      "Content-Length": formData.getLengthSync(),
    };

    const response = await this.axiosClient.post(url, formData, {
      headers,
    });

    return processResponse(response, responseOptions);
  }

  async moveFileOrFolder(printer, path, destination, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const command = this.moveFileCommand(destination);
    const response = await this.axiosClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async selectPrintFile(printer, path, print, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const command = this.selectCommand(print);
    const response = await this.axiosClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async uploadFileAsMultiPart(printer, fileStreamOrBuffer, commands, token, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFilesLocation, null, multiPartContentType);

    const formData = new FormData();
    if (commands.select) {
      formData.append("select", "true");
    }
    if (commands.print) {
      formData.append("print", "true");
    }

    let source = fileStreamOrBuffer.buffer;
    const isPhysicalFile = !source;
    if (isPhysicalFile) {
      source = fs.createReadStream(fileStreamOrBuffer.path);
    }
    formData.append("file", source, { filename: fileStreamOrBuffer.originalname });

    try {
      const headers = {
        ...options.headers,
        ...formData.getHeaders(),
      };

      const response = await got
        .post(url, {
          body: formData,
          headers,
        })
        .on("uploadProgress", (p) => {
          if (token) {
            this.eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, p);
          }
        });

      // Cleanup
      if (isPhysicalFile) {
        fs.unlinkSync(fileStreamOrBuffer.path);
      }

      return await processGotResponse(response, responseOptions);
    } catch (e) {
      this.eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, { failed: true }, e);
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
        stack: e.stack,
      });
    }
  }

  // TODO implement when UI is ready, preferably using websocket stream and timing
  // async getSoftwareUpdateCheck(printer, responseOptions) {
  //   const { url, options } = this._prepareRequest(printer, this.pluginSoftwareUpdateCheck);
  //
  //   const response = await this.axiosClient.get(url, options);
  //   return processResponse(response, responseOptions);
  // }

  async deleteFileOrFolder(printer, path, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const response = await this.axiosClient.delete(url, options);
    return processResponse(response, responseOptions);
  }

  async getConnection(login, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.apiConnection);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPrinterProfiles(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPrinterProfiles);
    const response = await this.axiosClient.get(url, options);
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
      targets,
    });

    const response = await this.axiosClient.post(url, {}, options);
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

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginManagerPlugin(printer, pluginName, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.pluginManagerPlugin(pluginName));

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async postApiPluginManagerCommand(printer, pluginCommand, pluginUrl, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPluginManager);
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    const response = await this.axiosClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async postPluginFirmwareUpdateFlash(currentPrinterId, printer, firmwarePath, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.pluginFirmwareUpdaterFlash, null, multiPartContentType);

    const formData = new FormData();
    formData.append("port", "/dev/op2");
    formData.append("profile", "default");
    const filename = path.basename(firmwarePath);
    const fileReadStream = fs.createReadStream(firmwarePath);
    formData.append("file", fileReadStream, { filename });

    try {
      const headers = {
        ...options.headers,
        ...formData.getHeaders(),
      };

      const response = await got
        .post(url, {
          body: formData,
          headers,
        })
        .on("uploadProgress", (p) => {
          if (currentPrinterId) {
            this.eventEmitter2.emit(`${firmwareFlashUploadEvent(currentPrinterId)}`, currentPrinterId, p);
          }
        });

      return await processGotResponse(response, responseOptions);
    } catch (e) {
      this.eventEmitter2.emit(`${uploadProgressEvent(currentPrinterId)}`, currentPrinterId, { failed: true }, e);
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
        stack: e.stack,
      });
    }
  }

  async getPluginFirmwareUpdateStatus(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.pluginFirmwareUpdaterStatus);

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Does not require printer login, much faster, requires internet connectivity
   * @param responseOptions
   * @returns {Promise<{data, status}|*>}
   */
  async fetchOctoPrintPlugins(responseOptions) {
    const { url, options } = this._prepareAnonymousRequest(pluginRepositoryUrl);

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getSystemInfo(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSystemInfo);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getSystemCommands(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSystemCommands);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async postSystemRestartCommand(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSystemRestartCommand);
    const response = await this.axiosClient.post(url, {}, options);
    return processResponse(response, responseOptions);
  }

  async getSoftwareUpdateCheck(printer, force, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiSoftwareUpdateCheck(force));
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginPiSupport(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiPluginPiSupport);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async deleteTimeLapse(printer, fileName, responseOptions) {
    const path = `${this.apiTimelapse}/${fileName}`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this.axiosClient.delete(url, options);
    return processResponse(response, responseOptions);
  }

  async listUnrenderedTimeLapses(printer, responseOptions) {
    const path = `${this.apiTimelapse}?unrendered=true`;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async listProfiles(printer, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiProfiles);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getBackupOverview(login, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupIndex);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getBackups(login, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async createBackup(login, excludeArray, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.axiosClient.post(
      url,
      {
        exclude: excludeArray,
      },
      options
    );
    return processResponse(response, responseOptions);
  }

  async getDownloadBackupStream(login, filename, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupFileDownload(filename));
    const response = await this.axiosClient
      .get(url, {
        responseType: "stream",
        ...options,
      })
      .catch((e) => {
        throw new ExternalServiceError({
          error: e.message,
          statusCode: e.response?.statusCode,
          success: false,
          stack: e.stack,
        });
      });
    return response.data;
  }

  async forwardRestoreBackupFileStream(login, buffer) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupFileRestore, null, multiPartContentType);
    const formData = new FormData();
    formData.append("file", buffer, { filename: "op-fdmm-restore.zip" });
    const response = await this.axiosClient
      .post(url, formData, {
        headers: {
          ...options.headers,
          ...formData.getHeaders(),
          // "Content-Type": "application/octet-stream",
        },
      })
      .catch((e) => {
        throw new ExternalServiceError({
          error: e.message,
          statusCode: e.response?.statusCode,
          success: false,
          stack: e.stack,
        });
      });
    return processResponse(response);
  }

  async deleteBackup(login, filename, responseOptions) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupFile(filename));
    const response = await this.axiosClient.delete(url, options);
    return processResponse(response, responseOptions);
  }
}
