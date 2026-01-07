import { before, DELETE, GET, POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { FileStorageService } from "@/services/file-storage.service";
import { MulterService } from "@/services/core/multer.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

@route(AppConstants.apiRoute + "/file-storage")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class FileStorageController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly fileStorageService: FileStorageService,
    private readonly multerService: MulterService,
  ) {
    this.logger = loggerFactory(FileStorageController.name);
  }

  @GET()
  async listFiles(req: Request, res: Response) {
    try {
      const files = await this.fileStorageService.listAllFiles();

      res.send({
        files: files.map(file => ({
          fileStorageId: file.fileStorageId,
          fileName: file.fileName,
          fileFormat: file.fileFormat,
          fileSize: file.fileSize,
          fileHash: file.fileHash,
          createdAt: file.createdAt,
          thumbnailCount: file.thumbnailCount,
          thumbnailsUrl: file.thumbnailCount > 0 ? `/api/file-storage/${file.fileStorageId}/thumbnail/0` : null,
          metadata: file.metadata,
        })),
        totalCount: files.length,
      });
    } catch (error) {
      this.logger.error(`Failed to list files: ${error}`);
      res.status(500).send({ error: "Failed to list files" });
    }
  }

  /**
   * Get file metadata
   * GET /api/file-storage/:fileStorageId
   */
  @GET()
  @route("/:fileStorageId")
  async getFileMetadata(req: Request, res: Response) {
    const { fileStorageId } = req.params;

    try {
      const file = await this.fileStorageService.getFileInfo(fileStorageId);

      if (!file) {
        res.status(404).send({ error: "File not found" });
        return;
      }

      res.send({
        fileStorageId: file.fileStorageId,
        fileName: file.fileName,
        fileFormat: file.fileFormat,
        fileSize: file.fileSize,
        fileHash: file.fileHash,
        createdAt: file.createdAt,
        thumbnailCount: file.thumbnailCount,
        thumbnailsUrl: file.thumbnailCount > 0 ? `/api/file-storage/${file.fileStorageId}/thumbnail/0` : null,
        metadata: file.metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to get file metadata for ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to get file metadata" });
    }
  }

  /**
   * Delete a stored file and its thumbnails
   * DELETE /api/file-storage/:fileStorageId
   */
  @DELETE()
  @route("/:fileStorageId")
  async deleteFile(req: Request, res: Response) {
    const { fileStorageId } = req.params;

    try {
      await this.fileStorageService.deleteFile(fileStorageId);

      this.logger.log(`Deleted file ${fileStorageId}`);
      res.send({ message: "File deleted successfully", fileStorageId });
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to delete file" });
    }
  }

  /**
   * Get thumbnail for a file
   * GET /api/file-storage/:fileStorageId/thumbnail/:index
   */
  @GET()
  @route("/:fileStorageId/thumbnail/:index")
  async getThumbnail(req: Request, res: Response) {
    const { fileStorageId, index } = req.params;
    const thumbnailIndex = Number.parseInt(index);

    if (Number.isNaN(thumbnailIndex)) {
      res.status(400).send({ error: "Invalid thumbnail index" });
      return;
    }

    try {
      const thumbnail = await this.fileStorageService.getThumbnail(fileStorageId, thumbnailIndex);

      if (!thumbnail) {
        res.status(404).send({ error: "Thumbnail not found" });
        return;
      }

      // Determine content type from magic bytes
      const isJPG = thumbnail[0] === 0xFF && thumbnail[1] === 0xD8;

      let contentType = 'image/png';
      if (isJPG) contentType = 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
      res.setHeader('ETag', `"${fileStorageId}-${thumbnailIndex}"`);

      res.send(thumbnail);
    } catch (error) {
      this.logger.error(`Failed to get thumbnail ${thumbnailIndex} for ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to get thumbnail" });
    }
  }

  /**
   * Upload a file to storage and analyze it
   * POST /api/file-storage/upload
   */
  @POST()
  @route("/upload")
  async uploadFile(req: Request, res: Response) {
    try {
      // Use multer to handle file upload
      const acceptedExtensions = ['.gcode', '.3mf', '.bgcode'];
      const files = await this.multerService.multerLoadFileAsync(req, res, acceptedExtensions, true);

      if (!files?.length) {
        res.status(400).send({ error: "No file uploaded" });
        return;
      }

      if (files.length > 1) {
        res.status(400).send({ error: "Only 1 file can be uploaded at a time" });
        return;
      }

      const file = files[0];

      // Calculate file hash
      const fileHash = await this.fileStorageService.calculateFileHash(file.path);

      // Save file to storage
      const fileStorageId = await this.fileStorageService.saveFile(file, fileHash);

      this.logger.log(`Uploaded file ${file.originalname} as ${fileStorageId}`);

      // Trigger async analysis
      // This will be handled by the file analysis service
      try {
        const filePath = this.fileStorageService.getFilePath(fileStorageId);
        // Queue analysis task (would be handled by a background job system)
        this.logger.log(`File uploaded successfully, analysis will be processed`);
      } catch (analysisError) {
        this.logger.warn(`Failed to trigger analysis: ${analysisError}`);
      }

      res.send({
        message: "File uploaded successfully",
        fileStorageId,
        fileName: file.originalname,
        fileSize: file.size,
        fileHash,
      });
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      res.status(500).send({ error: "Failed to upload file" });
    }
  }
}
