import { before, DELETE, GET, PATCH, POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import type { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { FileStorageService } from "@/services/file-storage.service";
import { MulterService } from "@/services/core/multer.service";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { BadRequestException, NotFoundException, ConflictException } from "@/exceptions/runtime.exceptions";
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { extname } from "node:path";

@route(AppConstants.apiRoute + "/file-storage")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class FileStorageController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly fileStorageService: FileStorageService,
    private readonly multerService: MulterService,
    private readonly fileAnalysisService: FileAnalysisService,
  ) {
    this.logger = loggerFactory(FileStorageController.name);
  }

  @POST()
  @route("/bulk/delete")
  async bulkDeleteFiles(req: Request, res: Response) {
    const { fileIds } = req.body as { fileIds?: string[] };

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).send({ error: "fileIds must be a non-empty array" });
      return;
    }

    if (fileIds.length > 100) {
      res.status(400).send({ error: "Maximum 100 files can be deleted at once" });
      return;
    }

    let deleted = 0;
    let failed = 0;
    const errors: Array<{ fileId: string; error: string }> = [];

    for (const fileId of fileIds) {
      try {
        const fileExists = await this.fileStorageService.fileExists(fileId);
        if (!fileExists) {
          throw new Error("File not found");
        }
        await this.fileStorageService.deleteFile(fileId);
        deleted++;
        this.logger.log(`Bulk delete: deleted file ${fileId}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ fileId, error: errorMessage });
        this.logger.error(`Bulk delete: failed to delete file ${fileId}: ${errorMessage}`);
      }
    }

    res.send({
      deleted,
      failed,
      errors,
    });
  }

  @POST()
  @route("/bulk/analyze")
  async bulkAnalyzeFiles(req: Request, res: Response) {
    const { fileIds } = req.body as { fileIds?: string[] };

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).send({ error: "fileIds must be a non-empty array" });
      return;
    }

    if (fileIds.length > 100) {
      res.status(400).send({ error: "Maximum 100 files can be analyzed at once" });
      return;
    }

    let analyzed = 0;
    let failed = 0;
    const errors: Array<{ fileId: string; error: string }> = [];

    for (const fileId of fileIds) {
      try {
        const filePath = this.fileStorageService.getFilePath(fileId);
        const fileExists = await this.fileStorageService.fileExists(fileId);
        if (!fileExists) {
          throw new Error("File not found");
        }

        const existingMetadata = await this.fileStorageService.loadMetadata(fileId);
        const analysisResult = await this.fileAnalysisService.analyzeFile(filePath);
        const metadata = analysisResult.metadata;
        const thumbnails = analysisResult.thumbnails;

        const fileHash = await this.fileStorageService.calculateFileHash(filePath);
        const originalFileName = existingMetadata?._originalFileName || fileId;
        metadata.fileName = originalFileName;

        const thumbnailMetadata =
          thumbnails.length > 0 ? await this.fileStorageService.saveThumbnails(fileId, thumbnails) : [];

        await this.fileStorageService.saveMetadata(fileId, metadata, fileHash, originalFileName, thumbnailMetadata);

        analyzed++;
        this.logger.log(`Bulk analyze: analyzed file ${fileId}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ fileId, error: errorMessage });
        this.logger.error(`Bulk analyze: failed to analyze file ${fileId}: ${errorMessage}`);
      }
    }

    res.send({
      analyzed,
      failed,
      errors,
    });
  }

  @GET()
  async listFiles(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number.parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? Number.parseInt(req.query.pageSize as string) : 50;
      const type = req.query.type as "gcode" | "3mf" | "bgcode" | undefined;
      const sortBy = (req.query.sortBy as "createdAt" | "name" | "type") || "createdAt";
      const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";
      const parentId = req.query.parentId ? Number.parseInt(req.query.parentId as string) : undefined;

      const result = await this.fileStorageService.listAllFiles({
        page,
        pageSize,
        type,
        sortBy,
        sortOrder,
        parentId,
      });

      res.send({
        files: result.files.map((file) => {
          const thumbnails = (file.metadata?._thumbnails || []).map((thumb: any) => ({
            index: thumb.index,
            width: thumb.width,
            height: thumb.height,
            format: thumb.format,
            size: thumb.size,
          }));
          return {
            fileStorageId: file.fileStorageId,
            fileName: file.fileName,
            fileFormat: file.fileFormat,
            fileSize: file.fileSize,
            fileHash: file.fileHash,
            createdAt: file.createdAt,
            thumbnails,
            metadata: file.metadata,
          };
        }),
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
      });
    } catch (error) {
      this.logger.error(`Failed to list files: ${error}`);
      res.status(500).send({ error: "Failed to list files" });
    }
  }

  @GET()
  @route("/:fileStorageId/path")
  async getFilePath(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };

    try {
      const fileRecord = await this.fileStorageService.getFileRecordByGuid(fileStorageId);
      if (!fileRecord) {
        res.status(404).send({ error: "File not found" });
        return;
      }

      const path = await this.fileStorageService.getPath(fileRecord.id);

      res.send({
        path: path.map((record) => ({
          id: record.id,
          name: record.name,
          type: record.type,
          fileGuid: record.fileGuid,
        })),
        targetId: fileRecord.id,
        targetName: fileRecord.name,
      });
    } catch (error) {
      this.logger.error(`Failed to get file path for ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to get file path" });
    }
  }

  /**
   * Get file metadata
   * GET /api/file-storage/:fileStorageId
   */
  @GET()
  @route("/:fileStorageId")
  async getFileMetadata(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };

    try {
      const file = await this.fileStorageService.getFileInfo(fileStorageId);

      if (!file) {
        res.status(404).send({ error: "File not found" });
        return;
      }

      const thumbnails = (file.metadata?._thumbnails || []).map((thumb: any) => ({
        index: thumb.index,
        width: thumb.width,
        height: thumb.height,
        format: thumb.format,
        size: thumb.size,
      }));

      res.send({
        fileStorageId: file.fileStorageId,
        fileName: file.fileName,
        fileFormat: file.fileFormat,
        fileSize: file.fileSize,
        fileHash: file.fileHash,
        createdAt: file.createdAt,
        thumbnails,
        metadata: file.metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to get file metadata for ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to get file metadata" });
    }
  }

  /**
   * Update file metadata (rename)
   * PATCH /api/file-storage/:fileStorageId
   */
  @PATCH()
  @route("/:fileStorageId")
  async updateFileMetadata(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };
    const { originalFileName } = req.body as { originalFileName?: string };

    if (!originalFileName) {
      res.status(400).send({ error: "originalFileName is required" });
      return;
    }

    try {
      const fileRecord = await this.fileStorageService.getFileRecordByGuid(fileStorageId);
      if (!fileRecord) {
        res.status(404).send({ error: "File not found" });
        return;
      }

      await this.fileStorageService.updateFileRecord(fileRecord.id, {
        name: originalFileName,
      });

      const metadata = await this.fileStorageService.loadMetadata(fileStorageId);
      if (metadata) {
        metadata._originalFileName = originalFileName;
        await this.fileStorageService.saveMetadata(
          fileStorageId,
          metadata,
          metadata._fileHash,
          originalFileName,
          metadata._thumbnails,
        );
      }

      this.logger.log(`Updated file metadata for ${fileStorageId}: ${originalFileName}`);
      res.send({
        message: "File metadata updated",
        fileStorageId,
        fileName: originalFileName,
      });
    } catch (error) {
      this.logger.error(`Failed to update file metadata for ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to update file metadata" });
    }
  }

  /**
   * Delete a stored file and its thumbnails
   * DELETE /api/file-storage/:fileStorageId
   */
  @DELETE()
  @route("/:fileStorageId")
  async deleteFile(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };

    try {
      await this.fileStorageService.deleteFile(fileStorageId);

      this.logger.log(`Deleted file ${fileStorageId}`);
      res.send({ message: "File deleted successfully", fileStorageId });
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to delete file" });
    }
  }

  @POST()
  @route("/:fileStorageId/analyze")
  async analyzeFile(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };

    try {
      const filePath = this.fileStorageService.getFilePath(fileStorageId);
      const fileExists = await this.fileStorageService.fileExists(fileStorageId);
      if (!fileExists) {
        res.status(404).send({ error: "File not found" });
        return;
      }
      this.logger.log(`Analyzing file: ${fileStorageId}`);

      // Load existing metadata to preserve original filename
      const existingMetadata = await this.fileStorageService.loadMetadata(fileStorageId);

      const analysisResult = await this.fileAnalysisService.analyzeFile(filePath);
      const metadata = analysisResult.metadata;
      const thumbnails = analysisResult.thumbnails;

      this.logger.log(
        `Analysis complete for ${fileStorageId}: format=${metadata.fileFormat}, layers=${metadata.totalLayers}, time=${metadata.gcodePrintTimeSeconds}s, thumbnails=${thumbnails.length}`,
      );

      const fileHash = await this.fileStorageService.calculateFileHash(filePath);
      const originalFileName = existingMetadata?._originalFileName || fileStorageId;

      metadata.fileName = originalFileName;

      let thumbnailMetadata: any[] = [];
      if (thumbnails.length > 0) {
        thumbnailMetadata = await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails);
        this.logger.log(`Saved ${thumbnailMetadata.length} thumbnails for ${fileStorageId}`);
      }

      await this.fileStorageService.saveMetadata(
        fileStorageId,
        metadata,
        fileHash,
        originalFileName,
        thumbnailMetadata,
      );

      res.send({
        message: "File analyzed successfully",
        fileStorageId,
        metadata,
        thumbnailCount: thumbnails.length,
      });
    } catch (error) {
      this.logger.error(`Failed to analyze file ${fileStorageId}: ${error}`);
      res.status(500).send({ error: `Failed to analyze file: ${error}` });
    }
  }

  @GET()
  @route("/:fileStorageId/thumbnail/:index")
  async getThumbnailByIndex(req: Request, res: Response) {
    const { fileStorageId, index } = req.params as { fileStorageId: string; index: string };
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
      const isJPG = thumbnail[0] === 0xff && thumbnail[1] === 0xd8;
      const isQOI = thumbnail[0] === 0x71 && thumbnail[1] === 0x6f && thumbnail[2] === 0x69 && thumbnail[3] === 0x66;

      // QOI format not supported by browser
      if (isQOI) {
        res.status(404).send({ error: "Thumbnail format not supported (QOI)" });
        return;
      }

      const mimeType = isJPG ? "image/jpeg" : "image/png";
      const base64 = thumbnail.toString("base64");
      res.send({
        thumbnailBase64: `data:${mimeType};base64,${base64}`,
      });
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
    const acceptedExtensions = [".gcode", ".3mf", ".bgcode"];
    const files = await this.multerService.multerLoadFileAsync(req, res, acceptedExtensions, true);

    if (!files?.length) {
      throw new BadRequestException("No file uploaded");
    }

    if (files.length > 1) {
      throw new BadRequestException("Only 1 file can be uploaded at a time");
    }

    const file = files[0];
    await this.fileStorageService.validateUniqueFilename(file.originalname);

    const parentIdRaw = req.body.parentId;
    const parentId = parentIdRaw ? Number.parseInt(parentIdRaw, 10) : 0;

    if (Number.isNaN(parentId)) {
      res.status(400).send({ error: "Invalid parentId - must be a number" });
      return;
    }

    if (parentId !== 0) {
      try {
        await this.fileStorageService.validateParentDirectory(parentId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          res.status(404).send({ error: error.message });
          return;
        }
        if (error instanceof ConflictException) {
          res.status(400).send({ error: error.message });
          return;
        }
        throw error;
      }
    }

    const ext = extname(file.originalname);
    const tempPathWithExt = file.path + ext;

    try {
      copyFileSync(file.path, tempPathWithExt);

      const fileHash = await this.fileStorageService.calculateFileHash(tempPathWithExt);
      this.logger.log(`Analyzing ${file.originalname}`);
      const analysisResult = await this.fileAnalysisService.analyzeFile(tempPathWithExt);
      const { metadata, thumbnails } = analysisResult;

      const fileStorageId = await this.fileStorageService.saveFile(file, fileHash, parentId);
      this.logger.log(`Saved ${file.originalname} as ${fileStorageId}`);

      const thumbnailMetadata =
        thumbnails.length > 0 ? await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails) : [];

      await this.fileStorageService.saveMetadata(
        fileStorageId,
        metadata,
        fileHash,
        file.originalname,
        thumbnailMetadata,
      );

      res.send({
        message: "File uploaded successfully",
        fileStorageId,
        fileName: file.originalname,
        fileSize: file.size,
        fileHash,
        metadata,
        thumbnailCount: thumbnails.length,
      });
    } finally {
      if (existsSync(tempPathWithExt)) {
        unlinkSync(tempPathWithExt);
      }
    }
  }
}
