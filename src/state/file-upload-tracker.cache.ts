import { generateCorrelationToken } from "@/utils/correlation-token.util";
import { uploadProgressEvent } from "@/constants/event.constants";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { AxiosProgressEvent } from "axios";
import { ILoggerFactory } from "@/handlers/logger-factory";

/**
 * A generic cache for file upload progress
 */
export class FileUploadTrackerCache {
  private currentUploads = [];
  private uploadsDone = [];
  private uploadsFailed = [];
  private eventEmitter2: EventEmitter2;
  private logger: LoggerService;

  constructor({ loggerFactory, eventEmitter2 }: { loggerFactory: ILoggerFactory; eventEmitter: EventEmitter2 }) {
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(FileUploadTrackerCache.name);
  }

  progressCallback = (token: string, p: AxiosProgressEvent) => {
    // Ensure binding of this is correct
    this.updateUploadProgress(token, p);
  };

  getUploads(filterHourOld = false) {
    const currentTime = Date.now();

    const done = this.uploadsDone.filter((d) => currentTime - d.startedAt < 60 * 60 * 1000);
    const failed = this.uploadsFailed.filter((d) => currentTime - d.startedAt < 60 * 60 * 1000);
    return filterHourOld
      ? {
          current: this.currentUploads,
          done,
          failed,
        }
      : {
          current: this.currentUploads,
          done: this.uploadsDone,
          failed: this.uploadsFailed,
        };
  }

  getUpload(correlationToken: string) {
    return this.currentUploads.find((cu) => cu.correlationToken === correlationToken);
  }

  addUploadTracker(multerFile: Express.Multer.File) {
    const correlationToken = generateCorrelationToken();
    this.logger.log(`Starting upload session with token ${correlationToken}`);

    this.eventEmitter2.on(uploadProgressEvent(correlationToken), this.progressCallback);

    this.currentUploads.push({
      correlationToken,
      startedAt: Date.now(),
      multerFile,
      progress: {},
    });

    return correlationToken;
  }

  updateUploadProgress(token: string, progress: AxiosProgressEvent, reason: string) {
    if (progress.done || progress.percent === 1) {
      this.logger.log("Upload tracker completed");
      this.markUploadDone(token, true);
      this.eventEmitter2.off(uploadProgressEvent(token), this.progressCallback);
    } else if (progress.failed) {
      this.markUploadDone(token, false, reason);
      this.eventEmitter2.off(uploadProgressEvent(token), this.progressCallback);
    } else {
      const upload = this.getUpload(token);
      upload.progress = progress;
    }
  }

  markUploadDone(token: string, success, reason: string) {
    const trackedUploadIndex = this.currentUploads.findIndex((cu) => cu.correlationToken === token);
    if (trackedUploadIndex === -1) {
      this.logger.warn(`Could not mark upload tracker with token '${token}' as done as it was not found.`);
      return;
    }

    const trackedUpload = this.currentUploads[trackedUploadIndex];

    if (success) {
      trackedUpload.failedAt = Date.now();
      trackedUpload.reason = reason;
      this.uploadsDone.push(trackedUpload);
    } else {
      trackedUpload.succeededAt = Date.now();
      this.uploadsFailed.push(trackedUpload);
    }
    this.currentUploads.splice(trackedUploadIndex, 1);
  }
}
