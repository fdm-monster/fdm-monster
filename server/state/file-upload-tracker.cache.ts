import { generateCorrelationToken } from "../utils/correlation-token.util";
import { uploadProgressEvent } from "../constants/event.constants";

/**
 * A generic cache for file upload progress
 */
export class FileUploadTrackerCache {
  #currentUploads = [];
  #uploadsDone = [];
  #uploadsFailed = [];
  #eventEmitter2;
  #logger;

  constructor({ loggerFactory, eventEmitter2 }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#logger = loggerFactory("Server-FileUploadTrackerCache");
  }

  progressCallback = (token, p) => {
    // Ensure binding of this is correct
    this.updateUploadProgress(token, p);
  };

  getUploads(filterHourOld = false) {
    const currentTime = Date.now();

    const done = this.#uploadsDone.filter((d) => currentTime - d.startedAt < 60 * 60 * 1000);
    const failed = this.#uploadsFailed.filter((d) => currentTime - d.startedAt < 60 * 60 * 1000);
    return filterHourOld
      ? {
          current: this.#currentUploads,
          done,
          failed,
        }
      : {
          current: this.#currentUploads,
          done: this.#uploadsDone,
          failed: this.#uploadsFailed,
        };
  }

  getUpload(correlationToken) {
    return this.#currentUploads.find((cu) => cu.correlationToken === correlationToken);
  }

  addUploadTracker(multerFile) {
    const correlationToken = generateCorrelationToken();
    this.#logger.log(`Starting upload session with token ${correlationToken}`);

    this.#eventEmitter2.on(uploadProgressEvent(correlationToken), this.progressCallback);

    this.#currentUploads.push({
      correlationToken,
      startedAt: Date.now(),
      multerFile,
      progress: {},
    });

    return correlationToken;
  }

  updateUploadProgress(token, progress, reason) {
    if (progress.done || progress.percent === 1) {
      this.#logger.log("Upload tracker completed");
      this.markUploadDone(token, true);
      this.#eventEmitter2.off(uploadProgressEvent(token), this.progressCallback);
    } else if (progress.failed) {
      this.markUploadDone(token, false, reason);
      this.#eventEmitter2.off(uploadProgressEvent(token), this.progressCallback);
    } else {
      const upload = this.getUpload(token);
      upload.progress = progress;
    }
  }

  markUploadDone(token, success, reason) {
    const trackedUploadIndex = this.#currentUploads.findIndex((cu) => cu.correlationToken === token);
    if (trackedUploadIndex === -1) {
      this.#logger.warn(`Could not mark upload tracker with token '${token}' as done as it was not found.`);
      return;
    }

    const trackedUpload = this.#currentUploads[trackedUploadIndex];

    if (success) {
      trackedUpload.failedAt = Date.now();
      trackedUpload.reason = reason;
      this.#uploadsDone.push(trackedUpload);
    } else {
      trackedUpload.succeededAt = Date.now();
      this.#uploadsFailed.push(trackedUpload);
    }
    this.#currentUploads.splice(trackedUploadIndex, 1);
  }
}
