import FormData from "form-data";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import { OctoprintRoutes } from "./octoprint-api.routes";
import { AxiosError, AxiosPromise } from "axios";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { flattenOctoPrintFiles, normalizePrinterFile } from "@/services/octoprint/utils/file.utils";
import { ConnectionDto } from "@/services/octoprint/dto/connection/connection.dto";
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
import { SettingsStore } from "@/state/settings.store";
import { Readable } from "node:stream";

type TAxes = "x" | "y" | "z";

/**
 * OctoPrint REST API
 * https://docs.octoprint.org/en/master/api/index.html
 */
export class OctoprintClient extends OctoprintRoutes {
  protected logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly httpClientFactory: HttpClientFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly settingsStore: SettingsStore,
  ) {
    super();

    this.logger = loggerFactory(OctoprintClient.name);
  }

  async getApiVersion(login: LoginDto) {
    return await this.createClient(login).get<VersionDto>(this.apiVersion);
  }

  async getServer(login: LoginDto) {
    return await this.createClient(login).get<ServerDto>(this.apiServer);
  }

  async login(login: LoginDto) {
    return await this.createClient(login).post<OP_LoginDto>(this.apiLogin, {
      passive: true,
    });
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

  async getLocalFiles(login: LoginDto, recursive = false, startDir = "") {
    const response = await this.createClient(login).get<OctoprintFilesResponseDto>(this.apiGetFiles(recursive, startDir));

    if (!response?.data?.files) {
      return [];
    }

    if (recursive) {
      return flattenOctoPrintFiles(response.data.files, startDir);
    } else {
      return response.data.files.map((item) => ({
        path: startDir ? `${startDir}/${item.name}` : item.name,
        size: item.size || 0,
        date: item.date || null,
        dir: item.type === 'folder',
      }));
    }
  }

  async getFile(login: LoginDto, path: string) {
    const urlPath = this.apiFile(path);
    const response = await this.createClient(login).get<OctoprintFileDto>(urlPath);

    const file = response?.data;
    return {
      path: file.path,
      size: file.size,
      date: file.date,
      dir: file.type === 'folder',
    };
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
        Range: `bytes=${ startBytes }-${ endBytes }`,
      }),
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

  async uploadFileAsMultiPart(
    login: LoginDto,
    stream: Readable,
    fileName: string,
    contentLength: number,
    startPrint: boolean,
    progressToken?: string,
  ) {
    const urlPath = this.apiFilesLocal;

    const formData = new FormData();
    if (startPrint) {
      formData.append("print", "true");
    }

    formData.append("file", stream, {
      filename: fileName,
      knownLength: contentLength,
    });

    // Calculate the header that axios uses to determine progress
    const result: number = await new Promise<number>((resolve, reject) => {
      return formData.getLength((err, length) => {
        if (err) reject(new Error("Could not retrieve formData length"));
        resolve(length);
      });
    });

    try {
      const response = await this.createClient(login, (builder) =>
        builder
          .withMultiPartFormData()
          .withTimeout(this.settingsStore.getTimeoutSettings().apiUploadTimeout)
          .withHeaders({
            ...formData.getHeaders(),
            "Content-Length": result.toString(),
          })
          .withOnUploadProgress((p) => {
            if (progressToken) {
              this.eventEmitter2.emit(`${ uploadProgressEvent(progressToken) }`, progressToken, p);
            }
          }),
      ).post(urlPath, formData);

      if (progressToken) {
        this.eventEmitter2.emit(`${ uploadDoneEvent(progressToken) }`, progressToken);
      }

      return response.data;
    } catch (e: any) {
      if (progressToken) {
        this.eventEmitter2.emit(`${ uploadFailedEvent(progressToken) }`, progressToken, (e as AxiosError)?.message);
      }
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
        "OctoPrint",
      );
    }
  }

  async deleteFileOrFolder(login: LoginDto, path: string) {
    await this.createClient(login).delete(this.apiFile(path));
  }

  async getPrinterCurrent(
    login: LoginDto,
    history: boolean,
    limit?: number,
    exclude?: ("temperature" | "sd" | "state")[],
  ) {
    const pathUrl = this.apiPrinterCurrent(history, limit, exclude);
    return await this.createClient(login).get<CurrentPrinterStateDto>(pathUrl);
  }

  async getConnection(login: LoginDto) {
    return await this.createClient(login).get<ConnectionDto>(this.apiConnection);
  }

  async getPrinterProfiles(login: LoginDto) {
    return await this.createClient(login).get(this.apiPrinterProfiles);
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
