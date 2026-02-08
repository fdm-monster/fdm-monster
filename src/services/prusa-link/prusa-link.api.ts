import { HttpClientFactory } from "@/services/core/http-client.factory";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import {
  FileDto,
  IPrinterApi,
  PartialReprintFileDto,
  PrinterType,
  PrusaLinkType,
  UploadFileInput,
  uploadFileInputSchema,
} from "@/services/printer-api.interface";
import { AxiosError, AxiosPromise } from "axios";
import type { LoginDto } from "../interfaces/login.dto";
import type { ServerConfigDto } from "../moonraker/dto/server/server-config.dto";
import type { SettingsDto } from "../octoprint/dto/settings/settings.dto";
import { PrusaLinkHttpClientBuilder } from "@/services/prusa-link/utils/prusa-link-http-client.builder";
import type { VersionDto } from "@/services/prusa-link/dto/version.dto";
import type { PL_FileResponseDto } from "@/services/prusa-link/dto/file-response.dto";
import type { PL_StatusDto } from "@/services/prusa-link/dto/status.dto";
import type { PL_PrinterStateDto } from "@/services/prusa-link/dto/printer-state.dto";
import type { PL_JobStateDto } from "@/services/prusa-link/dto/job-state.dto";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import { ExternalServiceError } from "@/exceptions/runtime.exceptions";
import EventEmitter2 from "eventemitter2";
import type { PL_FileDto } from "@/services/prusa-link/dto/file.dto";
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

  async validateConnection(): Promise<void> {
    await this.getVersion();
  }

  async getFiles(recursive = false, startDir = "/usb") {
    if (recursive) {
      throw new Error("Recursive listing not supported for PrusaLink printers");
    }

    const response = await this.client.get<PL_FileResponseDto>("/api/files");
    const root = response.data.files.find((dir) => dir.path === startDir);

    if (!root || !root.children) {
      return { dirs: [], files: [] };
    }

    const items = root.children.map((child) => ({
      path: child.path,
      size: null,
      date: null,
      dir: !child.refs?.download,
    }));

    return {
      dirs: items.filter((i) => i.dir),
      files: items.filter((i) => !i.dir),
    };
  }

  async getFile(path: string): Promise<FileDto> {
    const response = await this.getFileRaw(path);

    return {
      path: response.data.name,
      size: response.data.size,
      date: null,
      dir: false,
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

  async uploadFile(input: UploadFileInput): Promise<void> {
    const validated = uploadFileInputSchema.parse(input);

    try {
      const response = await this.createClient((b) => {
        b.withHeaders({
          "Content-Type": "application/octet-stream",
          "Content-Length": validated.contentLength.toString(),
          Overwrite: "?1",
          "Print-After-Upload": validated.startPrint ? "?1" : "?0",
        })
          .withTimeout(this.settingsStore.getTimeoutSettings().apiUploadTimeout)
          .withOnUploadProgress((p) => {
            if (validated.uploadToken) {
              this.eventEmitter2.emit(`${uploadProgressEvent(validated.uploadToken)}`, validated.uploadToken, p);
            }
          });
      }).put(`/api/v1/files/usb/${encodeURIComponent(validated.fileName)}`, validated.stream);

      if (validated.uploadToken) {
        this.eventEmitter2.emit(`${uploadDoneEvent(validated.uploadToken)}`, validated.uploadToken);
      }

      return response.data;
    } catch (e: any) {
      if (validated.uploadToken) {
        this.eventEmitter2.emit(
          `${uploadFailedEvent(validated.uploadToken)}`,
          validated.uploadToken,
          (e as AxiosError)?.message,
        );
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

  private createClient(buildFluentOptions?: (base: PrusaLinkHttpClientBuilder) => void) {
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
          this.logger.log(
            `Authentication attempt count ${attemptCount} for method ${error.config?.method?.toUpperCase()} path ${error.config?.url}`,
            this.logMeta(),
          );
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
