import fs, { createReadStream, ReadStream } from "fs";
import path from "path";
import { Readable } from "stream";
import FormData from "form-data";
import { pluginRepositoryUrl } from "./constants/octoprint-service.constants";
import { firmwareFlashUploadEvent, uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { OctoprintRoutes } from "./octoprint-api.routes";
import { AxiosError, AxiosPromise } from "axios";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { IdType } from "@/shared.constants";
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
import { HttpClientFactory } from "@/services/core/http-client.factory";
import { OctoprintHttpClientBuilder } from "@/services/octoprint/utils/octoprint-http-client.builder";
import { OctoprintFileDto } from "@/services/octoprint/dto/files/octoprint-file.dto";
import { OP_PluginDto } from "@/services/octoprint/dto/plugin.dto";

type TAxes = "x" | "y" | "z";

const AB = new Int32Array(new SharedArrayBuffer(4));
function sleep(t: number) {
  Atomics.wait(AB, 0, 0, Math.max(1, t | 0));
}

/**
 * OctoPrint REST API
 * https://docs.octoprint.org/en/master/api/index.html
 */
export class OctoprintClient extends OctoprintRoutes {
  eventEmitter2: EventEmitter2;
  protected httpClientFactory: HttpClientFactory;
  protected logger: LoggerService;

  constructor({
    httpClientFactory,
    loggerFactory,
    eventEmitter2,
  }: {
    httpClientFactory: HttpClientFactory;
    loggerFactory: ILoggerFactory;
    eventEmitter2: EventEmitter2;
  }) {
    super();
    this.httpClientFactory = httpClientFactory;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoprintClient.name);
  }

  async getApiVersion(login: LoginDto) {
    return await this.createClient(login).get<VersionDto>(this.apiVersion);
  }

  async getServer(login: LoginDto) {
    return await this.createClient(login).get<ServerDto>(this.apiServer);
  }

  async login(login: LoginDto) {
    return await this.createClient(login).post<OP_LoginDto>(this.apiLogin);
  }

  async sendConnectionCommand(login: LoginDto, commandData: any) {
    await this.createClient(login).post(this.apiConnection, commandData);
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
   * Ability to jog, home or set feed rate
   */
  async sendPrintHeadCommand(login: LoginDto, commandData: any) {
    await this.createClient(login).post(this.apiPrinterHead, commandData);
  }

  async sendCustomGCodeCommand(login: LoginDto, commandString: string) {
    await this.createClient(login).post(this.apiPrinterCustomCommand, {
      command: commandString,
    });
  }

  async getJob(login: LoginDto) {
    return await this.createClient(login).get<CurrentJobDto>(this.apiJob);
  }

  /**
   * Ability to start, cancel, restart, or pause a job
   */
  async sendJobCommand(login: LoginDto, commandData: any) {
    return await this.createClient(login).post(this.apiJob, commandData);
  }

  async sendBedTempCommand(login: LoginDto, targetTemp: number) {
    const data = this.getBedTargetCommand(targetTemp);
    return await this.createClient(login).post(this.apiPrinterBed, data);
  }

  async getSettings(login: LoginDto) {
    return await this.createClient(login).get<SettingsDto>(this.apiSettingsPart);
  }

  async updatePrinterNameSetting(login: LoginDto, printerName: string) {
    const settingPatch = this.printerNameSetting(printerName);
    return await this.createClient(login).post(this.apiSettingsPart, settingPatch);
  }

  async updateFirmwareUpdaterSettings(login: LoginDto, firmwareUpdateConfig: any) {
    const settingPatch = this.pluginFirmwareUpdaterSettings(firmwareUpdateConfig);
    return await this.createClient(login).post(this.apiSettingsPart, settingPatch);
  }

  async setGCodeAnalysis(login: LoginDto, enabled: boolean) {
    const settingPatch = this.gcodeAnalysisSetting(enabled);
    return await this.createClient(login).post(this.apiSettingsPart, settingPatch);
  }

  async getCurrentUser(login: LoginDto) {
    return await this.createClient(login).get<CurrentUserDto>(this.apiCurrentUser);
  }

  async getAdminUserOrDefault(login: LoginDto) {
    const currentUserResponse = await this.getCurrentUser(login);
    return currentUserResponse?.data?.name;
  }

  async getUsers(login: LoginDto) {
    return await this.createClient(login).get<UserListDto>(this.apiUsers);
  }

  async getLocalFiles(login: LoginDto, recursive = false) {
    const response = await this.createClient(login).get<OctoprintFilesResponseDto>(this.apiGetFiles(recursive));

    return (
      // Filter out folders
      response?.data?.files
        ?.filter((f) => f.date && f.type === "machinecode")
        .map((f) => {
          return normalizePrinterFile(f);
        }) || []
    );
  }

  async getFile(login: LoginDto, path: string) {
    const urlPath = this.apiFile(path);
    const response = await this.createClient(login).get<OctoprintFileDto>(urlPath);

    try {
      return normalizePrinterFile(response?.data);
    } catch (e) {
      captureException(e);
      this.logger.error("File was empty or normalization failed");
      return;
    }
  }

  async downloadFile(login: LoginDto, path: string): AxiosPromise<NodeJS.ReadableStream> {
    const urlPath = this.downloadFileLocal(path);

    return await this.createClient(login).get(urlPath, {
      responseType: "stream",
    });
  }

  async getFileChunk(login: LoginDto, filePath: string, startBytes: number, endBytes: number) {
    const pathUrl = this.downloadFileLocal(filePath);

    return await this.createClient(login, (o) =>
      o.withHeaders({
        Range: `bytes=${startBytes}-${endBytes}`,
      })
    ).get<string>(pathUrl);
  }

  async createFolder(login: LoginDto, path: string, foldername: string) {
    const formData = new FormData();
    formData.append("path", path);
    formData.append("foldername", foldername);

    const headers = {
      ...formData.getHeaders(),
      "Content-Length": formData.getLengthSync().toString(),
    };

    return await this.createClient(login, (o) => o.withHeaders(headers)).post(this.apiFilesLocal, formData);
  }

  async moveFileOrFolder(login: LoginDto, path: string, destination: string) {
    const command = this.moveFileCommand(destination);
    return await this.createClient(login).post(this.apiFile(path), command);
  }

  async postSelectPrintFile(login: LoginDto, path: string, print: boolean) {
    const command = this.selectCommand(print);
    await this.createClient(login).post(this.apiFile(path), command);
  }

  async uploadFileAsMultiPart(login: LoginDto, multerFileOrBuffer: Buffer | Express.Multer.File, commands: any, token: string) {
    const urlPath = this.apiFilesLocal;

    const formData = new FormData();
    if (commands.select) {
      formData.append("select", "true");
    }
    if (commands.print) {
      formData.append("print", "true");
    }

    let fileBuffer: ArrayBufferLike | ReadStream = (multerFileOrBuffer as Buffer).buffer;
    const filename = (multerFileOrBuffer as Express.Multer.File).originalname;
    let knownFileSize = (multerFileOrBuffer as Express.Multer.File).size;
    if (!fileBuffer) {
      const filePath = (multerFileOrBuffer as Express.Multer.File).path;
      const fileStream = createReadStream(filePath, { highWaterMark: 512 });
      knownFileSize = fs.statSync(filePath).size;

      const delayedStream = new Readable({
        read() {}, // No need to override read, we'll push manually
      });

      let uploaded = 0;
      let total = knownFileSize;
      fileStream.on("data", (chunk) => {
        fileStream.pause(); // Pause reading while we delay

        uploaded += chunk.length;

        // sleep(1);
        delayedStream.push(chunk);
        fileStream.resume(); // Resume after delay
        const progress = uploaded / total;
        console.log(`Upload file ${filename} - progress ${(100.0 * uploaded) / total}% `);
        this.eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, {
          percent: progress,
          progress: uploaded / total,
        });
        // setTimeout(() => {
        //
        // }, 1);
      });

      fileStream.on("end", () => delayedStream.push(null));

      this.logger.log(`Attaching file from disk to formdata of size ${knownFileSize}`);
      // const streamWithDelay = new Readable({
      //   read() {
      //     fileStream.on("data", (chunk) => {
      //       this.push(chunk);
      //       setTimeout(() => this.resume(), 1); // 100ms delay per chunk
      //       this.pause();
      //     });
      //
      //     fileStream.on("end", () => this.push(null));
      //   },
      // });
      formData.append("file", delayedStream, { filename });
    } else {
      this.logger.log("Attaching file from memory buffer to formdata");
      formData.append("file", fileBuffer, { filename });
    }

    // Calculate the header that axios uses to determine progress
    const result: number = await new Promise<number>((resolve, reject) => {
      return formData.getLength((err, length) => {
        if (err) resolve(null);
        resolve(length);
      });
    });

    try {
      const response = await this.createClient(login, (builder) =>
        builder
          .withBaseUrl("http://localhost:1234")
          .withMultiPartFormData()
          .withHeaders({
            ...formData.getHeaders(),
            // "Content-Length": result?.toString() ?? knownFileSize.toString(),
          })
          .withOnUploadProgress((p) => {
            // console.log(`Upload file ${filename} - progress ${p.progress} `);
            // if (token) {
            //   this.eventEmitter2.emit(`${uploadProgressEvent(token)}`, token, p);
            // }
          })
      ).post(urlPath, formData);

      // Cleanup if file exists on disk
      // if (isPhysicalFile) {
      //   fs.unlinkSync((fileStreamOrBuffer as Express.Multer.File).path);
      // }

      this.eventEmitter2.emit(`${uploadDoneEvent(token)}`, token);

      return response.data;
    } catch (e: any) {
      this.eventEmitter2.emit(`${uploadFailedEvent(token)}`, token, (e as AxiosError)?.message);
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
    await this.createClient(login).delete(this.apiFile(path));
  }

  async getPrinterCurrent(login: LoginDto, history: boolean, limit?: number, exclude?: ("temperature" | "sd" | "state")[]) {
    const pathUrl = this.apiPrinterCurrent(history, limit, exclude);
    return await this.createClient(login).get<CurrentPrinterStateDto>(pathUrl);
  }

  async getConnection(login: LoginDto) {
    return await this.createClient(login).get<ConnectionDto>(this.apiConnection);
  }

  async getPrinterProfiles(login: LoginDto) {
    return await this.createClient(login).get(this.apiPrinterProfiles);
  }

  /**
   * Based on https://github.com/OctoPrint/OctoPrint/blob/f430257d7072a83692fc2392c683ed8c97ae47b6/src/octoprint/plugins/softwareupdate/__init__.py#L1265
   */
  async postSoftwareUpdate(login: LoginDto, targets: string[]) {
    return await this.createClient(login).post(this.pluginSoftwareUpdateUpdate, {
      targets,
    });
  }

  async getPluginManagerPlugins(login: LoginDto) {
    return await this.createClient(login).get(this.pluginManagerPlugins);
  }

  async getPluginManagerPlugin(login: LoginDto, pluginName: string) {
    const urlPath = this.pluginManagerPlugin(pluginName);
    return await this.createClient(login).get(urlPath);
  }

  async postApiPluginManagerCommand(login: LoginDto, pluginCommand: string, pluginUrl: string) {
    const command = this.pluginManagerCommand(pluginCommand, pluginUrl);

    return await this.createClient(login).post(this.apiPluginManager, command);
  }

  async postPluginFirmwareUpdateFlash(currentPrinterId: IdType, login: LoginDto, firmwarePath: string) {
    const urlPath = this.pluginFirmwareUpdaterFlash;

    const formData = new FormData();
    formData.append("port", "/dev/op2");
    formData.append("profile", "default");
    const filename = path.basename(firmwarePath);
    const fileReadStream = fs.createReadStream(firmwarePath);
    formData.append("file", fileReadStream, { filename });

    try {
      const response = await this.createClient(login, (builder) =>
        builder
          .withMultiPartFormData()
          .withHeaders({
            ...formData.getHeaders(),
          })
          .withOnUploadProgress((p: any) => {
            if (currentPrinterId) {
              this.eventEmitter2.emit(`${firmwareFlashUploadEvent(currentPrinterId)}`, currentPrinterId, p);
            }
          })
      ).post(urlPath, formData);

      return response?.data;
    } catch (e: any) {
      this.eventEmitter2.emit(`${uploadProgressEvent(currentPrinterId.toString())}`, currentPrinterId, { failed: true }, e);
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
    return await this.createClient(login).get(this.pluginFirmwareUpdaterStatus);
  }

  /**
   * Does not require printer login, much faster, requires internet connectivity
   */
  async fetchOctoPrintPlugins() {
    return await this.createAnonymousClient(pluginRepositoryUrl).get<OP_PluginDto[]>("");
  }

  async getSystemInfo(login: LoginDto) {
    return await this.createClient(login).get(this.apiSystemInfo);
  }

  async getSystemCommands(login: LoginDto) {
    return await this.createClient(login).get(this.apiSystemCommands);
  }

  async postServerRestartCommand(login: LoginDto) {
    await this.createClient(login).post(this.apiServerRestartCommand);
  }

  async getSoftwareUpdateCheck(login: LoginDto, force: boolean) {
    return await this.createClient(login).get(this.apiSoftwareUpdateCheck(force));
  }

  async getPluginPiSupport(login: LoginDto) {
    return await this.createClient(login).get(this.apiPluginPiSupport);
  }

  async deleteTimeLapse(login: LoginDto, fileName: string) {
    const urlPath = `${this.apiTimelapse}/${fileName}`;

    await this.createClient(login).delete(urlPath);
  }

  async listUnrenderedTimeLapses(login: LoginDto) {
    const urlPath = `${this.apiTimelapse}?unrendered=true`;
    return await this.createClient(login).get(urlPath);
  }

  async listProfiles(login: LoginDto) {
    return await this.createClient(login).get(this.apiProfiles);
  }

  async getBackupOverview(login: LoginDto) {
    return await this.createClient(login).get(this.pluginBackupIndex);
  }

  async getBackups(login: LoginDto) {
    return await this.createClient(login).get(this.pluginBackupEndpoint);
  }

  async createBackup(login: LoginDto, excludeArray: string[]) {
    return await this.createClient(login).post(this.pluginBackupEndpoint, {
      exclude: excludeArray,
    });
  }

  async getDownloadBackupStream(login: LoginDto, filename: string) {
    const response = await this.createClient(login, (builder) => {
      builder.withStreamResponse();
    })
      .get(this.pluginBackupFileDownload(filename))
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

  async forwardRestoreBackupFileStream(login: LoginDto, buffer: Buffer) {
    const formData = new FormData();
    formData.append("file", buffer, { filename: "op-fdmm-restore.zip" });

    const response = await this.createClient(login, (builder) =>
      builder.withMultiPartFormData().withHeaders({
        ...formData.getHeaders(),
      })
    )
      .post(this.pluginBackupFileRestore, formData)
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
    return await this.createClient(login).delete(this.pluginBackupFile(filename));
  }

  private createClient(login: LoginDto, buildFluentOptions?: (base: OctoprintHttpClientBuilder) => void) {
    const baseAddress = login.printerURL;

    return this.createAnonymousClient(baseAddress, (o) => {
      if (buildFluentOptions) {
        buildFluentOptions(o);
      }
      o.withXApiKeyHeader(login.apiKey);
    });
  }

  private createAnonymousClient(baseAddress: string, buildFluentOptions?: (base: OctoprintHttpClientBuilder) => void) {
    const builder = new OctoprintHttpClientBuilder();

    return this.httpClientFactory.createClientWithBaseUrl(builder, baseAddress, (b) => {
      if (buildFluentOptions) {
        buildFluentOptions(b);
      }
    });
  }
}
