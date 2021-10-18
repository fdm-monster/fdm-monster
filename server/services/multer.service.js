const multer = require("multer");
const { AppConstants } = require("../app.constants");
const path = require("path");
const fs = require("fs");

class MulterService {
  #fileUploadTrackerCache;

  constructor({ fileUploadTrackerCache }) {
    this.#fileUploadTrackerCache = fileUploadTrackerCache;
  }

  clearUploadsFolder() {
    fs.readdir(AppConstants.defaultFileUploadFolder, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(AppConstants.defaultFileUploadFolder, file), err => {
          if (err) throw err;
        });
      }
    });
  }

  gcodeFileFilter(req, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== ".gcode") {
      return callback(new Error("Only .gcode files are allowed"));
    }
    callback(null, true);
  }

  getMulterGCodeFilesFilter(storeAsFile = true) {
    return multer({
      storage: storeAsFile
        ? multer.diskStorage({
          destination: AppConstants.defaultFileUploadFolder
        })
        : multer.memoryStorage(),
      fileFilter: this.gcodeFileFilter
    }).any();
  }

  startTrackingSession(multerFile) {
    return this.#fileUploadTrackerCache.addUploadTracker(multerFile);
  }

  cancelUpload(token) {
    const session = this.#fileUploadTrackerCache.getUpload(token);
    if (typeof session?.cancel === "function") {
      session.cancel();
    } else {
      return { error: "This session has no cancellation callback bound" };
    }
  }

  getSessions() {
    return this.#fileUploadTrackerCache.getUploads();
  }
}

module.exports = MulterService;
