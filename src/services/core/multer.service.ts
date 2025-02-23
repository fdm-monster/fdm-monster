import multer, { FileFilterCallback } from "multer";
import { extname, join } from "path";
import { createWriteStream, existsSync, lstatSync, mkdirSync, readdirSync, unlink } from "fs";
import { superRootPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { AxiosStatic } from "axios";
import { FileUploadTrackerCache } from "@/state/file-upload-tracker.cache";
import { Request, Response } from "express";

export class MulterService {
  fileUploadTrackerCache: FileUploadTrackerCache;
  httpClient: AxiosStatic;

  constructor({
    fileUploadTrackerCache,
    httpClient,
  }: {
    fileUploadTrackerCache: FileUploadTrackerCache;
    httpClient: AxiosStatic;
  }) {
    this.fileUploadTrackerCache = fileUploadTrackerCache;
    this.httpClient = httpClient;
  }

  getNewestFile(collection: string) {
    const dirPath = this.collectionPath(collection);
    const files = this.orderRecentFiles(dirPath);
    const latestFile = files.length ? files[0] : undefined;
    return latestFile ? join(dirPath, latestFile.file) : undefined;
  }

  clearUploadsFolder() {
    const fileStoragePath = join(superRootPath(), AppConstants.defaultFileStorageFolder);
    if (!existsSync(fileStoragePath)) return;

    const files = readdirSync(fileStoragePath, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    for (const file of files) {
      unlink(join(fileStoragePath, file), (err) => {
        if (err) throw err;
      });
    }
  }

  fileExists(downloadFilename: string, collection: string) {
    const downloadPath = join(superRootPath(), AppConstants.defaultFileStorageFolder, collection, downloadFilename);
    return existsSync(downloadPath);
  }

  async downloadFile(downloadUrl: string, downloadFilename: string, collection: string) {
    const downloadFolder = join(superRootPath(), AppConstants.defaultFileStorageFolder, collection);
    if (!existsSync(downloadFolder)) {
      mkdirSync(downloadFolder, { recursive: true });
    }
    const downloadPath = join(superRootPath(), AppConstants.defaultFileStorageFolder, collection, downloadFilename);
    const fileStream = createWriteStream(downloadPath);

    const res = await this.httpClient.get(downloadUrl);
    return await new Promise((resolve, reject) => {
      fileStream.write(res.data);
      fileStream.on("error", (err) => {
        return reject(err);
      });
      fileStream.on("finish", async () => {
        return resolve(null);
      });
      fileStream.on("close", async () => {
        return resolve(null);
      });
      resolve(null);
    });
  }

  getMulterGCodeFileFilter(storeAsFile = true) {
    return this.getMulterFileFilter(AppConstants.defaultAcceptedGcodeExtensions, storeAsFile);
  }

  async multerLoadFileAsync(req: Request, res: Response, fileExtensions: string[], storeAsFile = true) {
    return await new Promise<Express.Multer.File[]>((resolve, reject) =>
      this.getMulterFileFilter(fileExtensions, storeAsFile)(req, res, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(req.files as Express.Multer.File[]);
      })
    );
  }

  getMulterFileFilter(fileExtensions: string[], storeAsFile = true) {
    return multer({
      storage: storeAsFile
        ? multer.diskStorage({
            destination: join(superRootPath(), AppConstants.defaultFileStorageFolder),
          })
        : multer.memoryStorage(),
      fileFilter: this.multerFileFilter(fileExtensions),
    }).any();
  }

  multerFileFilter(extensions: string[]) {
    return (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
      const ext = extname(file.originalname);
      if (extensions?.length && !extensions.includes(ext?.toLowerCase())) {
        return callback(new Error(`Only files with extensions ${extensions} are allowed`));
      }
      return callback(null, true);
    };
  }

  startTrackingSession(multerFile: Express.Multer.File) {
    return this.fileUploadTrackerCache.addUploadTracker(multerFile);
  }

  getSessions() {
    return this.fileUploadTrackerCache.getUploads();
  }

  private orderRecentFiles = (dir: string): { file: any; mtime: Date }[] => {
    return readdirSync(dir)
      .filter((file) => lstatSync(join(dir, file)).isFile())
      .map((file) => ({ file, mtime: lstatSync(join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  };

  private collectionPath(collection: string): string {
    return join(superRootPath(), AppConstants.defaultFileStorageFolder, collection);
  }
}
