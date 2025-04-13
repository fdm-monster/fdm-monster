import EventEmitter2 from "eventemitter2";
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
import { wwwAuthenticationHeaderKey } from "@/services/octoprint/constants/octoprint-service.constants";
import { VersionDto } from "@/services/prusa-link/dto/version.dto";
import { PL_FileResponseDto } from "@/services/prusa-link/dto/file-response.dto";

/**
 * Prusa Link OpenAPI spec https://raw.githubusercontent.com/prusa3d/Prusa-Link-Web/master/spec/openapi.yaml
 * Prusa Link https://github.com/prusa3d/Prusa-Link
 * Prusa Link Web https://github.com/prusa3d/Prusa-Link-Web/tree/master
 */
export class PrusaLinkApi implements IPrinterApi {
  authHeader?: string;
  protected logger: LoggerService;

  constructor(
    private readonly httpClientFactory: HttpClientFactory,
    loggerFactory: ILoggerFactory,
    private printerLogin: LoginDto,
  ) {
    this.logger = loggerFactory(PrusaLinkApi.name);
  }

  get type(): PrinterType {
    return PrusaLinkType;
  }

  set login(login: LoginDto) {
    this.printerLogin = login;
  }

  async updateAuthHeader() {
    const client = this.createAnonymousClient(this.printerLogin.printerURL);
    const response = await client.get("/api/v1/status", {
      validateStatus: (status) => status < 500,
    });

    const receivedHeader = response.headers[wwwAuthenticationHeaderKey] as string;
    if (!receivedHeader?.length) {
      throw new Error("Authentication header was not received");
    }

    this.authHeader = receivedHeader;
  }

  async getVersion(): Promise<string> {
    const response = await this.createClient(this.printerLogin, "GET", "/api/version").get<VersionDto>("/api/version");
    return response.data.server;
  }

  async getFiles(): Promise<FileDto[]> {
    const response = await this.createClient(this.printerLogin, "GET", "/api/files").get<PL_FileResponseDto>("/api/files");
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
    login: LoginDto,
    requestMethod: string,
    requestPath: string,
    buildFluentOptions?: (base: PrusaLinkHttpClientBuilder) => void,
  ) {
    const baseAddress = login.printerURL;

    return this.createAnonymousClient(baseAddress, (o) => {
      if (buildFluentOptions) {
        buildFluentOptions(o);
      }
      // TODO merge request path with base address path
      o.withDigestAuth(this.authHeader, login.username, login.password, requestMethod, requestPath);
    });
  }

  private createAnonymousClient(baseAddress: string, buildFluentOptions?: (base: PrusaLinkHttpClientBuilder) => void) {
    const builder = new PrusaLinkHttpClientBuilder();

    return this.httpClientFactory.createClientWithBaseUrl(builder, baseAddress, (b) => {
      if (buildFluentOptions) {
        buildFluentOptions(b);
      }
    });
  }
}
