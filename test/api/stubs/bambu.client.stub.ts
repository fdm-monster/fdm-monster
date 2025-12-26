import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { SettingsStore } from "@/state/settings.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoginDto } from "@/services/interfaces/login.dto";
import { BambuFtpAdapterStub } from "./bambu-ftp.adapter.stub";

/**
 * Stub implementation of Bambu Lab printer client for testing
 * Uses stub adapters to avoid actual network connections
 */
export class BambuClientStub {
  readonly eventEmitter2: EventEmitter2;
  readonly settingsStore: SettingsStore;
  protected readonly logger: LoggerService;
  private readonly ftpAdapter: BambuFtpAdapterStub;
  private connected = false;

  constructor(
    settingsStore: SettingsStore,
    loggerFactory: ILoggerFactory,
    eventEmitter2: EventEmitter2,
    bambuFtpAdapter: BambuFtpAdapterStub,
  ) {
    this.settingsStore = settingsStore;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory("BambuClientStub");
    this.ftpAdapter = bambuFtpAdapter;
  }

  /**
   * Connect to Bambu Lab printer FTP (stubbed)
   */
  async connect(login: LoginDto): Promise<void> {
    const host = this.extractHost(login.printerURL);
    const accessCode = login.password || "";

    if (!accessCode) {
      throw new Error("Access code (password) is required for Bambu Lab printers");
    }

    this.logger.log(`[STUB] Connecting to Bambu Lab printer FTP at ${host}`);

    try {
      await this.ftpAdapter.connect(host, accessCode);
      this.connected = true;
      this.logger.log("[STUB] Successfully connected to Bambu Lab printer FTP");
    } catch (error) {
      this.logger.error("[STUB] Failed to connect to Bambu Lab printer FTP:", error);
      await this.disconnect();
      throw error;
    }
  }

  /**
   * Disconnect from printer FTP (stubbed)
   */
  async disconnect(): Promise<void> {
    this.logger.log("[STUB] Disconnecting from Bambu Lab printer FTP");
    await this.ftpAdapter.disconnect();
    this.connected = false;
    this.logger.log("[STUB] Disconnected from Bambu Lab printer FTP");
  }

  /**
   * Get FTP adapter for direct access
   */
  get ftp(): BambuFtpAdapterStub {
    return this.ftpAdapter;
  }

  /**
   * Check if FTP client is connected
   */
  get isConnected(): boolean {
    return this.connected && this.ftpAdapter.isConnected;
  }

  /**
   * Extract host from printer URL (remove protocol, port, etc.)
   */
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

  /**
   * Get API version (for compatibility with existing interface)
   * Note: Bambu Lab printers don't have a traditional API version endpoint
   */
  async getApiVersion(_login: LoginDto): Promise<{ version: string }> {
    this.logger.debug("[STUB] Getting Bambu API version");
    return { version: "bambu-1.0" };
  }
}
