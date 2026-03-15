import { generateCorrelationToken } from "@/utils/correlation-token.util";
import { uploadDoneEvent, uploadFailedEvent, uploadProgressEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { AxiosProgressEvent } from "axios";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { TrackedUpload } from "@/services/interfaces/file-upload-tracker.interface";

export class FileUploadTrackerCache {
  private readonly currentUploads: TrackedUpload[] = [];

  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    this.logger = loggerFactory(FileUploadTrackerCache.name);

    this.eventEmitter2.on(uploadProgressEvent("*"), (token, progress) => this.handleUploadProgress(token, progress));
    this.eventEmitter2.on(uploadDoneEvent("*"), (token: string) => this.handleUploadDone(token));
    this.eventEmitter2.on(uploadFailedEvent("*"), (token: string, reason?: string) =>
      this.handleUploadFailed(token, reason),
    );
  }

  getUploads() {
    return {
      current: this.currentUploads,
    };
  }

  getUpload(correlationToken: string) {
    return this.currentUploads.find((cu) => cu.correlationToken === correlationToken);
  }

  addUploadTracker(multerFile: Express.Multer.File, printerId: number) {
    const correlationToken = generateCorrelationToken();
    this.logger.log(`Starting upload session with token ${correlationToken}`);

    this.currentUploads.push({
      correlationToken,
      printerId,
      startedAt: Date.now(),
      multerFile,
      progress: 0,
      completed: false,
      completedAt: null,
      success: null,
      reason: null,
    });

    return correlationToken;
  }

  handleUploadProgress(token: string, event: AxiosProgressEvent) {
    const upload = this.getUpload(token);
    if (!upload) {
      return;
    }
    upload.progress = event.progress ?? null;
  }

  handleUploadFailed(token: string, reason?: string) {
    this.logger.log(`Upload tracker ${token} completed with failure`);
    this.markUploadDone(token, false, reason);
  }

  handleUploadDone(token: string) {
    this.logger.log(`Upload tracker ${token} completed with success`);
    this.markUploadDone(token, true);
  }

  markUploadDone(token: string, success: boolean, reason?: string) {
    const trackedUploadIndex = this.currentUploads.findIndex((cu) => cu.correlationToken === token);
    if (trackedUploadIndex === -1) {
      this.logger.warn(`Could not mark upload tracker with correlation token '${token}' as done as it was not found.`);
      return;
    }

    const trackedUpload = this.currentUploads[trackedUploadIndex];

    trackedUpload.completed = true;
    trackedUpload.success = success;
    trackedUpload.completedAt = Date.now();
    trackedUpload.reason = reason ?? null;
  }
}
