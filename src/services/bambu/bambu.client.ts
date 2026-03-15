import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { SettingsStore } from "@/state/settings.store";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type { LoginDto } from "@/services/interfaces/login.dto";
import { BambuFtpAdapter } from "@/services/bambu/bambu-ftp.adapter";

/**
 * Bambu Lab printer client
 * Manages FTP connections for file operations
 *
 * Note: MQTT adapter is managed by PrinterSocketStore, not this client
 *
 * Field mapping from Printer entity:
 * - printerURL: Host IP address
 * - password: Access code (8-character authentication code)
 * - username: Serial number
 */
export class BambuClient {
  readonly eventEmitter2: EventEmitter2;
  readonly settingsStore: SettingsStore;
  protected readonly logger: LoggerService;
  private readonly ftpAdapter: BambuFtpAdapter;
  private connected = false;

  constructor(
    settingsStore: SettingsStore,
    loggerFactory: ILoggerFactory,
    eventEmitter2: EventEmitter2,
    bambuFtpAdapter: BambuFtpAdapter,
  ) {
    this.settingsStore = settingsStore;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(BambuClient.name);
    this.ftpAdapter = bambuFtpAdapter;
  }

  async connect(login: LoginDto): Promise<void> {
    const host = this.extractHost(login.printerURL);
    const accessCode = login.password || "";

    if (!accessCode) {
      throw new Error("Access code (password) is required for Bambu Lab printers");
    }

    this.logger.log(`Connecting to Bambu Lab printer FTP at ${host}`);

    try {
      await this.ftpAdapter.connect(host, accessCode);
      this.connected = true;
      this.logger.log("Successfully connected to Bambu Lab printer FTP");
    } catch (error) {
      this.logger.error("Failed to connect to Bambu Lab printer FTP:", error);
      await this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.log("Disconnecting from Bambu Lab printer FTP");
    await this.ftpAdapter.disconnect();
    this.connected = false;
    this.logger.log("Disconnected from Bambu Lab printer FTP");
  }

  get ftp(): BambuFtpAdapter {
    return this.ftpAdapter;
  }

  get isConnected(): boolean {
    return this.connected && this.ftpAdapter.isConnected;
  }

  private extractHost(printerURL: string): string {
    try {
      const url = new URL(printerURL);
      return url.hostname;
    } catch {
      // If not a valid URL, assume it's just the hostname/IP
      return printerURL
        .replace(/^https?:\/\//, "")
        .split(":")[0]
        .split("/")[0];
    }
  }

  async getApiVersion(_login: LoginDto, _timeout?: number): Promise<{ version: string }> {
    return { version: "bambu-1.0" };
  }
}
