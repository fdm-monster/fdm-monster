import EventEmitter2 from "eventemitter2";
import { SettingsStore } from "@/state/settings.store";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { Client, FileInfo } from "basic-ftp";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import { unlinkSync, createReadStream, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { AppConstants } from "@/server.constants";
import { getMediaPath } from "@/utils/fs.utils";
import { errorSummary } from "@/utils/error.utils";

export class BambuFtpAdapter {
  protected readonly logger: LoggerService;

  private ftpClient: Client | null = null;
  private host: string | null = null;
  private accessCode: string | null = null;
  private isConnecting = false;

  constructor(
    private readonly settingsStore: SettingsStore,
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    this.settingsStore = settingsStore;
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(BambuFtpAdapter.name);
  }

  /**
   * Connect to FTP server
   */
  async connect(host: string, accessCode: string): Promise<void> {
    if (this.ftpClient && !this.ftpClient.closed) {
      this.logger.debug("FTP already connected");
      return;
    }

    if (this.isConnecting) {
      throw new Error("Connection already in progress");
    }

    // Validate and sanitize inputs
    const sanitizedHost = this.sanitizeHost(host);
    const sanitizedAccessCode = this.sanitizeAccessCode(accessCode);

    this.host = sanitizedHost;
    this.accessCode = sanitizedAccessCode;
    this.isConnecting = true;

    const timeout = this.settingsStore.getTimeoutSettings().apiTimeout;

    this.logger.log(`Connecting to Bambu FTP at ${sanitizedHost}:990`);

    try {
      this.ftpClient = new Client(timeout);

      // Enable logging if in debug mode
      this.ftpClient.ftp.verbose = false;

      await this.ftpClient.access({
        host: sanitizedHost,
        port: 990,
        user: "bblp",
        password: sanitizedAccessCode,
        secure: "implicit",
        secureOptions: {
          checkServerIdentity: () => {
            return undefined;
          },
          rejectUnauthorized: false,
        },
      });

      this.isConnecting = false;
      this.logger.log("FTP connected successfully");
    } catch (error) {
      this.isConnecting = false;
      this.cleanup();
      this.logger.error("FTP connection failed:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.ftpClient) {
      return;
    }

    this.logger.log("Disconnecting FTP");

    try {
      this.ftpClient.close();
    } catch (error) {
      this.logger.error("Error closing FTP:", error);
    } finally {
      this.cleanup();
    }
  }

  async listFiles(dirPath: string = "/"): Promise<FileInfo[]> {
    this.ensureConnected();

    try {
      this.logger.log(`Connecting ftp ${dirPath}`);
      const files = await this.ftpClient!.list(dirPath);
      this.logger.debug(`Listed ${files.length} files in ${dirPath}`);
      return files;
    } catch (error) {
      this.logger.error(`Failed to list files in ${dirPath}: ${errorSummary(error)}`);
      throw error;
    }
  }

  private getFileStoragePath(filename: string): string {
    const storagePath = join(getMediaPath(), AppConstants.defaultFileUploadsStorage);

    if (!existsSync(storagePath)) {
      mkdirSync(storagePath, { recursive: true });
    }

    return join(storagePath, filename);
  }

  async uploadFile(stream: Readable, remotePath: string, progressToken?: string): Promise<void> {
    this.ensureConnected();

    try {
      if (progressToken) {
        this.ftpClient!.trackProgress((info) => {
          this.eventEmitter2.emit(`${uploadProgressEvent(progressToken)}`, progressToken, {
            loaded: info.bytes,
            total: info.bytesOverall,
          });
        });
      }

      this.logger.log(`Uploading stream to ${remotePath}`);
      await this.ftpClient!.uploadFrom(stream, remotePath);

      this.ftpClient!.trackProgress();

      if (progressToken) {
        this.eventEmitter2.emit(`${uploadDoneEvent(progressToken)}`, progressToken);
      }

      this.logger.log(`File uploaded successfully: ${remotePath}`);
    } catch (error) {
      if (progressToken) {
        this.eventEmitter2.emit(`${uploadFailedEvent(progressToken)}`, progressToken, (error as Error)?.message);
      }
      this.logger.error(`Upload failed for ${remotePath}:`, error);
      throw error;
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    this.ensureConnected();

    try {
      this.logger.log(`Downloading ${remotePath} to ${localPath}`);
      await this.ftpClient!.downloadTo(localPath, remotePath);
      this.logger.log(`File downloaded successfully: ${remotePath}`);
    } catch (error) {
      this.logger.error(`Download failed for ${remotePath}:`, error);
      throw error;
    }
  }

  async downloadFileAsStream(remotePath: string): Promise<{ stream: Readable; tempPath: string; cleanup: () => void }> {
    this.ensureConnected();

    const filename = remotePath.split("/").pop() || "download";
    const tempPath = this.getFileStoragePath(`bambu-download-${Date.now()}-${filename}`);

    try {
      this.logger.log(`Downloading ${remotePath} to temp file for streaming`);
      await this.ftpClient!.downloadTo(tempPath, remotePath);
      this.logger.log(`File downloaded successfully: ${remotePath}`);

      const stream = createReadStream(tempPath);

      const cleanup = () => {
        try {
          unlinkSync(tempPath);
          this.logger.debug(`Cleaned up temp file: ${tempPath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to cleanup temp file ${tempPath}:`, cleanupError);
        }
      };

      stream.on("close", cleanup);
      stream.on("error", cleanup);

      return { stream, tempPath, cleanup };
    } catch (error) {
      try {
        unlinkSync(tempPath);
      } catch {}
      this.logger.error(`Download failed for ${remotePath}:`, error);
      throw error;
    }
  }

  async deleteFile(remotePath: string): Promise<void> {
    this.ensureConnected();

    try {
      this.logger.log(`Deleting file: ${remotePath}`);
      await this.ftpClient!.remove(remotePath);
      this.logger.log(`File deleted successfully: ${remotePath}`);
    } catch (error) {
      this.logger.error(`Delete failed for ${remotePath}:`, error);
      throw error;
    }
  }

  get isConnected(): boolean {
    return this.ftpClient != null && !this.ftpClient.closed;
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error("FTP not connected. Call connect() first.");
    }
  }

  private cleanup(): void {
    this.ftpClient = null;
  }

  private sanitizeHost(host: string): string {
    if (!host?.length) {
      throw new Error("Host must be a non-empty string");
    }

    const trimmed = host.trim();
    if (trimmed.length === 0) {
      throw new Error("Host cannot be empty");
    }

    // Validate format: IP address or hostname
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const hostnamePattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!ipv4Pattern.test(trimmed) && !hostnamePattern.test(trimmed)) {
      throw new Error("Invalid host format. Must be a valid IP address or hostname");
    }

    // Additional validation for IPv4 address ranges
    if (ipv4Pattern.test(trimmed)) {
      const parts = trimmed.split(".").map(Number);
      if (parts.some((part) => part < 0 || part > 255)) {
        throw new Error("Invalid IPv4 address. Octets must be between 0 and 255");
      }
    }

    return trimmed;
  }

  /**
   * Sanitize and validate access code input
   */
  private sanitizeAccessCode(accessCode: string): string {
    if (!accessCode?.length) {
      throw new Error("Access code must be a non-empty string");
    }

    // Trim whitespace
    const trimmed = accessCode.trim();

    if (trimmed.length === 0) {
      throw new Error("Access code cannot be empty");
    }

    // Bambu Lab access codes are typically 8 characters
    if (trimmed.length < 4 || trimmed.length > 32) {
      throw new Error("Access code must be between 4 and 32 characters");
    }

    // Ensure only alphanumeric characters (no special characters that could cause injection)
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;
    if (!alphanumericPattern.test(trimmed)) {
      throw new Error("Access code must contain only alphanumeric characters");
    }

    return trimmed;
  }
}
