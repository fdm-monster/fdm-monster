const { generateCorrelationToken } = require("../../utils/correlation-token.util");
const { uploadProgressEvent, uploadCancelHandler } = require("../../constants/event.constants");
const { NotFoundException } = require("../../exceptions/runtime.exceptions");

/**
 * A generic cache for file upload progress
 */
class FileUploadTrackerCache {
  #currentUploads = [];
  #uploadsDone = [];
  #uploadsFailed = [];
  #uploadsCancelled = [];
  #eventEmitter2;
  #logger;

  constructor({ loggerFactory, eventEmitter2 }) {
    this.#eventEmitter2 = eventEmitter2;
    this.#logger = loggerFactory("Server-FileUploadTrackerCache");
  }

  progressCallback = (token, p) => {
    this.updateUploadProgress(token, p);
  };

  getUploads() {
    return {
      current: this.#currentUploads,
      done: this.#uploadsDone,
      failed: this.#uploadsFailed
    };
  }

  getUpload(correlationToken) {
    return this.#currentUploads.find((cu) => cu.correlationToken === correlationToken);
  }

  addUploadTracker(multerFile) {
    const correlationToken = generateCorrelationToken();

    this.#eventEmitter2.on(uploadProgressEvent(correlationToken), this.progressCallback);
    this.#eventEmitter2.once(uploadCancelHandler(correlationToken), (t, h) => this.setUploadCancelHandler(t,h));

    this.#currentUploads.push({
      correlationToken,
      startedAt: Date.now(),
      multerFile,
      progress: {}
    });

    return correlationToken;
  }

  setUploadCancelHandler(token, handler) {
    const uploadSession = this.getUpload(token);
    if (!uploadSession) {
      this.#logger.error("The upload session was not found, ignoring cancellation handler");
    }

    uploadSession.cancel = handler;
  }

  updateUploadProgress(token, progress, reason) {
    if (progress.done) {
      this.#logger.info("Upload tracker completed");
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
    const trackedUploadIndex = this.#currentUploads.findIndex(
      (cu) => cu.correlationToken === token
    );
    if (trackedUploadIndex === -1) {
      this.#logger.warning(
        `Could not mark upload tracker with token '${token}' as done as it was not found.`
      );
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

module.exports = FileUploadTrackerCache;
