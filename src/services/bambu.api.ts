import {
  BambuType,
  FileDto,
  IPrinterApi,
  PartialReprintFileDto,
  PrinterType,
  ReprintState,
} from "@/services/printer-api.interface";
import { LoggerService } from "@/handlers/logger";
import { LoginDto } from "@/services/interfaces/login.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { BambuClient } from "@/services/bambu/bambu.client";
import { BambuMqttAdapter } from "@/services/bambu/bambu-mqtt.adapter";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { AxiosPromise, AxiosResponse } from "axios";
import { ServerConfigDto } from "./moonraker/dto/server/server-config.dto";
import { SettingsDto } from "./octoprint/dto/settings/settings.dto";
import { readFileSync, statSync } from "node:fs";

const defaultLog = { adapter: "bambu-lab" };

/**
 * Bambu Lab printer API implementation
 * Implements the IPrinterApi interface for fdm-monster integration
 *
 * Note: MQTT adapter is managed by PrinterSocketStore
 *
 * Credentials mapping:
 * - printerURL: Host IP address
 * - password: Access code (8-character authentication code)
 * - username: Serial number
 */
export class BambuApi implements IPrinterApi {
  logger: LoggerService;
  client: BambuClient;
  printerLogin: LoginDto;
  private readonly printerSocketStore: PrinterSocketStore;
  private printerId?: number;

  constructor(
    bambuClient: BambuClient,
    printerLogin: LoginDto,
    printerSocketStore: PrinterSocketStore,
    loggerFactory: ILoggerFactory,
  ) {
    this.logger = loggerFactory(BambuApi.name);
    this.client = bambuClient;
    this.printerLogin = printerLogin;
    this.printerSocketStore = printerSocketStore;
    this.logger.debug("Constructed Bambu API client", this.logMeta());
  }

  /**
   * Set the printer ID for accessing the MQTT adapter
   */
  setPrinterId(printerId: number): void {
    this.printerId = printerId;
  }

  /**
   * Get the MQTT adapter from the printer socket store
   */
  private getMqttAdapter(): BambuMqttAdapter {
    if (!this.printerId) {
      throw new Error("Printer ID not set. Cannot access MQTT adapter.");
    }

    const adapter = this.printerSocketStore.getPrinterSocket(this.printerId);
    if (!adapter) {
      throw new Error(`MQTT adapter not found for printer ${this.printerId}`);
    }

    if (!(adapter instanceof BambuMqttAdapter)) {
      throw new Error(`Adapter for printer ${this.printerId} is not a BambuMqttAdapter`);
    }

    return adapter;
  }

  /**
   * Ensure FTP is connected, auto-connect if needed
   */
  private async ensureFtpConnected(): Promise<void> {
    if (!this.client.isConnected) {
      this.logger.debug("FTP not connected, connecting automatically");
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
    this.logger.debug("Validating Bambu connection", this.logMeta());

    // Test FTP connectivity first
    try {
      await this.ensureFtpConnected();
      const files = await this.client.ftp.listFiles("/");
      this.logger.debug(`FTP connection successful - found ${files.length} directories`, this.logMeta());
    } catch (ftpError) {
      this.logger.debug(`FTP validation failed: ${ftpError}`, this.logMeta());
      throw new Error(`Bambu FTP connection failed: ${ftpError}`);
    }
  }

  async connect(): Promise<void> {
    await this.client.connect(this.printerLogin);
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  restartServer(): Promise<void> {
    this.logger.warn("restartServer not supported by Bambu Lab printers");
    throw new Error("Method not supported");
  }

  restartHost(): Promise<void> {
    this.logger.warn("restartHost not supported by Bambu Lab printers");
    throw new Error("Method not supported");
  }

  restartPrinterFirmware(): Promise<void> {
    this.logger.warn("restartPrinterFirmware not supported by Bambu Lab printers");
    throw new Error("Method not supported");
  }

  async startPrint(path: string): Promise<void> {
    this.logger.log(`Starting print: ${path}`, this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.startPrint(path);
  }

  async pausePrint(): Promise<void> {
    this.logger.log("Pausing print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.pausePrint();
  }

  async resumePrint(): Promise<void> {
    this.logger.log("Resuming print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.resumePrint();
  }

  async cancelPrint(): Promise<void> {
    this.logger.log("Canceling print", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.stopPrint();
  }

  async quickStop(): Promise<void> {
    this.logger.log("Quick stop (same as cancel for Bambu)", this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.stopPrint();
  }

  async sendGcode(script: string): Promise<void> {
    this.logger.log(`Sending GCode: ${script}`, this.logMeta());
    const mqttAdapter = this.getMqttAdapter();
    await mqttAdapter.sendGcode(script);
  }

  movePrintHead(amounts: { x?: number; y?: number; z?: number; speed?: number }): Promise<void> {
    this.logger.warn("movePrintHead not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  homeAxes(axes: { x?: boolean; y?: boolean; z?: boolean }): Promise<void> {
    this.logger.warn("homeAxes not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  async getFile(path: string): Promise<FileDto> {
    this.logger.debug(`Getting file info: ${path}`, this.logMeta());
    await this.ensureFtpConnected();
    const files = await this.client.ftp.listFiles("/sdcard");

    const file = files.find((f) => f.name === path || f.name.endsWith(path));
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    return {
      path: file.name,
      size: file.size,
      date: file.modifiedAt ? new Date(file.modifiedAt).getTime() : null,
    };
  }

  async getFiles(recursive = true): Promise<FileDto[]> {
    this.logger.debug("Listing files", this.logMeta());
    await this.ensureFtpConnected();
    const files = await this.client.ftp.listFiles("/sdcard");

    return files
      .filter((f) => f.isFile) // Only files, not directories
      .map((f) => ({
        path: f.name,
        size: f.size,
        date: f.modifiedAt ? new Date(f.modifiedAt).getTime() : null,
      }));
  }

  async downloadFile(path: string): AxiosPromise<NodeJS.ReadableStream> {
    this.logger.log(`Downloading file via FTP: ${path}`, this.logMeta());

    await this.ensureFtpConnected();

    // Ensure path starts with /sdcard/
    const remotePath = path.startsWith("/sdcard/") ? path : `/sdcard/${path}`;

    const { stream, tempPath } = await this.client.ftp.downloadFileAsStream(remotePath);

    // Get file size from the temp file
    const stats = statSync(tempPath);

    // Extract filename from path for Content-Disposition header
    const filename = remotePath.split("/").pop() || "download";

    // Create an AxiosResponse-like structure
    const response: AxiosResponse<NodeJS.ReadableStream> = {
      data: stream,
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/octet-stream",
        "content-length": String(stats.size),
        "content-disposition": `attachment; filename="${filename}"`,
      },
      config: {
        headers: {} as any,
      },
    };

    return response;
  }

  getFileChunk(path: string, startBytes: number, endBytes: number): AxiosPromise<string> {
    this.logger.warn("getFileChunk not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  async uploadFile(
    fileOrBuffer: Buffer | Express.Multer.File,
    startPrint: boolean,
    uploadToken?: string,
  ): Promise<void> {
    let fileBuffer: Buffer;
    let filename: string;

    // Get file buffer and name
    if (Buffer.isBuffer(fileOrBuffer)) {
      this.logger.log("Using file directly from memory buffer for upload");
      fileBuffer = fileOrBuffer;
      filename = `upload_${Date.now()}.3mf`; // Default name for buffer uploads
    } else {
      const filePath = fileOrBuffer.path;
      filename = fileOrBuffer.originalname;
      this.logger.log(`Reading file from disk for upload: ${filePath}`);
      fileBuffer = readFileSync(filePath);
    }

    this.logger.log(`Uploading file: ${filename} (${fileBuffer.length} bytes)`, this.logMeta());

    try {
      await this.ensureFtpConnected();
      await this.client.ftp.uploadFile(fileBuffer, filename, uploadToken);

      if (startPrint) {
        this.logger.log(`Starting print after upload: ${filename}`, this.logMeta());
        const mqttAdapter = this.getMqttAdapter();
        await mqttAdapter.startPrint(filename);
      }
    } catch (error) {
      this.logger.error(`Upload failed: ${(error as Error).message}`, this.logMeta());
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    this.logger.log(`Deleting file: ${path}`, this.logMeta());
    await this.ensureFtpConnected();
    await this.client.ftp.deleteFile(`/sdcard/${path}`);
  }

  deleteFolder(path: string): Promise<void> {
    this.logger.warn("deleteFolder not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  getSettings(): Promise<ServerConfigDto | SettingsDto> {
    this.logger.warn("getSettings not implemented for Bambu Lab printers");
    throw new Error("Method not implemented");
  }

  async getReprintState(): Promise<PartialReprintFileDto> {
    const mqttAdapter = this.getMqttAdapter();
    const state = mqttAdapter.getLastState();

    if (!state) {
      return {
        reprintState: ReprintState.PrinterNotAvailable,
        connectionState: null,
      };
    }

    const lastFile = state.gcode_file;

    if (!lastFile) {
      return {
        reprintState: ReprintState.NoLastPrint,
        connectionState: null,
      };
    }

    return {
      file: {
        path: lastFile,
        size: -1,
        date: null,
      },
      reprintState: ReprintState.LastPrintReady,
      connectionState: null,
    };
  }

  private logMeta() {
    return defaultLog;
  }
}
