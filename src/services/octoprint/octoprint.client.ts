import fs, { createReadStream, ReadStream } from "fs";
import path from "path";
import FormData from "form-data";
import { multiPartContentType, pluginRepositoryUrl } from "./constants/octoprint-service.constants";
import { firmwareFlashUploadEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { OctoprintRoutes } from "./octoprint-api.routes";
import axios, { AxiosInstance, AxiosPromise } from "axios";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { IdType } from "@/shared.constants";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { normalizePrinterFile } from "@/services/octoprint/utils/file.utils";
import { ConnectionDto } from "@/services/octoprint/dto/connection/connection.dto";
import { captureException } from "@sentry/node";
import { OP_LoginDto } from "@/services/octoprint/dto/auth/login.dto";
import { VersionDto } from "@/services/octoprint/dto/server/version.dto";
import { ServerDto } from "@/services/octoprint/dto/server/server.dto";
import { UserListDto } from "@/services/octoprint/dto/access/user-list.dto";
import { OctoprintFilesResponseDto } from "@/services/octoprint/dto/files/octoprint-files-response.dto";
import { CurrentUserDto } from "@/services/octoprint/dto/auth/current-user.dto";
import { CurrentJobDto } from "@/services/octoprint/dto/job/current-job.dto";
import { SettingsDto } from "@/services/octoprint/dto/settings/settings.dto";
import { CurrentPrinterStateDto } from "@/services/octoprint/dto/printer/current-printer-state.dto";

type TAxes = "x" | "y" | "z";

/**
 * OctoPrint REST API
 * https://docs.octoprint.org/en/master/api/index.html
 */
export class OctoprintClient extends OctoprintRoutes {
  eventEmitter2: EventEmitter2;
  protected httpClient: AxiosInstance;
  protected logger: LoggerService;

  constructor({
    settingsStore,
    httpClient,
    loggerFactory,
    eventEmitter2,
  }: {
    settingsStore: SettingsStore;
    httpClient: AxiosInstance;
    loggerFactory: ILoggerFactory;
    eventEmitter2: EventEmitter2;
  }) {
    super({ settingsStore });
    this.httpClient = httpClient;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoprintClient.name);
  }

  async getApiVersion(login: LoginDto, timeout?: number): AxiosPromise<VersionDto> {
    const { url, options } = this.prepareRequest(login, this.apiVersion, timeout);
    return await this.httpClient.get<VersionDto>(url, options);
  }

  async getServer(login: LoginDto): AxiosPromise<ServerDto> {
    const { url, options } = this.prepareRequest(login, this.apiServer);
    return await this.httpClient.get<ServerDto>(url, options);
  }

  async login(login: LoginDto): AxiosPromise<OP_LoginDto> {
    const { url, options } = this.prepareRequest(login, this.apiLogin);
    return await this.httpClient.post<OP_LoginDto>(url, {}, options);
  }

  async sendConnectionCommand(login: LoginDto, commandData: any) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiConnection, commandData);
    await this.httpClient.post<void>(url, data, options);
  }

  async sendPrintHeadJogCommand(login: LoginDto, amounts: { x?: number; y?: number; z?: number; speed?: number }) {
    const axesToHome: Record<TAxes, number> = {
      x: amounts.x ?? 0,
      y: amounts.y ?? 0,
      z: amounts.z ?? 0,
    };
    const commandData = {
      command: "jog",
      ...axesToHome,
    };

    return this.sendPrintHeadCommand(login, commandData);
  }

  async sendPrintHeadHomeCommand(login: LoginDto, axes: { x?: boolean; y?: boolean; z?: boolean }) {
    const axesToHome: string[] = [...(axes.x ? ["x"] : []), ...(axes.y ? ["y"] : []), ...(axes.z ? ["z"] : [])];
    const commandData = {
      command: "home",
      axes: axesToHome,
    };
    return this.sendPrintHeadCommand(login, commandData);
  }

  /**
   * Ability to jog, home or set feedrate
   */
  async sendPrintHeadCommand(login: LoginDto, commandData: any) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiPrinterHead, commandData);
    const response = await this.httpClient.post(url, data, options);
    return response?.data;
  }

  async sendCustomGCodeCommand(login: LoginDto, commandString: string) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiPrinterCustomCommand, {
      command: commandString,
    });
    const response = await this.httpClient.post(url, data, options);
    return response?.data;
  }

  async getJob(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiJob);
    const response = await this.httpClient.get(url, options);
    return response?.data as CurrentJobDto;
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   */
  async sendJobCommand(login: LoginDto, commandData: any) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiJob, commandData);
    const response = await this.httpClient.post(url, data, options);
    return response?.data;
  }

  async sendBedTempCommand(login: LoginDto, targetTemp: number) {
    const { url, options, data } = this.prepareJsonRequest(login, this.apiPrinterBed, this.getBedTargetCommand(targetTemp));
    const response = await this.httpClient.post(url, data, options);
    return response?.data;
  }

  async getSettings(login: LoginDto): Promise<SettingsDto> {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const response = await this.httpClient.get<SettingsDto>(url, options);
    return response?.data;
  }

  async updatePrinterNameSetting(login: LoginDto, printerName: string) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.printerNameSetting(printerName);
    const response = await this.httpClient.post(url, settingPatch, options);
    return response?.data;
  }

  async updateFirmwareUpdaterSettings(login: LoginDto, firmwareUpdateConfig: any) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.pluginFirmwareUpdaterSettings(firmwareUpdateConfig);
    const response = await this.httpClient.post(url, settingPatch, options);
    return response?.data;
  }

  async setGCodeAnalysis(login: LoginDto, enabled: boolean) {
    const { url, options } = this.prepareRequest(login, this.apiSettingsPart);
    const settingPatch = this.gcodeAnalysisSetting(enabled);
    const response = await this.httpClient.post(url, settingPatch, options);
    return response?.data;
  }

  async getCurrentUser(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiCurrentUser);
    const response = await this.httpClient.get<CurrentUserDto>(url, options);
    return response?.data;
  }

  async getAdminUserOrDefault(login: LoginDto): Promise<string> {
    const currentUser = await this.getCurrentUser(login);
    return currentUser?.name;
  }

  async getUsers(login: LoginDto): Promise<UserListDto> {
    const { url, options } = this.prepareRequest(login, this.apiUsers);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getLocalFiles(login: LoginDto, recursive = false) {
    const { url, options } = this.prepareRequest(login, this.apiGetFiles(recursive));
    const response = await this.httpClient.get<OctoprintFilesResponseDto>(url, options);

    return (
      // Filter out folders
      response?.data?.files
        ?.filter((f) => f.date)
        .map((f) => {
          return normalizePrinterFile(f);
        }) || []
    );
  }

  async getFile(login: LoginDto, path: string) {
    const pathUrl = this.apiFile(path);
    const { url, options } = this.prepareRequest(login, pathUrl);
    const response = await this.httpClient.get(url, options);
    try {
      return normalizePrinterFile(response?.data);
    } catch (e) {
      captureException(e);
      this.logger.error("File was empty or normalization failed");
      return;
    }
  }

  async downloadFile(login: LoginDto, path: string): AxiosPromise<NodeJS.ReadableStream> {
    const pathUrl = this.downloadFileLocal(path);
    const { url, options } = this.prepareRequest(login, pathUrl);

    return await this.httpClient.get(url, {
      responseType: "stream",
      ...options,
    });
  }

  getFileChunk(login: LoginDto, filePath: string, startBytes: number, endBytes: number) {
    const pathUrl = this.downloadFileLocal(filePath);
    const { url, options } = this.prepareRequest(login, pathUrl);
    return this.httpClient.get<string>(url, {
      headers: {
        ...options.headers,
        Range: `bytes=${startBytes}-${endBytes}`,
      },
      timeout: options.timeout,
    });
  }

  async createFolder(login: LoginDto, path: string, foldername: string) {
    const { url, options } = this.prepareRequest(login, this.apiFilesLocal);

    const formData = new FormData();
    formData.append("path", path);
    formData.append("foldername", foldername);

    const headers = {
      ...options.headers,
      ...formData.getHeaders(),
      "Content-Length": formData.getLengthSync(),
    };

    const response = await this.httpClient.post(url, formData, {
      headers,
    });

    return response?.data;
  }

  async moveFileOrFolder(login: LoginDto, path: string, destination: string) {
    const { url, options } = this.prepareRequest(login, this.apiFile(path));
    const command = this.moveFileCommand(destination);
    const response = await this.httpClient.post(url, command, options);
    return response?.data;
  }

  async postSelectPrintFile(login: LoginDto, path: string, print: boolean) {
    const { url, options } = this.prepareRequest(login, this.apiFile(path));
    const command = this.selectCommand(print);
    await this.httpClient.post<void>(url, command, options);
  }

  async uploadFileAsMultiPart(login: LoginDto, multerFileOrBuffer: Buffer | Express.Multer.File, commands: any, token: string) {
    const { url, options } = this.prepareRequest(login, this.apiFilesLocal, null, multiPartContentType);

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
    } catch (e: any) {
      this.eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, { failed: true }, e);
      let data;
      try {
        data = JSON.parse(e.response?.body);
      } catch {
        data = e.response?.body;
      }
      throw new ExternalServiceError(
        {
          error: e.message,
          statusCode: e.response?.statusCode,
          data,
          success: false,
          stack: e.stack,
        },
        "OctoPrint"
      );
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
    const response = await this.httpClient.delete(url, options);
    return response?.data;
  }

  async getPrinterCurrent(login: LoginDto, history: boolean, limit?: number, exclude?: ("temperature" | "sd" | "state")[]) {
    const pathUrl = this.apiPrinterCurrent(history, limit, exclude);
    const { url, options } = this.prepareRequest(login, pathUrl);
    return await this.httpClient.get<CurrentPrinterStateDto>(url, options);
  }

  async getConnection(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiConnection);
    const response = await this.httpClient.get(url, options);
    return response?.data as ConnectionDto;
  }

  async getPrinterProfiles(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiPrinterProfiles);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  /**
   * Based on https://github.com/OctoPrint/OctoPrint/blob/f430257d7072a83692fc2392c683ed8c97ae47b6/src/octoprint/plugins/softwareupdate/__init__.py#L1265
   */
  async postSoftwareUpdate(login: LoginDto, targets: string[]) {
    const { url, options } = this.prepareJsonRequest(login, this.pluginSoftwareUpdateUpdate, {
      targets,
    });

    const response = await this.httpClient.post(url, {}, options);
    return response?.data;
  }

  async getPluginManagerPlugins(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginManagerPlugins);

    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getPluginManagerPlugin(login: LoginDto, pluginName: string) {
    const { url, options } = this.prepareRequest(login, this.pluginManagerPlugin(pluginName));

    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async postApiPluginManagerCommand(login: LoginDto, pluginCommand: string, pluginUrl: string) {
    const { url, options } = this.prepareRequest(login, this.apiPluginManager);
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    const response = await this.httpClient.post(url, command, options);
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

      const response = await this.httpClient.post(url, {
        body: formData,
        headers,
        uploadProgress: (p: any) => {
          if (currentPrinterId) {
            this.eventEmitter2.emit(`${firmwareFlashUploadEvent(currentPrinterId)}`, currentPrinterId, p);
          }
        },
      });

      return response?.data;
    } catch (e: any) {
      this.eventEmitter2.emit(`${uploadProgressEvent(currentPrinterId)}`, currentPrinterId, { failed: true }, e);
      let data;
      try {
        data = JSON.parse(e.response?.body);
      } catch {
        data = e.response?.body;
      }
      throw new ExternalServiceError(
        {
          error: e.message,
          statusCode: e.response?.statusCode,
          data,
          success: false,
          stack: e.stack,
        },
        "OctoPrint"
      );
    }
  }

  async getPluginFirmwareUpdateStatus(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginFirmwareUpdaterStatus);

    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  /**
   * Does not require printer login, much faster, requires internet connectivity
   */
  async fetchOctoPrintPlugins() {
    const { url, options } = this.prepareAnonymousRequest(pluginRepositoryUrl);

    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getSystemInfo(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiSystemInfo);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getSystemCommands(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiSystemCommands);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async postServerRestartCommand(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiServerRestartCommand);
    const response = await this.httpClient.post(url, {}, options);
    return response?.data;
  }

  async getSoftwareUpdateCheck(login: LoginDto, force: boolean) {
    const { url, options } = this.prepareRequest(login, this.apiSoftwareUpdateCheck(force));
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getPluginPiSupport(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiPluginPiSupport);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async deleteTimeLapse(login: LoginDto, fileName: string) {
    const path = `${this.apiTimelapse}/${fileName}`;
    const { url, options } = this.prepareRequest(login, path);
    const response = await this.httpClient.delete(url, options);
    return response?.data;
  }

  async listUnrenderedTimeLapses(login: LoginDto) {
    const path = `${this.apiTimelapse}?unrendered=true`;
    const { url, options } = this.prepareRequest(login, path);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async listProfiles(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.apiProfiles);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getBackupOverview(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupIndex);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async getBackups(login: LoginDto) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.httpClient.get(url, options);
    return response?.data;
  }

  async createBackup(login: LoginDto, excludeArray: string[]) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupEndpoint);
    const response = await this.httpClient.post(
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
    const response = await this.httpClient
      .get(url, {
        responseType: "stream",
        ...options,
      })
      .catch((e) => {
        throw new ExternalServiceError(
          {
            error: e.message,
            statusCode: e.response?.statusCode,
            success: false,
            stack: e.stack,
          },
          "OctoPrint"
        );
      });
    return response.data;
  }

  async forwardRestoreBackupFileStream(login: LoginDto, buffer: Buffer) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupFileRestore, null, multiPartContentType);
    const formData = new FormData();
    formData.append("file", buffer, { filename: "op-fdmm-restore.zip" });
    const response = await this.httpClient
      .post(url, formData, {
        headers: {
          ...options.headers,
          ...formData.getHeaders(),
          // "Content-Type": "application/octet-stream",
        },
      })
      .catch((e) => {
        throw new ExternalServiceError(
          {
            error: e.message,
            statusCode: e.response?.statusCode,
            success: false,
            stack: e.stack,
          },
          "OctoPrint"
        );
      });
    return response?.data;
  }

  async deleteBackup(login: LoginDto, filename: string) {
    const { url, options } = this.prepareRequest(login, this.pluginBackupFile(filename));
    const response = await this.httpClient.delete(url, options);
    return response?.data;
  }
}
