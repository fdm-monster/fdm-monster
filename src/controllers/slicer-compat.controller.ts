import { GET, POST, route, before } from "awilix-express";
import { Request, Response } from "express";
import { FileStorageService } from "@/services/file-storage.service";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { MulterService } from "@/services/core/multer.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { AppConstants } from "@/server.constants";
import { slicerApiKeyAuth } from "@/middleware/slicer-api-key.middleware";

/**
 * OctoPrint-compatible API for PrusaSlicer and other slicer integration
 * Implements minimal OctoPrint API surface for file upload
 *
 * File operations require authentication
 */
@route("/api")
@before([slicerApiKeyAuth()])
export class SlicerCompatController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly fileStorageService: FileStorageService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly multerService: MulterService,
  ) {
    this.logger = loggerFactory(SlicerCompatController.name);
  }

  /**
   * OctoPrint version endpoint
   * GET /api/version
   */
  @GET()
  @route("/version")
  async getVersion(req: Request, res: Response) {
    res.send({
      api: "0.1",
      server: "1.9.0",
      text: "OctoPrint 1.9.3",
    });
  }

  /**
   * OctoPrint files endpoint - Upload file
   * POST /api/files/local
   *
   * This endpoint mimics OctoPrint's file upload API for slicer compatibility
   * PrusaSlicer uses: POST /api/files/local with multipart form data
   */
  @POST()
  @route("/files/local")
  async uploadFile(req: Request, res: Response) {
    let files: Express.Multer.File[] | undefined;

    try {
      // Accept all common 3D printer file formats
      const acceptedExtensions = [
        ...AppConstants.defaultAcceptedGcodeExtensions,
        ...AppConstants.defaultAcceptedBambuExtensions,
      ];

      // Load uploaded file using multer
      files = await this.multerService.multerLoadFileAsync(req, res, acceptedExtensions, true);

      if (!files?.length) {
        res.status(400).send({
          error: "No file uploaded",
        });
        return;
      }

      const file = files[0];
      const print = req.body.print === "true" || req.body.print === true;
      const select = req.body.select === "true" || req.body.select === true;

      await this.fileStorageService.validateUniqueFilename(file.originalname);

      const fileHash = await this.fileStorageService.calculateFileHash(file.path);
      const fileStorageId = await this.fileStorageService.saveFile(file, fileHash);
      const filePath = this.fileStorageService.getFilePath(fileStorageId);

      let metadata: any = {};
      let thumbnails: any[] = [];

      try {
        const analysisResult = await this.fileAnalysisService.analyzeFile(filePath);
        metadata = analysisResult.metadata;
        thumbnails = analysisResult.thumbnails || [];

        const thumbnailMetadata = thumbnails.length > 0
          ? await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails)
          : [];

        await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, file.originalname, thumbnailMetadata);
      } catch (analysisError) {
        this.logger.error(`Failed to analyze uploaded file: ${analysisError}`);
      }

      try {
        this.multerService.clearUploadedFile(file);
      } catch (e) {
        this.logger.error(`Could not remove uploaded file from temporary storage`);
      }

      // Return OctoPrint-compatible response
      res.status(201).send({
        files: {
          local: {
            name: file.originalname,
            origin: "local",
            refs: {
              resource: `/api/files/local/${fileStorageId}`,
              download: `/api/files/local/${fileStorageId}`,
            },
          },
        },
        done: true,
        // Additional FDM Monster metadata
        _fdmMonster: {
          fileStorageId,
          fileHash,
          analyzed: Object.keys(metadata).length > 0,
          thumbnailCount: thumbnails.length,
          printTime: metadata.gcodePrintTimeSeconds,
          filament: metadata.filamentUsedGrams,
        },
      });

      this.logger.log(`File uploaded to printer: ${file.originalname} -> ${fileStorageId}`);
    } catch (error) {
      // Clean up temp file if it exists
      if (files?.[0]?.path) {
        try {
          this.multerService.clearUploadedFile(files[0]);
        } catch (e) {
          this.logger.error(`Could not remove uploaded file from temporary storage`);
        }
      }

      // Re-throw to let exception filter handle it properly
      throw error;
    }
  }

  /**
   * Files list endpoint
   * GET /api/files
   */
  @GET()
  @route("/files")
  async listFiles(req: Request, res: Response) {
    try {
      const files = await this.fileStorageService.listAllFiles();

      // Convert to known format
      const knownFiles = files.map(file => ({
        name: file.metadata?._originalFileName || file.fileName,
        path: file.fileStorageId,
        type: "machinecode",
        typePath: ["machinecode", file.fileFormat],
        origin: "local",
        refs: {
          resource: `/api/files/local/${file.fileStorageId}`,
          download: `/api/files/local/${file.fileStorageId}`,
        },
        gcodeAnalysis: file.metadata ? {
          estimatedPrintTime: file.metadata.gcodePrintTimeSeconds,
          filament: {
            tool0: {
              length: file.metadata.filamentUsedMm,
              volume: file.metadata.filamentUsedCm3,
            },
          },
        } : undefined,
        date: Math.floor(file.createdAt.getTime() / 1000),
        size: file.fileSize,
      }));

      res.send({
        files: knownFiles,
        free: 0, // Not applicable
        total: 0, // Not applicable
      });
    } catch (error) {
      this.logger.error(`Failed to list files via printer API: ${error}`);
      throw error;
    }
  }

  /**
   * Server endpoint (for compatibility checks)
   * GET /api/server
   */
  @GET()
  @route("/server")
  async getServer(req: Request, res: Response) {
    res.send({
      version: "1.9.0",
      safemode: null,
    });
  }
}

