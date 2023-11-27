import fs from "fs";
import path from "path";
import FormData from "form-data";
import got from "got";
import { multiPartContentType, pluginRepositoryUrl } from "./constants/octoprint-service.constants";
import { processGotResponse, processResponse } from "./utils/api.utils";
import { firmwareFlashUploadEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { OctoPrintRoutes } from "./octoprint-api.routes";
import { AxiosStatic } from "axios";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { IdType } from "@/shared.constants";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class OctoPrintApiService extends OctoPrintRoutes {
  eventEmitter2: EventEmitter2;
  protected axiosClient: AxiosStatic;
  protected logger: LoggerService;

  constructor({
    settingsStore,
    httpClient,
    loggerFactory,
    eventEmitter2,
  }: {
    settingsStore: SettingsStore;
    httpClient: AxiosStatic;
    loggerFactory: ILoggerFactory;
    eventEmitter2: EventEmitter2;
  }) {
    super({ settingsStore });
    this.axiosClient = httpClient;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoPrintApiService.name);
  }

  async login(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiLogin);
    const response = await this.axiosClient.post(url, {}, options);
    return processResponse(response, responseOptions);
  }

  async sendConnectionCommand(login: LoginDto, commandData, responseOptions?: any) {
    const { url, options, data } = this._prepareJsonRequest(login, this.apiConnection, commandData);
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async sendCustomGCodeCommand(login: LoginDto, commandString: string, responseOptions?: any) {
    const { url, options, data } = this._prepareJsonRequest(login, this.apiPrinterCustomCommand, {
      command: commandString,
    });
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   */
  async sendJobCommand(login: LoginDto, commandData, responseOptions?: any) {
    const { url, options, data } = this._prepareJsonRequest(login, this.apiJob, commandData);
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async sendBedTempCommand(login: LoginDto, targetTemp, responseOptions?: any) {
    const { url, options, data } = this._prepareJsonRequest(login, this.apiPrinterBed, this.getBedTargetCommand(targetTemp));
    const response = await this.axiosClient.post(url, data, options);
    return processResponse(response, responseOptions);
  }

  async getSettings(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSettingsPart);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async updatePrinterNameSetting(login: LoginDto, printerName: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.printerNameSetting(printerName);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async updateFirmwareUpdaterSettings(login: LoginDto, firmwareUpdateConfig: any, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.pluginFirmwareUpdaterSettings(firmwareUpdateConfig);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async setGCodeAnalysis(login: LoginDto, enabled: boolean, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.gcodeAnalysisSetting(enabled);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return processResponse(response, responseOptions);
  }

  async getAdminUserOrDefault(login: LoginDto) {
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
  async getUsers(login, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiUsers);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFiles(login: LoginDto, recursive = false, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiGetFiles(recursive));
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getFile(login: LoginDto, path: string, responseOptions?: any) {
    const pathUrl = this.apiFile(path);
    const { url, options } = this._prepareRequest(login, pathUrl);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async createFolder(login: LoginDto, path: string, foldername: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiFilesLocation);

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

  async moveFileOrFolder(login: LoginDto, path: string, destination: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiFile(path));
    const command = this.moveFileCommand(destination);
    const response = await this.axiosClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async selectPrintFile(login: LoginDto, path: string, print, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiFile(path));
    const command = this.selectCommand(print);
    const response = await this.axiosClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async uploadFileAsMultiPart(login: LoginDto, fileStreamOrBuffer, commands: any, token: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiFilesLocation, null, multiPartContentType);

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
  // async getSoftwareUpdateCheck(login: LoginDto, responseOptions) {
  //   const { url, options } = this._prepareRequest(printer, this.pluginSoftwareUpdateCheck);
  //
  //   const response = await this.axiosClient.get(url, options);
  //   return processResponse(response, responseOptions);
  // }

  async deleteFileOrFolder(login: LoginDto, path: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiFile(path));
    const response = await this.axiosClient.delete(url, options);
    return processResponse(response, responseOptions);
  }

  async getConnection(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiConnection);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPrinterProfiles(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiPrinterProfiles);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Based on https://github.com/OctoPrint/OctoPrint/blob/f430257d7072a83692fc2392c683ed8c97ae47b6/src/octoprint/plugins/softwareupdate/__init__.py#L1265
   */
  async postSoftwareUpdate(login: LoginDto, targets, responseOptions?: any) {
    const { url, options } = this._prepareJsonRequest(login, this.pluginSoftwareUpdateUpdate, {
      targets,
    });

    const response = await this.axiosClient.post(url, {}, options);
    return processResponse(response, responseOptions);
  }

  async getPluginManagerPlugins(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginManagerPlugins);

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginManagerPlugin(login: LoginDto, pluginName: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginManagerPlugin(pluginName));

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async postApiPluginManagerCommand(login: LoginDto, pluginCommand: string, pluginUrl: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiPluginManager);
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    const response = await this.axiosClient.post(url, command, options);
    return processResponse(response, responseOptions);
  }

  async postPluginFirmwareUpdateFlash(currentPrinterId: IdType, login: LoginDto, firmwarePath: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginFirmwareUpdaterFlash, null, multiPartContentType);

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

  async getPluginFirmwareUpdateStatus(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginFirmwareUpdaterStatus);

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  /**
   * Does not require printer login, much faster, requires internet connectivity
   */
  async fetchOctoPrintPlugins(responseOptions?: any) {
    const { url, options } = this._prepareAnonymousRequest(pluginRepositoryUrl);

    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getSystemInfo(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSystemInfo);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getSystemCommands(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSystemCommands);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async postSystemRestartCommand(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSystemRestartCommand);
    const response = await this.axiosClient.post(url, {}, options);
    return processResponse(response, responseOptions);
  }

  async getSoftwareUpdateCheck(login: LoginDto, force: boolean, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiSoftwareUpdateCheck(force));
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginPiSupport(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiPluginPiSupport);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async deleteTimeLapse(login: LoginDto, fileName: string, responseOptions?: any) {
    const path = `${this.apiTimelapse}/${fileName}`;
    const { url, options } = this._prepareRequest(login, path);
    const response = await this.axiosClient.delete(url, options);
    return processResponse(response, responseOptions);
  }

  async listUnrenderedTimeLapses(login: LoginDto, responseOptions?: any) {
    const path = `${this.apiTimelapse}?unrendered=true`;
    const { url, options } = this._prepareRequest(login, path);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async listProfiles(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.apiProfiles);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getBackupOverview(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupIndex);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async getBackups(login: LoginDto, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.axiosClient.get(url, options);
    return processResponse(response, responseOptions);
  }

  async createBackup(login: LoginDto, excludeArray: string[], responseOptions?: any) {
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

  async getDownloadBackupStream(login: LoginDto, filename: string) {
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

  async forwardRestoreBackupFileStream(login: LoginDto, buffer) {
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

  async deleteBackup(login: LoginDto, filename: string, responseOptions?: any) {
    const { url, options } = this._prepareRequest(login, this.pluginBackupFile(filename));
    const response = await this.axiosClient.delete(url, options);
    return processResponse(response, responseOptions);
  }
}
