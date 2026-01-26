// edited by claude on 2026.01.24.09.30
import { before, DELETE, GET, PATCH, POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { FileStorageService } from "@/services/file-storage.service";
import { MulterService } from "@/services/core/multer.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { extname } from "node:path";
import { validateInput } from "@/handlers/validators";
import { updateFileMetadataSchema, batchUpdateFileMetadataSchema } from "./validation/file-storage-controller.validation";
// End of Claude's edit

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

  @GET()
  async listFiles(req: Request, res: Response) {
    try {
      const files = await this.fileStorageService.listAllFiles();

      res.send({
        files: files.map(file => {
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
        totalCount: files.length,
      });
    } catch (error) {
      this.logger.error(`Failed to list files: ${error}`);
      res.status(500).send({ error: "Failed to list files" });
    }
  }

  // edited by claude on 2026.01.25.14.00
  // Specific routes must come BEFORE parameterized routes like /:fileStorageId
  /**
   * Get directory tree structure
   * GET /api/file-storage/directory-tree
   */
  @GET()
  @route("/directory-tree")
  async getDirectoryTree(req: Request, res: Response) {
    try {
      const tree = await this.fileStorageService.getDirectoryTree();
      res.send({ tree });
    } catch (error) {
      this.logger.error(`Failed to build directory tree: ${error}`);
      res.status(500).send({ error: "Failed to build directory tree" });
    }
  }

  /**
   * List all virtual directories
   * GET /api/file-storage/virtual-directories
   */
  @GET()
  @route("/virtual-directories")
  async listVirtualDirectories(req: Request, res: Response) {
    try {
      const directories = await this.fileStorageService.listVirtualDirectories();
      res.send({ directories, count: directories.length });
    } catch (error) {
      this.logger.error(`Failed to list virtual directories: ${error}`);
      res.status(500).send({ error: "Failed to list virtual directories" });
    }
  }

  /**
   * Create a virtual directory
   * POST /api/file-storage/virtual-directories
   * edited by claude on 2026.01.25.15.00 - Now returns all created markers for nested paths
   */
  @POST()
  @route("/virtual-directories")
  async createVirtualDirectory(req: Request, res: Response) {
    const { path: virtualPath } = req.body;

    if (!virtualPath || typeof virtualPath !== "string") {
      res.status(400).send({ error: "Invalid path" });
      return;
    }

    try {
      const createdMarkers = await this.fileStorageService.createVirtualDirectory(virtualPath);
      const leafMarker = createdMarkers[createdMarkers.length - 1];

      this.logger.log(`Created virtual directory: ${virtualPath} (${createdMarkers.length} markers)`);

      res.send({
        message: "Virtual directory created",
        markerId: leafMarker.markerId, // Deepest folder's markerId for backward compatibility
        path: virtualPath,
        createdMarkers // All created markers including intermediates
      });
    } catch (error) {
      this.logger.error(`Failed to create virtual directory: ${error}`);
      res.status(500).send({ error: "Failed to create virtual directory" });
    }
  }
  // End of Claude's edit

  /**
   * Delete a virtual directory
   * DELETE /api/file-storage/virtual-directories/:markerId
   */
  @DELETE()
  @route("/virtual-directories/:markerId")
  async deleteVirtualDirectory(req: Request, res: Response) {
    const { markerId } = req.params as { markerId: string };

    try {
      const deleted = await this.fileStorageService.deleteVirtualDirectory(markerId);

      if (!deleted) {
        res.status(404).send({ error: "Virtual directory not found" });
        return;
      }

      this.logger.log(`Deleted virtual directory: ${markerId}`);
      res.send({ message: "Virtual directory deleted", markerId });
    } catch (error) {
      this.logger.error(`Failed to delete virtual directory ${markerId}: ${error}`);
      res.status(500).send({ error: "Failed to delete virtual directory" });
    }
  }
  // End of Claude's edit

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

  // edited by claude on 2026.01.24.09.30
  /**
   * Update file metadata (fileName path and/or custom metadata)
   * PATCH /api/file-storage/:fileStorageId
   */
  @PATCH()
  @route("/:fileStorageId")
  async updateFileMetadata(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };

    try {
      const validatedData = await validateInput(req.body, updateFileMetadataSchema);

      await this.fileStorageService.updateFileMetadata(fileStorageId, {
        fileName: validatedData.fileName,
        path: validatedData.path, // edited by claude on 2026.01.24.17.45 - Add path field support
        metadata: validatedData.metadata,
      });

      // Return updated file info
      const updatedFile = await this.fileStorageService.getFileInfo(fileStorageId);

      if (!updatedFile) {
        res.status(404).send({ error: "File not found after update" });
        return;
      }

      const thumbnails = (updatedFile.metadata?._thumbnails || []).map((thumb: any) => ({
        index: thumb.index,
        width: thumb.width,
        height: thumb.height,
        format: thumb.format,
        size: thumb.size,
      }));

      res.send({
        fileStorageId: updatedFile.fileStorageId,
        fileName: updatedFile.fileName,
        fileFormat: updatedFile.fileFormat,
        fileSize: updatedFile.fileSize,
        fileHash: updatedFile.fileHash,
        createdAt: updatedFile.createdAt,
        thumbnails,
        metadata: updatedFile.metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to update file metadata for ${fileStorageId}: ${error}`);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).send({ error: error.message });
      } else {
        res.status(500).send({ error: "Failed to update file metadata" });
      }
    }
  }
  // End of Claude's edit

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

      this.logger.log(`Analysis complete for ${fileStorageId}: format=${metadata.fileFormat}, layers=${metadata.totalLayers}, time=${metadata.gcodePrintTimeSeconds}s, thumbnails=${thumbnails.length}`);

      const fileHash = await this.fileStorageService.calculateFileHash(filePath);
      const originalFileName = existingMetadata?._originalFileName || fileStorageId;

      metadata.fileName = originalFileName;

      let thumbnailMetadata: any[] = [];
      if (thumbnails.length > 0) {
        thumbnailMetadata = await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails);
        this.logger.log(`Saved ${thumbnailMetadata.length} thumbnails for ${fileStorageId}`);
      }

      await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, originalFileName, thumbnailMetadata);

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
      const isJPG = thumbnail[0] === 0xFF && thumbnail[1] === 0xD8;
      const isQOI = thumbnail[0] === 0x71 && thumbnail[1] === 0x6F && thumbnail[2] === 0x69 && thumbnail[3] === 0x66;

      // QOI format not supported by browser
      if (isQOI) {
        res.status(404).send({ error: "Thumbnail format not supported (QOI)" });
        return;
      }

      const mimeType = isJPG ? 'image/jpeg' : 'image/png';
      const base64 = thumbnail.toString('base64');
      res.send({
        thumbnailBase64: `data:${mimeType};base64,${base64}`,
      });
    } catch (error) {
      this.logger.error(`Failed to get thumbnail ${thumbnailIndex} for ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to get thumbnail" });
    }
  }

  // edited by claude on 2026.01.24.09.30
  /**
   * Batch update file metadata for multiple files
   * PATCH /api/file-storage/batch
   */
  @PATCH()
  @route("/batch")
  async batchUpdateFileMetadata(req: Request, res: Response) {
    try {
      const validatedData = await validateInput(req.body, batchUpdateFileMetadataSchema);

      const result = await this.fileStorageService.batchUpdateFileMetadata(validatedData.updates);

      this.logger.log(`Batch update completed: ${result.success.length} succeeded, ${result.failed.length} failed`);

      res.send({
        message: "Batch update completed",
        successCount: result.success.length,
        failedCount: result.failed.length,
        success: result.success,
        failed: result.failed,
      });
    } catch (error) {
      this.logger.error(`Failed to batch update file metadata: ${error}`);
      res.status(500).send({ error: "Failed to batch update file metadata" });
    }
  }
  // End of Claude's edit

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

      // Get file extension and create temp path with extension
      const ext = extname(file.originalname);
      const tempPathWithExt = file.path + ext;

      try {
        // Copy file with proper extension for analysis
        copyFileSync(file.path, tempPathWithExt);

        // Calculate file hash
        const fileHash = await this.fileStorageService.calculateFileHash(tempPathWithExt);

        // Analyze the file before saving
        this.logger.log(`Analyzing file: ${file.originalname} (ext: ${ext})`);
        const analysisResult = await this.fileAnalysisService.analyzeFile(tempPathWithExt);
        const metadata = analysisResult.metadata;
        const thumbnails = analysisResult.thumbnails;

        this.logger.log(
          `Analysis complete: format=${metadata.fileFormat}, layers=${metadata.totalLayers}, ` +
          `time=${metadata.gcodePrintTimeSeconds}s, filament=${metadata.filamentUsedGrams}g, ` +
          `thumbnails=${thumbnails.length}`
        );

        // Save file to storage
        const fileStorageId = await this.fileStorageService.saveFile(file, fileHash);
        this.logger.log(`Uploaded file ${file.originalname} as ${fileStorageId}`);

        // Save thumbnails
        let thumbnailMetadata: any[] = [];
        if (thumbnails.length > 0) {
          thumbnailMetadata = await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails);
          this.logger.log(`Saved ${thumbnailMetadata.length} thumbnail(s) for ${fileStorageId}`);
        }

        // Save metadata JSON with thumbnail index
        await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, file.originalname, thumbnailMetadata);
        this.logger.log(`Saved metadata JSON for ${fileStorageId}`);

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
        // Clean up temp file with extension
        if (existsSync(tempPathWithExt)) {
          unlinkSync(tempPathWithExt);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      res.status(500).send({ error: "Failed to upload file" });
    }
  }
}
