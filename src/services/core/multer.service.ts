import multer, { diskStorage, memoryStorage } from "multer";
import { extname, join } from "node:path";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { getMediaPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { FileUploadTrackerCache } from "@/state/file-upload-tracker.cache";
import type { Request, Response } from "express";
import { errorSummary } from "@/utils/error.utils";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { ValidationException } from "@/exceptions/runtime.exceptions";

export class MulterService {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly fileUploadTrackerCache: FileUploadTrackerCache,
  ) {
    this.logger = loggerFactory(MulterService.name);
  }

  public startTrackingSession(multerFile: Express.Multer.File, printerId: number) {
    return this.fileUploadTrackerCache.addUploadTracker(multerFile, printerId);
  }

  public clearUploadsFolder() {
    const fileUploadsPath = join(getMediaPath(), AppConstants.defaultFileUploadsStorage);
    if (!existsSync(fileUploadsPath)) return;

    const files = readdirSync(fileUploadsPath, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    for (const file of files) {
      try {
        rmSync(join(fileUploadsPath, file));
      } catch (error) {
        this.logger.error(`Could not clear upload file in temporary folder ${errorSummary(error)}`);
      }
    }
  }

  public clearUploadedFile(multerFile: Express.Multer.File) {
    if (existsSync(multerFile.path)) {
      rmSync(multerFile.path);
    } else {
      this.logger.warn("Cannot unlink temporarily uploaded file as it was not found");
    }
  }

  getMulterGCodeFileFilter(storeAsFile = true) {
    return this.getMulterFileFilter(storeAsFile);
  }

  async multerLoadFileAsync(req: Request, res: Response, fileExtensions: string[], storeAsFile = true) {
    const files = await new Promise<Express.Multer.File[]>((resolve, reject) =>
      this.getMulterFileFilter(storeAsFile)(req, res, (err) => {
        if (err) return reject(err);
        resolve(req.files as Express.Multer.File[]);
      }),
    );

    this.validateUploadedFiles(files, fileExtensions, storeAsFile);

    return files;
  }

  /**
   * Validates uploaded files against allowed extensions.
   * Removes invalid files if stored on disk and throws a ValidationException.
   */
  private validateUploadedFiles(
    files: Express.Multer.File[] | undefined,
    allowedExtensions: string[],
    storeAsFile: boolean,
  ) {
    if (!files?.length || !allowedExtensions?.length) return;

    for (const file of files) {
      const ext = extname(file.originalname)?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        // Remove invalid file if stored on disk
        if (storeAsFile && file.path && existsSync(file.path)) {
          try {
            rmSync(file.path);
          } catch (e) {
            this.logger.error(`Could not remove invalid file ${errorSummary(e)}`);
          }
        }

        throw new ValidationException({
          error: `Only files with extensions ${allowedExtensions.join(", ")} are allowed`,
        });
      }
    }
  }

  getMulterFileFilter(storeAsFile = true) {
    return multer({
      storage: storeAsFile
        ? diskStorage({
            destination: join(getMediaPath(), AppConstants.defaultFileUploadsStorage),
          })
        : memoryStorage(),
    }).any();
  }

  getSessions() {
    return this.fileUploadTrackerCache.getUploads();
  }
}
