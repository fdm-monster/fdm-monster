const multer = require("multer");
const { AppConstants } = require("../server.constants");
const { join, extname } = require("path");
const fs = require("fs");

class MulterService {
  #fileUploadTrackerCache;
  #httpClient;

  constructor({ fileUploadTrackerCache, httpClient }) {
    this.#fileUploadTrackerCache = fileUploadTrackerCache;
    this.#httpClient = httpClient;
  }

  clearUploadsFolder() {
    if (!fs.existsSync(AppConstants.defaultFileStorageFolder)) return;

    const files = fs
      .readdirSync(AppConstants.defaultFileStorageFolder, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    for (const file of files) {
      fs.unlink(join(AppConstants.defaultFileStorageFolder, file), (err) => {
        /* istanbul ignore next */
        if (err) throw err;
      });
    }
  }

  fileExists(downloadFilename, collection) {
    const downloadPath = join(AppConstants.defaultFileStorageFolder, collection, downloadFilename);
    return fs.existsSync(downloadPath);
  }

  async downloadFile(downloadUrl, downloadFilename, collection) {
    const downloadFolder = join(AppConstants.defaultFileStorageFolder, collection);
    if (!fs.existsSync(downloadFolder)) {
      fs.mkdirSync(downloadFolder, { recursive: true });
    }
    const downloadPath = join(AppConstants.defaultFileStorageFolder, collection, downloadFilename);
    const fileStream = fs.createWriteStream(downloadPath);

    const res = await this.#httpClient.get(downloadUrl);
    return await new Promise((resolve, reject) => {
      fileStream.write(res.data);
      fileStream.on("error", (err) => reject(err));
      fileStream.on("finish", async () => {
        resolve();
      });
      fileStream.on("close", async () => {
        resolve();
      });
    });
  }

  gcodeFileFilter(req, file, callback) {
    const ext = extname(file.originalname);
    if (ext !== ".gcode") {
      return callback(new Error("Only .gcode files are allowed"));
    }
    callback(null, true);
  }

  getMulterGCodeFileFilter(storeAsFile = true) {
    return multer({
      storage: storeAsFile
        ? multer.diskStorage({
            destination: AppConstants.defaultFileStorageFolder
          })
        : multer.memoryStorage(),
      fileFilter: this.gcodeFileFilter
    }).any();
  }

  startTrackingSession(multerFile) {
    return this.#fileUploadTrackerCache.addUploadTracker(multerFile);
  }

  getSessions() {
    return this.#fileUploadTrackerCache.getUploads();
  }
}

module.exports = MulterService;
