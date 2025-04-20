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
import { AxiosPromise } from "axios";
import { LoginDto } from "../interfaces/login.dto";
import { ServerConfigDto } from "../moonraker/dto/server/server-config.dto";
import { SettingsDto } from "../octoprint/dto/settings/settings.dto";
import { PrusaLinkHttpClientBuilder } from "@/services/prusa-link/utils/prusa-link-http-client.builder";
import { VersionDto } from "@/services/prusa-link/dto/version.dto";
import { PL_FileResponseDto } from "@/services/prusa-link/dto/file-response.dto";
import { PL_StatusDto } from "@/services/prusa-link/dto/status.dto";
import { PL_PrinterStateDto } from "@/services/prusa-link/dto/printer-state.dto";

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
    private readonly httpClientFactory: HttpClientFactory,
    private printerLogin: LoginDto,
  ) {
    this.logger = loggerFactory(PrusaLinkApi.name);
    this.logger.debug("Constructed", this.logMeta());
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

  async getStatus(): Promise<PL_StatusDto> {
    const response = await this.client.get<PL_StatusDto>("/api/v1/status");
    return response.data;
  }

  async getPrinterState(): Promise<PL_PrinterStateDto> {
    const response = await this.client.get<PL_PrinterStateDto>("/api/printer");
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

  startPrint(path: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  pausePrint(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  resumePrint(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  cancelPrint(): Promise<void> {
    throw new Error("Method not implemented.");
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

  getFile(path: string): Promise<FileDto> {
    throw new Error("Method not implemented.");
  }

  downloadFile(path: string): AxiosPromise<NodeJS.ReadableStream> {
    throw new Error("Method not implemented.");
  }

  getFileChunk(path: string, startBytes: number, endBytes: number): AxiosPromise<string> {
    throw new Error("Method not implemented.");
  }

  uploadFile(fileOrBuffer: Buffer | Express.Multer.File, uploadToken?: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  deleteFile(path: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  deleteFolder(path: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getSettings(): Promise<ServerConfigDto | SettingsDto> {
    throw new Error("Method not implemented.");
  }

  getReprintState(): Promise<PartialReprintFileDto> {
    throw new Error("Method not implemented.");
  }

  private createClient(
    buildFluentOptions?: (base: PrusaLinkHttpClientBuilder) => void,
  ) {
    const builder = new PrusaLinkHttpClientBuilder();

    this.logger.debug("Create client", this.logMeta());

    return this.httpClientFactory.createClientWithBaseUrl(builder, this.printerLogin.printerURL, (b) => {
      // Set up digest auth with the credentials and an error handler
      b.withDigestAuth(
        this.printerLogin.username,
        this.printerLogin.password,
        (error) => {
          this.logger.error("Authentication error occurred", error);
        },
        (error, attemptCount) => {
          this.logger.log(`Authentication attempt count ${attemptCount} for method ${error.config?.method} path ${error.config?.url}`, this.logMeta());
        },
        (authHeader) => {
          this.logger.debug("Authentication successful, saving auth header for later reuse", this.logMeta());
          this.authHeader = authHeader;
        },
      );

      if (this.authHeader) {
        this.logger.debug("Reusing stored auth header", this.logMeta());
        b.withAuthHeader(this.authHeader);
      }
    });
  }

  private logMeta() {
    return defaultLog;
  }
}
