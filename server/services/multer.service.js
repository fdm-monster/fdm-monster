const multer = require("multer");
const { AppConstants } = require("../server.constants");
const { join, extname } = require("path");
const fs = require("fs");
const { superRootPath } = require("../utils/fs.utils");

class MulterService {
  #fileUploadTrackerCache;
  #httpClient;

  constructor({ fileUploadTrackerCache, httpClient }) {
    this.#fileUploadTrackerCache = fileUploadTrackerCache;
    this.#httpClient = httpClient;
  }

  #orderRecentFiles = (dir) => {
    return fs
      .readdirSync(dir)
      .filter((file) => fs.lstatSync(join(dir, file)).isFile())
      .map((file) => ({ file, mtime: fs.lstatSync(join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  };

  #collectionPath(collection) {
    return join(superRootPath(), AppConstants.defaultFileStorageFolder, collection);
  }

  getNewestFile(collection) {
    const dirPath = this.#collectionPath(collection);
    const files = this.#orderRecentFiles(dirPath);
    const latestFile = files.length ? files[0] : undefined;
    return latestFile ? join(dirPath, latestFile.file) : undefined;
  }

  clearUploadsFolder() {
    const fileStoragePath = join(superRootPath(), AppConstants.defaultFileStorageFolder);
    if (!fs.existsSync(fileStoragePath)) return;

    const files = fs
      .readdirSync(fileStoragePath, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    for (const file of files) {
      fs.unlink(join(fileStoragePath, file), (err) => {
        /* istanbul ignore next */
        if (err) throw err;
      });
    }
  }

  fileExists(downloadFilename, collection) {
    const downloadPath = join(superRootPath(), AppConstants.defaultFileStorageFolder, collection, downloadFilename);
    return fs.existsSync(downloadPath);
  }

  async downloadFile(downloadUrl, downloadFilename, collection) {
    const downloadFolder = join(superRootPath(), AppConstants.defaultFileStorageFolder, collection);
    if (!fs.existsSync(downloadFolder)) {
      fs.mkdirSync(downloadFolder, { recursive: true });
    }
    const downloadPath = join(superRootPath(), AppConstants.defaultFileStorageFolder, collection, downloadFilename);
    const fileStream = fs.createWriteStream(downloadPath);

    const res = await this.#httpClient.get(downloadUrl);
    return await new Promise((resolve, reject) => {
      fileStream.write(res.data);
      fileStream.on("error", (err) => {
        return reject(err);
      });
      fileStream.on("finish", async () => {
        return resolve();
      });
      fileStream.on("close", async () => {
        return resolve();
      });
      resolve();
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
            destination: join(superRootPath(), AppConstants.defaultFileStorageFolder),
          })
        : multer.memoryStorage(),
      fileFilter: this.gcodeFileFilter,
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
