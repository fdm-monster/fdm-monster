import {
  BambuType,
  FileDto,
  IPrinterApi,
  PartialReprintFileDto,
  PrinterType,
  ReprintState,
  UploadFileInput,
} from "@/services/printer-api.interface";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { AxiosPromise } from "axios";
import { ServerConfigDto } from "@/services/moonraker/dto/server/server-config.dto";
import { SettingsDto } from "@/services/octoprint/dto/settings/settings.dto";
import { connectionStates } from "@/services/octoprint/dto/connection/connection-state.type";
import { BambuClientStub } from "./bambu.client.stub";
import { BambuMqttAdapterStub } from "./bambu-mqtt.adapter.stub";

const defaultLog = { adapter: "bambu-lab-stub" };

/**
 * Stub implementation of Bambu Lab printer API for testing
 * Uses stub adapters to avoid actual network connections while maintaining interface compatibility
 */
export class BambuApiStub implements IPrinterApi {
  logger: LoggerService;
  client: BambuClientStub;
  printerLogin: LoginDto;
  private readonly printerSocketStore: PrinterSocketStore;
  private printerId?: number;

  constructor(
    bambuClient: BambuClientStub,
    printerLogin: LoginDto,
    printerSocketStore: PrinterSocketStore,
    loggerFactory: ILoggerFactory,
  ) {
    this.logger = loggerFactory("BambuApiStub");
    this.client = bambuClient;
    this.printerLogin = printerLogin;
    this.printerSocketStore = printerSocketStore;
    this.logger.debug("[STUB] Constructed Bambu API client", this.logMeta());
  }

  /**
   * Set the printer ID for accessing the MQTT adapter
   */
  setPrinterId(printerId: number): void {
    this.printerId = printerId;
  }

  /**
   * Get the MQTT adapter from the printer socket store (stubbed)
   */
  private getMqttAdapter(): BambuMqttAdapterStub {
    if (!this.printerId) {
      // Return a default stub adapter for testing
      return new BambuMqttAdapterStub(
        () => ({ debug: () => {}, log: () => {}, warn: () => {}, error: () => {} }) as unknown as LoggerService, // Logger factory stub
        {} as any, // EventEmitter2 stub
      );
    }

    const adapter = this.printerSocketStore.getPrinterSocket(this.printerId);
    if (adapter && adapter instanceof BambuMqttAdapterStub) {
      return adapter;
    }

    // Return a default stub adapter for testing
    return new BambuMqttAdapterStub(
      () => ({ debug: () => {}, log: () => {}, warn: () => {}, error: () => {} }) as unknown as LoggerService, // Logger factory stub
      {} as any, // EventEmitter2 stub
    );
  }

  /**
   * Ensure FTP is connected, auto-connect if needed (stubbed)
   */
  private async ensureFtpConnected(): Promise<void> {
    if (!this.client.isConnected) {
      this.logger.debug("[STUB] FTP not connected, connecting automatically");
      await this.client.connect(this.printerLogin);
    }
  }

  get type(): PrinterType {
    return BambuType;
  }

  set login(login: LoginDto) {
    this.printerLogin = login;
  }

  async getVersion(): Promise<string> {
    const response = await this.client.getApiVersion(this.printerLogin);
    return response.version;
  }

  async validateConnection(): Promise<void> {
    // For Bambu stub, just test FTP connectivity like the real implementation
    this.logger.debug("[STUB] Validating Bambu connection via FTP", this.logMeta());

    try {
      await this.ensureFtpConnected();
      const files = await this.client.ftp.listFiles("/");
      this.logger.debug(`[STUB] FTP connection successful - found ${files.length} directories`, this.logMeta());
    } catch (ftpError) {
      this.logger.debug(`[STUB] FTP validation failed: ${ftpError}`, this.logMeta());
      throw new Error(`Bambu FTP connection failed: ${ftpError}`);
    }

    this.logger.log("[STUB] 🎉 Bambu connection validation completed successfully!", this.logMeta());
  }

  async connect(): Promise<void> {
    await this.client.connect(this.printerLogin);
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  restartServer(): Promise<void> {
    this.logger.warn("[STUB] restartServer not supported by Bambu Lab printers");
    throw new Error("Method not supported");
  }

  restartHost(): Promise<void> {
    this.logger.warn("[STUB] restartHost not supported by Bambu Lab printers");
    throw new Error("Method not supported");
  }

  restartPrinterFirmware(): Promise<void> {
    this.logger.warn("[STUB] restartPrinterFirmware not supported by Bambu Lab printers");
    throw new Error("Method not supported");
  }

  async startPrint(path: string): Promise<void> {
    this.logger.log(`[STUB] Starting print: ${path}`, this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.startPrint(path);
  }

  async pausePrint(): Promise<void> {
    this.logger.log("[STUB] Pausing print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.pausePrint();
  }

  async resumePrint(): Promise<void> {
    this.logger.log("[STUB] Resuming print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.resumePrint();
  }

  async cancelPrint(): Promise<void> {
    this.logger.log("[STUB] Cancelling print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.stopPrint();
  }

  async quickStop(): Promise<void> {
    this.logger.log("[STUB] Quick stopping print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.stopPrint();
  }

  async sendGcode(script: string): Promise<void> {
    this.logger.warn(`[STUB] sendGcode not implemented for Bambu Lab printers: ${script}`);
    throw new Error("Method not implemented");
  }

  movePrintHead(amounts: { x?: number; y?: number; z?: number; speed?: number }): Promise<void> {
    this.logger.warn("[STUB] movePrintHead not implemented for Bambu Lab printers", amounts);
    throw new Error("Method not implemented");
  }

  homeAxes(axes: { x?: boolean; y?: boolean; z?: boolean }): Promise<void> {
    this.logger.warn("[STUB] homeAxes not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  async getFile(path: string): Promise<FileDto> {
    this.logger.debug(`[STUB] Getting file info: ${path}`, this.logMeta());
    await this.ensureFtpConnected();
    const files = await this.client.ftp.listFiles("/");

    const file = files.find((f) => f.name === path || f.name.endsWith(path));
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    return {
      path: file.name,
      size: file.size,
      date: file.modifiedAt ? new Date(file.modifiedAt).getTime() : null,
      dir: file.isDirectory,
    };
  }

  async getFiles(recursive = false, startDir = "/") {
    if (recursive) {
      throw new Error("Recursive listing not supported for Bambu Lab printers");
    }

    this.logger.debug(`[STUB] Getting files list from ${startDir}`, this.logMeta());
    await this.ensureFtpConnected();
    const items = await this.client.ftp.listFiles(startDir);

    const mapped = items.map((item) => {
      const fullPath = startDir === "/" ? `/${item.name}` : `${startDir}/${item.name}`;
      return {
        path: fullPath,
        size: item.size,
        date: item.modifiedAt ? new Date(item.modifiedAt).getTime() : null,
        dir: item.isDirectory,
      };
    });

    return {
      dirs: mapped.filter((i) => i.dir),
      files: mapped.filter((i) => !i.dir),
    };
  }

  downloadFile(path: string): AxiosPromise<NodeJS.ReadableStream> {
    this.logger.warn("[STUB] downloadFile not implemented via HTTP for Bambu Lab printers");
    throw new Error("Method not implemented. Use FTP adapter directly if needed.");
  }

  getFileChunk(path: string, startBytes: number, endBytes: number): AxiosPromise<string> {
    this.logger.warn("[STUB] getFileChunk not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  async uploadFile(input: UploadFileInput): Promise<void> {
    this.logger.log(`[STUB] Uploading file: ${input.fileName} (${input.contentLength} bytes)`, this.logMeta());

    try {
      await this.ensureFtpConnected();
      await this.client.ftp.uploadFile(input.stream, input.fileName, input.uploadToken);

      if (input.startPrint) {
        this.logger.log(`[STUB] Starting print after upload: ${input.fileName}`, this.logMeta());
        const mqttAdapter = this.getMqttAdapter();
        await mqttAdapter.startPrint(input.fileName);
      }
    } catch (error) {
      this.logger.error(`[STUB] Upload failed: ${(error as Error).message}`, this.logMeta());
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    this.logger.log(`[STUB] Deleting file: ${path}`, this.logMeta());
    await this.ensureFtpConnected();
    await this.client.ftp.deleteFile(`/${path}`);
  }

  deleteFolder(path: string): Promise<void> {
    this.logger.warn("[STUB] deleteFolder not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  getSettings(): Promise<ServerConfigDto | SettingsDto> {
    this.logger.warn("[STUB] getSettings not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  async getReprintState(): Promise<PartialReprintFileDto> {
    this.logger.warn("[STUB] getReprintState not implemented for Bambu Lab printers");
    return {
      connectionState: connectionStates.Operational,
      reprintState: ReprintState.NoLastPrint,
    };
  }

  private logMeta() {
    return {
      ...defaultLog,
      printerId: this.printerId,
      host: this.printerLogin?.printerURL,
    };
  }
}
