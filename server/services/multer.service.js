const multer = require("multer");
const { AppConstants } = require("../server.constants");
const { join } = require("path");
const fs = require("fs");

class MulterService {
  #fileUploadTrackerCache;
  #httpClient;

  constructor({ fileUploadTrackerCache, httpClient }) {
    this.#fileUploadTrackerCache = fileUploadTrackerCache;
    this.#httpClient = httpClient;
  }

  clearUploadsFolder() {
    if (!fs.existsSync(AppConstants.defaultFileUploadFolder)) return;

    const files = fs
      .readdirSync(AppConstants.defaultFileUploadFolder, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    for (const file of files) {
      fs.unlink(join(AppConstants.defaultFileUploadFolder, file), (err) => {
        if (err) throw err;
      });
    }
  }

  async downloadFile(downloadUrl, downloadFilename, collection) {
    const downloadFolder = join(AppConstants.defaultFileUploadFolder, collection);
    if (!fs.existsSync(downloadFolder)) {
      fs.mkdirSync(downloadFolder, { recursive: true });
    }
    const downloadPath = join(AppConstants.defaultFileUploadFolder, collection, downloadFilename);
    const fileStream = fs.createWriteStream(downloadPath);

    const res = await this.#httpClient.get(downloadUrl);
    return await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", async () => {
        resolve();
      });
    });
  }

  gcodeFileFilter(req, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== ".gcode") {
      return callback(new Error("Only .gcode files are allowed"));
    }
    callback(null, true);
  }

  getMulterGCodeFileFilter(storeAsFile = true) {
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

  getSessions() {
    return this.#fileUploadTrackerCache.getUploads();
  }
}

module.exports = MulterService;
