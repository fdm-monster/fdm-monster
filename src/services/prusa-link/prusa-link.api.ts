import { HttpClientFactory } from "@/services/core/http-client.factory";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import {
  FileDto,
  IPrinterApi,
  PartialReprintFileDto,
  PrinterType,
  PrusaLinkType,
} from "@/services/printer-api.interface";
import { AxiosError, AxiosPromise } from "axios";
import { LoginDto } from "../interfaces/login.dto";
import { ServerConfigDto } from "../moonraker/dto/server/server-config.dto";
import { SettingsDto } from "../octoprint/dto/settings/settings.dto";
import { PrusaLinkHttpClientBuilder } from "@/services/prusa-link/utils/prusa-link-http-client.builder";
import { VersionDto } from "@/services/prusa-link/dto/version.dto";
import { PL_FileResponseDto } from "@/services/prusa-link/dto/file-response.dto";
import { PL_StatusDto } from "@/services/prusa-link/dto/status.dto";
import { PL_PrinterStateDto } from "@/services/prusa-link/dto/printer-state.dto";
import { PL_JobStateDto } from "@/services/prusa-link/dto/job-state.dto";
import { readFileSync } from "fs";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import EventEmitter2 from "eventemitter2";
import { PL_FileDto } from "@/services/prusa-link/dto/file.dto";
import { SettingsStore } from "@/state/settings.store";

const defaultLog = { adapter: "prusa-link" };

/**
 * Prusa Link OpenAPI spec https://raw.githubusercontent.com/prusa3d/Prusa-Link-Web/master/spec/openapi.yaml
 * Prusa Link https://github.com/prusa3d/Prusa-Link
 * Prusa Link Web https://github.com/prusa3d/Prusa-Link-Web/tree/master
 */
export class PrusaLinkApi implements IPrinterApi {
  protected logger: LoggerService;
  private authHeader: string | null = null;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
    private readonly httpClientFactory: HttpClientFactory,
    private readonly settingsStore: SettingsStore,
    private printerLogin: LoginDto,
  ) {
    this.logger = loggerFactory(PrusaLinkApi.name);
    this.logger.debug("Constructed api client", this.logMeta());
  }

  get type(): PrinterType {
    return PrusaLinkType;
  }

  set login(login: LoginDto) {
    this.printerLogin = login;
  }

  private get client() {
    return this.createClient();
  }

  async getVersion(): Promise<string> {
    const response = await this.client.get<VersionDto>("/api/version");
    return response.data.server;
  }

  async getFiles(): Promise<FileDto[]> {
    const response = await this.client.get<PL_FileResponseDto>("/api/files");
    return response.data.files
      .filter((dir) => dir.path === "/usb")[0]
      .children.map(
        (f) =>
          ({
            path: f.display,
            date: null,
            size: -1,
          } as FileDto),
      );
  }

  async getFile(path: string): Promise<FileDto> {
    const response = await this.getFileRaw(path);

    return {
      path: response.data.name,
      size: response.data.size,
      date: null,
    };
  }

  async getStatus(): Promise<PL_StatusDto> {
    const response = await this.client.get<PL_StatusDto>("/api/v1/status");
    return response.data;
  }

  async getPrinterState(): Promise<PL_PrinterStateDto> {
    // OctoPrint compatibility
    const response = await this.client.get<PL_PrinterStateDto>("/api/printer");
    return response.data;
  }

  async getJobState(): Promise<PL_JobStateDto> {
    // OctoPrint compatibility
    const response = await this.client.get<PL_JobStateDto>("/api/job");
    return response.data;
  }

  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  disconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  restartServer(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  restartHost(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  restartPrinterFirmware(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async startPrint(path: string): Promise<void> {
    await this.client.post<void>(`/api/v1/files/usb/${path}`);
  }

  async pausePrint(): Promise<void> {
    const jobId = await this.getCurrentJobId();
    if (!jobId) {
      this.logger.warn("Job pause command did not complete, job or job id not set");
      return;
    }
    await this.client.put<void>(`/api/v1/job/${jobId}/pause`);
  }

  async resumePrint(): Promise<void> {
    const jobId = await this.getCurrentJobId();
    if (!jobId) {
      this.logger.warn("Job resume command did not complete, job or job id not set");
      return;
    }
    await this.client.put<void>(`/api/v1/job/${jobId}/resume`);
  }

  async cancelPrint(): Promise<void> {
    const jobId = await this.getCurrentJobId();
    if (!jobId) {
      this.logger.warn("Job cancel command did not complete, job or job id not set");
      return;
    }
    await this.client.delete<void>(`/api/v1/job/${jobId}`);
  }

  quickStop(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  sendGcode(script: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  movePrintHead(amounts: { x?: number; y?: number; z?: number; speed?: number }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  homeAxes(axes: { x?: boolean; y?: boolean; z?: boolean }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async downloadFile(path: string): AxiosPromise<NodeJS.ReadableStream> {
    const fileReference = await this.getFileRaw(path);
    const pathUrl = fileReference.data.refs.download;

    return await this.client.get(pathUrl, {
      responseType: "stream",
    });
  }

  async getFileChunk(path: string, startBytes: number, endBytes: number): AxiosPromise<string> {
    const fileReference = await this.getFileRaw(path);
    const pathUrl = fileReference.data.refs.download;

    return await this.createClient((o) =>
      o.withHeaders({
        Range: `bytes=${startBytes}-${endBytes}`,
      }),
    ).get<string>(pathUrl);
  }

  async uploadFile(
    multerFileOrBuffer: Buffer | Express.Multer.File,
    progressToken?: string,
  ): Promise<void> {
    try {
      let fileBuffer: Buffer;
      const filename = (multerFileOrBuffer as Express.Multer.File).originalname;

      // Get file buffer - either from buffer or from file path
      if (Buffer.isBuffer(multerFileOrBuffer)) {
        this.logger.log("Using file directly from memory buffer for upload");
        fileBuffer = multerFileOrBuffer as Buffer;
      } else {
        const filePath = (multerFileOrBuffer as Express.Multer.File).path;
        this.logger.log(`Reading file from disk for upload: ${filePath}`);
        fileBuffer = readFileSync(filePath);
      }

      // Calculate content length
      const contentLength = fileBuffer.length;

      const response = await this.createClient((b) => {
        b.withHeaders({
          "Content-Length": contentLength.toString(),
          // Compliance with other printer services
          "Overwrite": "?1",
          // Compliance with other printer services
          "Print-After-Upload": "?1",
        })
          .withTimeout(this.settingsStore.getTimeoutSettings().apiUploadTimeout)
          .withOnUploadProgress((p) => {
            if (progressToken) {
              this.eventEmitter2.emit(`${uploadProgressEvent(progressToken)}`, progressToken, p);
            }
          });
      }).put(`/api/v1/files/usb/${encodeURIComponent(filename)}`, fileBuffer);

      if (progressToken) {
        this.eventEmitter2.emit(`${uploadDoneEvent(progressToken)}`, progressToken);
      }

      return response.data;
    } catch (e: any) {
      if (progressToken) {
        this.eventEmitter2.emit(`${uploadFailedEvent(progressToken)}`, progressToken, (e as AxiosError)?.message);
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
        "Prusa-Link",
      );
    }
  }

  async deleteFile(path: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/files/usb/${path}`);
  }

  async deleteFolder(path: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/files/usb/${path}`);
  }

  getSettings(): Promise<ServerConfigDto | SettingsDto> {
    throw new Error("Method not implemented.");
  }

  getReprintState(): Promise<PartialReprintFileDto> {
    throw new Error("Method not implemented.");
  }

  private getFileRaw(path: string) {
    return this.client.get<PL_FileDto>(`/api/v1/files/usb/${path}`);
  }

  private async getCurrentJobId() {
    const status = await this.getStatus();
    return status.job?.id;
  }

  private createClient(
    buildFluentOptions?: (base: PrusaLinkHttpClientBuilder) => void,
  ) {
    const builder = new PrusaLinkHttpClientBuilder();

    return this.httpClientFactory.createClientWithBaseUrl(builder, this.printerLogin.printerURL, (b) => {
      this.logger.debug("Building API client", this.logMeta());

      // Set up digest auth with the credentials and an error handler
      b.withDigestAuth(
        this.printerLogin.username,
        this.printerLogin.password,
        (error) => {
          this.logger.error("Authentication error occurred", error);
        },
        (error, attemptCount) => {
          this.logger.log(`Authentication attempt count ${attemptCount} for method ${error.config?.method?.toUpperCase()} path ${error.config?.url}`, this.logMeta());
        },
        (authHeader) => {
          this.logger.debug("Authentication successful, saving auth header for later reuse", this.logMeta());
          this.authHeader = authHeader;
        },
      );

      if (this.authHeader) {
        b.withAuthHeader(this.authHeader);
      }

      if (buildFluentOptions && typeof buildFluentOptions === "function") {
        buildFluentOptions(b);
      }
    });
  }

  private logMeta() {
    return defaultLog;
  }
}
