import fs, { createReadStream, ReadStream } from "fs";
import path from "path";
import FormData from "form-data";
import { multiPartContentType, pluginRepositoryUrl } from "./constants/octoprint-service.constants";
import { firmwareFlashUploadEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { OctoPrintRoutes } from "./octoprint-api.routes";
import axios, { AxiosStatic } from "axios";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { IdType } from "@/shared.constants";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { OctoprintRawFilesResponseDto } from "@/services/octoprint/models/octoprint-file.dto";
import { normalizePrinterFile } from "@/services/octoprint/utils/file.utils";
import { errorSummary } from "@/utils/error.utils";

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

  async login(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiLogin);
    const response = await this.axiosClient.post(url, {}, options);
    return response?.data;
  }

  async sendConnectionCommand(login: LoginDto, commandData) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiConnection, commandData);
    const response = await this.axiosClient.post(url, data, options);
    return response?.data;
  }

  async sendCustomGCodeCommand(login: LoginDto, commandString: string) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiPrinterCustomCommand, {
      command: commandString,
    });
    const response = await this.axiosClient.post(url, data, options);
    return response?.data;
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   */
  async sendJobCommand(login: LoginDto, commandData) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiJob, commandData);
    const response = await this.axiosClient.post(url, data, options);
    return response?.data;
  }

  async sendBedTempCommand(login: LoginDto, targetTemp: number) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiPrinterBed, this.getBedTargetCommand(targetTemp));
    const response = await this.axiosClient.post(url, data, options);
    return response?.data;
  }

  async getSettings(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async updatePrinterNameSetting(login: LoginDto, printerName: string) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.printerNameSetting(printerName);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return response?.data;
  }

  async updateFirmwareUpdaterSettings(login: LoginDto, firmwareUpdateConfig: any) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.pluginFirmwareUpdaterSettings(firmwareUpdateConfig);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return response?.data;
  }

  async setGCodeAnalysis(login: LoginDto, enabled: boolean) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.gcodeAnalysisSetting(enabled);
    const response = await this.axiosClient.post(url, settingPatch, options);
    return response?.data;
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

  async getUsers(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiUsers);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getLocalFiles(login: LoginDto, recursive = false) {
    const { url, options } = this.prepareRequest(login, this.apiGetFiles(recursive));
    const response = await this.axiosClient.get<OctoprintRawFilesResponseDto>(url, options);

    return (
      response?.data?.files
        // Filter out folders
        .filter((f) => f.date)
        .map((f) => {
          return normalizePrinterFile(f);
        }) || []
    );
  }

  async getFile(login: LoginDto, path: string) {
    const pathUrl = this.apiFile(path);
    const { url, options } = this.prepareRequest(login, pathUrl);
    const response = await this.axiosClient.get(url, options);
    try {
      return normalizePrinterFile(response?.data);
    } catch (e) {
      this.logger.error(`File was empty or normalization failed ${errorSummary(e)}`);
      return;
    }
  }

  async createFolder(login: LoginDto, path: string, foldername: string) {
    const { url, options } = this.prepareRequest(login, this.apiFilesLocation);

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

    return response?.data;
  }

  async moveFileOrFolder(login: LoginDto, path: string, destination: string) {
    const { url, options } = this.prepareRequest(login, this.apiFile(path));
    const command = this.moveFileCommand(destination);
    const response = await this.axiosClient.post(url, command, options);
    return response?.data;
  }

  async selectPrintFile(login: LoginDto, path: string, print: boolean) {
    const { url, options } = this.prepareRequest(login, this.apiFile(path));
    const command = this.selectCommand(print);
    const response = await this.axiosClient.post(url, command, options);
    return response?.data;
  }

  async uploadFileAsMultiPart(login: LoginDto, multerFileOrBuffer: Buffer | Express.Multer.File, commands: any, token: string) {
    const { url, options } = this.prepareRequest(login, this.apiFilesLocation, null, multiPartContentType);

    const formData = new FormData();
    if (commands.select) {
      formData.append("select", "true");
    }
    if (commands.print) {
      formData.append("print", "true");
    }

    let source: ArrayBufferLike | ReadStream = (multerFileOrBuffer as Buffer).buffer;
    const isPhysicalFile = !source;
    if (isPhysicalFile) {
      source = createReadStream((multerFileOrBuffer as Express.Multer.File).path);
    }
    formData.append("file", source, { filename: (multerFileOrBuffer as Express.Multer.File).originalname });

    // Calculate the header that axios uses to determine progress
    const result: number = await new Promise<number>((resolve, reject) => {
      return formData.getLength((err, length) => {
        if (err) resolve(null);
        resolve(length);
      });
    });

    try {
      const headers = {
        ...options.headers,
        ...formData.getHeaders(),
        "Content-Length": result,
      };

      const response = await axios({
        method: "POST",
        url,
        data: formData,
        headers,
        onUploadProgress: (p) => {
          if (token) {
            this.eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, p);
          }
        },
      });

      // Cleanup if file exists on disk
      // if (isPhysicalFile) {
      //   fs.unlinkSync((fileStreamOrBuffer as Express.Multer.File).path);
      // }

      return response.data;
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
  // async getSoftwareUpdateCheck(login: LoginDto) {
  //   const { url, options } = this._prepareRequest(printer, this.pluginSoftwareUpdateCheck);
  //
  //   const response = await this.axiosClient.get(url, options);
  //   return response?.data;
  // }

  async deleteFileOrFolder(login: LoginDto, path: string) {
    const { url, options } = this.prepareRequest(login, this.apiFile(path));
    const response = await this.axiosClient.delete(url, options);
    return response?.data;
  }

  async getPrinterCurrent(login: LoginDto, history: boolean, limit?: number, exclude?: ("temperature" | "sd" | "state")[]) {
    const pathUrl = this.apiPrinterCurrent(history, limit, exclude);
    const { url, options } = this.prepareRequest(login, pathUrl);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }
  async getConnection(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiConnection);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getPrinterProfiles(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiPrinterProfiles);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  /**
   * Based on https://github.com/OctoPrint/OctoPrint/blob/f430257d7072a83692fc2392c683ed8c97ae47b6/src/octoprint/plugins/softwareupdate/__init__.py#L1265
   */
  async postSoftwareUpdate(login: LoginDto, targets) {
    const { url, options } = this.prepareJsonRequest(login, this.pluginSoftwareUpdateUpdate, {
      targets,
    });

    const response = await this.axiosClient.post(url, {}, options);
    return response?.data;
  }

  async getPluginManagerPlugins(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginManagerPlugins);

    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getPluginManagerPlugin(login: LoginDto, pluginName: string) {
    const { url, options } = this.prepareRequest(login, this.pluginManagerPlugin(pluginName));

    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async postApiPluginManagerCommand(login: LoginDto, pluginCommand: string, pluginUrl: string) {
    const { url, options } = this.prepareRequest(login, this.apiPluginManager);
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    const response = await this.axiosClient.post(url, command, options);
    return response?.data;
  }

  async postPluginFirmwareUpdateFlash(currentPrinterId: IdType, login: LoginDto, firmwarePath: string) {
    const { url, options } = this.prepareRequest(login, this.pluginFirmwareUpdaterFlash, null, multiPartContentType);

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

      const response = await this.axiosClient.post(url, {
        body: formData,
        headers,
        uploadProgress: (p: any) => {
          if (currentPrinterId) {
            this.eventEmitter2.emit(`${firmwareFlashUploadEvent(currentPrinterId)}`, currentPrinterId, p);
          }
        },
      });

      return response?.data;
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

  async getPluginFirmwareUpdateStatus(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginFirmwareUpdaterStatus);

    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  /**
   * Does not require printer login, much faster, requires internet connectivity
   */
  async fetchOctoPrintPlugins() {
    const { url, options } = this.prepareAnonymousRequest(pluginRepositoryUrl);

    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getSystemInfo(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiSystemInfo);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getSystemCommands(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiSystemCommands);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async postSystemRestartCommand(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiSystemRestartCommand);
    const response = await this.axiosClient.post(url, {}, options);
    return response?.data;
  }

  async getSoftwareUpdateCheck(login: LoginDto, force: boolean) {
    const { url, options } = this.prepareRequest(login, this.apiSoftwareUpdateCheck(force));
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getPluginPiSupport(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiPluginPiSupport);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async deleteTimeLapse(login: LoginDto, fileName: string) {
    const path = `${this.apiTimelapse}/${fileName}`;
    const { url, options } = this.prepareRequest(login, path);
    const response = await this.axiosClient.delete(url, options);
    return response?.data;
  }

  async listUnrenderedTimeLapses(login: LoginDto) {
    const path = `${this.apiTimelapse}?unrendered=true`;
    const { url, options } = this.prepareRequest(login, path);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async listProfiles(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiProfiles);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getBackupOverview(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupIndex);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async getBackups(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.axiosClient.get(url, options);
    return response?.data;
  }

  async createBackup(login: LoginDto, excludeArray: string[]) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.axiosClient.post(
      url,
      {
        exclude: excludeArray,
      },
      options
    );
    return response?.data;
  }

  async getDownloadBackupStream(login: LoginDto, filename: string) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupFileDownload(filename));
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

  async forwardRestoreBackupFileStream(login: LoginDto, buffer: Buffer) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupFileRestore, null, multiPartContentType);
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
    return response?.data;
  }

  async deleteBackup(login: LoginDto, filename: string) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupFile(filename));
    const response = await this.axiosClient.delete(url, options);
    return response?.data;
  }
}
