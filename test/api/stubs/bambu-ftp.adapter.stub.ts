import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { FileInfo } from "basic-ftp";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import { Readable } from "node:stream";

/**
 * Stub implementation of BambuFtpAdapter for testing
 * Avoids actual network connections while maintaining the same interface
 */
export class BambuFtpAdapterStub {
  protected readonly logger: LoggerService;

  private isConnecting = false;
  private connected = false;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory("BambuFtpAdapterStub");
  }

  async connect(host: string, _accessCode: string): Promise<void> {
    if (this.connected) {
      this.logger.debug("FTP already connected (stub)");
      return;
    }

    if (this.isConnecting) {
      throw new Error("Connection already in progress");
    }

    this.isConnecting = true;

    this.logger.log(`[STUB] Connecting to Bambu FTP at ${ host }:990`);

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.isConnecting = false;
    this.connected = true;
    this.logger.log("[STUB] FTP connected successfully");
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.logger.log("[STUB] Disconnecting FTP");
    this.connected = false;
  }

  async listFiles(dirPath: string = "/"): Promise<FileInfo[]> {
    this.ensureConnected();

    this.logger.debug(`[STUB] Listing files in ${dirPath}`);

    // Return mock file list
    const now = new Date();
    return [
      {
        name: "sample.3mf",
        size: 1024,
        modifiedAt: now,
        rawModifiedAt: now.toISOString(),
        date: now.toISOString().split("T")[0],
        type: 1, // File type
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
      },
      {
        name: "test.gcode",
        size: 2048,
        modifiedAt: now,
        rawModifiedAt: now.toISOString(),
        date: now.toISOString().split("T")[0],
        type: 1,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
      },
    ];
  }

  async uploadFile(stream: Readable, filename: string, progressToken?: string): Promise<void> {
    this.ensureConnected();

    const remotePath = `/${filename}`;

    try {
      this.logger.log(`[STUB] Uploading ${filename} to ${remotePath}`);

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", reject);
        stream.on("end", resolve);
      });

      const fileBuffer = Buffer.concat(chunks);

      if (progressToken) {
        const totalSize = fileBuffer.length;
        let uploaded = 0;

        const progressInterval = setInterval(() => {
          uploaded = Math.min(uploaded + totalSize / 4, totalSize);
          this.eventEmitter2.emit(`${uploadProgressEvent(progressToken)}`, progressToken, {
            loaded: uploaded,
            total: totalSize,
          });

          if (uploaded >= totalSize) {
            clearInterval(progressInterval);
          }
        }, 50);

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (progressToken) {
        this.eventEmitter2.emit(`${uploadDoneEvent(progressToken)}`, progressToken);
      }

      this.logger.log(`[STUB] File uploaded successfully: ${filename}`);
    } catch (error) {
      if (progressToken) {
        this.eventEmitter2.emit(`${uploadFailedEvent(progressToken)}`, progressToken, (error as Error)?.message);
      }

      this.logger.error(`[STUB] Upload failed for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Download file from printer (stubbed)
   */
  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    this.ensureConnected();

    this.logger.log(`[STUB] Downloading ${remotePath} to ${localPath}`);

    // Simulate download delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`[STUB] File downloaded successfully: ${remotePath}`);
  }

  /**
   * Delete file from printer (stubbed)
   */
  async deleteFile(remotePath: string): Promise<void> {
    this.ensureConnected();

    this.logger.log(`[STUB] Deleting file: ${remotePath}`);

    // Simulate delete delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    this.logger.log(`[STUB] File deleted successfully: ${remotePath}`);
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ensure FTP is connected
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error("FTP not connected");
    }
  }
}
