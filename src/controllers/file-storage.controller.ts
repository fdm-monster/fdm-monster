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
import { BadRequestException } from "@/exceptions/runtime.exceptions";
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { extname } from "node:path";
import { validateInput } from "@/handlers/validators";
import { updateFileMetadataSchema, batchUpdateFileMetadataSchema } from "./validation/file-storage-controller.validation";

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
        markerId: leafMarker.markerId,
        path: virtualPath,
        createdMarkers
      });
    } catch (error) {
      this.logger.error(`Failed to create virtual directory: ${error}`);
      res.status(500).send({ error: "Failed to create virtual directory" });
    }
  }

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

  @PATCH()
  @route("/:fileStorageId")
  async updateFileMetadata(req: Request, res: Response) {
    const { fileStorageId } = req.params as { fileStorageId: string };

    try {
      const validatedData = await validateInput(req.body, updateFileMetadataSchema);

      await this.fileStorageService.updateFileMetadata(fileStorageId, {
        fileName: validatedData.fileName,
        path: validatedData.path,
        metadata: validatedData.metadata,
      });

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

  @POST()
  @route("/upload")
  async uploadFile(req: Request, res: Response) {
    const acceptedExtensions = ['.gcode', '.3mf', '.bgcode'];
    const files = await this.multerService.multerLoadFileAsync(req, res, acceptedExtensions, true);

    if (!files?.length) {
      throw new BadRequestException("No file uploaded");
    }

    if (files.length > 1) {
      throw new BadRequestException("Only 1 file can be uploaded at a time");
    }

    const file = files[0];
    await this.fileStorageService.validateUniqueFilename(file.originalname);

    const ext = extname(file.originalname);
    const tempPathWithExt = file.path + ext;

    try {
      copyFileSync(file.path, tempPathWithExt);

      const fileHash = await this.fileStorageService.calculateFileHash(tempPathWithExt);
      this.logger.log(`Analyzing ${file.originalname}`);
      const analysisResult = await this.fileAnalysisService.analyzeFile(tempPathWithExt);
      const { metadata, thumbnails } = analysisResult;

      const fileStorageId = await this.fileStorageService.saveFile(file, fileHash);
      this.logger.log(`Saved ${file.originalname} as ${fileStorageId}`);

      const thumbnailMetadata = thumbnails.length > 0
        ? await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails)
        : [];

      await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, file.originalname, thumbnailMetadata);

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
