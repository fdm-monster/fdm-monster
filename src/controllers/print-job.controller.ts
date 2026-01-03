import { before, DELETE, GET, POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { searchJobsSchema, searchJobsPagedSchema } from "@/services/validators/print-job.validation";
import { validateInput } from "@/handlers/validators";
import { PrintJobService } from "@/services/orm/print-job.service";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { FileStorageService } from "@/services/file-storage.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { ParamId, ParamInt } from "@/middleware/param-converter.middleware";
import { NotFoundException } from "@/exceptions/runtime.exceptions";

@route(AppConstants.apiRoute + "/print-jobs")
@before([authenticate(), authorizeRoles([ROLES.ADMIN])])
export class PrintJobController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printJobService: PrintJobService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly fileStorageService: FileStorageService,
  ) {
    this.logger = loggerFactory(PrintJobController.name);
  }

  @GET()
  @route("/search")
  async searchJobs(req: Request, res: Response) {
    const { searchPrinter, searchFile, startDate, endDate } = await validateInput(req.query, searchJobsSchema);

    // Convert endDate to end of day (23:59:59.999) to include jobs from that day
    const endDateObj = endDate ? this.toEndOfDay(new Date(endDate)) : undefined;

    const result = await this.printJobService.searchPrintJobs(
      searchPrinter,
      searchFile,
      startDate ? new Date(startDate) : undefined,
      endDateObj,
    );
    res.send(result);
  }

  @GET()
  @route("/search-paged")
  async searchJobsPaged(req: Request, res: Response) {
    const { page, pageSize, searchPrinter, searchFile, startDate, endDate } = await validateInput(
      req.query,
      searchJobsPagedSchema,
    );

    // Convert endDate to end of day (23:59:59.999) to include jobs from that day
    const endDateObj = endDate ? this.toEndOfDay(new Date(endDate)) : undefined;

    const [items, count] = await this.printJobService.searchPrintJobsPaged(
      searchPrinter,
      searchFile,
      startDate ? new Date(startDate) : undefined,
      endDateObj,
      page,
      pageSize,
    );

    res.send({ items, count, pages: Math.ceil(count / pageSize) });
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async getJob(req: Request, res: Response) {
    const jobId = req.local.id;

    const job = await this.printJobService.getJobByIdOrFail(jobId, ['printer']);

    try {
      // Get thumbnail count if available
      let thumbnailCount = 0;
      if (job.fileStorageId) {
        const thumbnails = await this.fileStorageService.listThumbnails(job.fileStorageId);
        thumbnailCount = thumbnails.length;
      }

      res.send({
        ...job,
        thumbnailCount,
        thumbnailsUrl: thumbnailCount > 0 ? `/api/print-jobs/${jobId}/thumbnails` : null,
      });
    } catch (error) {
      this.logger.error(`Failed to get job ${jobId}: ${error}`);
      res.status(500).send({ error: "Failed to get job" });
    }
  }

  @POST()
  @route("/:id/set-completed")
  @before([ParamId("id")])
  async setCompleted(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    try {
      // Only allow marking UNKNOWN jobs as completed
      if (job.status !== "UNKNOWN") {
        res.status(400).send({
          error: "Can only mark UNKNOWN jobs as completed",
          currentStatus: job.status,
          suggestion: "This endpoint is for resolving jobs with unknown state",
        });
        return;
      }

      this.logger.log(`Manually marking job ${jobId} as COMPLETED (was UNKNOWN)`);

      // Mark as completed
      job.status = "COMPLETED";
      job.endedAt = new Date();
      job.progress = 100;
      job.statusReason = "Manually marked as completed by user";

      if (job.statistics) {
        job.statistics.endedAt = job.endedAt;
        job.statistics.progress = 100;
      } else {
        job.statistics = {
          startedAt: job.startedAt,
          endedAt: job.endedAt,
          actualPrintTimeSeconds: null,
          progress: 100,
        };
      }

      await this.printJobService.printJobRepository.save(job);

      this.logger.log(`Job ${jobId} marked as COMPLETED`);

      res.send({
        message: "Job marked as completed",
        jobId,
        previousStatus: "UNKNOWN",
        newStatus: "COMPLETED",
      });
    } catch (error) {
      this.logger.error(`Failed to mark job ${jobId} as completed: ${error}`);
      res.status(500).send({
        error: "Failed to update job status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @POST()
  @route("/:id/set-failed")
  @before([ParamId("id")])
  async setFailed(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    const previousStatus = job.status;

    // Only allow marking UNKNOWN or PRINTING jobs as failed
    if (!["UNKNOWN", "PRINTING", "CANCELLED", "COMPLETED"].includes(job.status)) {
      res.status(400).send({
        error: "Can only mark UNKNOWN, PRINTING, CANCELLED, or COMPLETED jobs as failed",
        currentStatus: job.status,
      });
      return;
    }

    try {
      this.logger.log(`Manually marking job ${jobId} as FAILED (was ${previousStatus})`);

      const endedAt = new Date();
      const actualTimeSeconds = job.startedAt
        ? (endedAt.getTime() - job.startedAt.getTime()) / 1000
        : null;

      job.status = "FAILED";
      job.endedAt = endedAt;
      job.statusReason = "Manually marked as failed by user";

      if (!job.statistics) {
        job.statistics = {
          startedAt: job.startedAt,
          endedAt,
          actualPrintTimeSeconds: actualTimeSeconds,
          progress: job.progress,
          failureReason: "Manually marked as failed by user",
          failureTime: endedAt,
        };
      } else {
        job.statistics.endedAt = endedAt;
        job.statistics.actualPrintTimeSeconds = actualTimeSeconds;
        job.statistics.failureReason = "Manually marked as failed by user";
        job.statistics.failureTime = endedAt;
      }

      await this.printJobService.printJobRepository.save(job);

      this.logger.log(`Job ${jobId} marked as FAILED`);

      res.send({
        message: "Job marked as failed",
        jobId,
        previousStatus,
        newStatus: "FAILED",
      });
    } catch (error) {
      this.logger.error(`Failed to mark job ${jobId} as failed: ${error}`);
      res.status(500).send({
        error: "Failed to update job status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @POST()
  @route("/:id/set-cancelled")
  @before([ParamId("id")])
  async setCancelled(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    const previousStatus = job.status;

    // Only allow marking UNKNOWN, PRINTING, or PAUSED jobs as cancelled
    if (!["UNKNOWN", "PRINTING", "PAUSED"].includes(job.status)) {
      res.status(400).send({
        error: "Can only mark UNKNOWN, PRINTING, or PAUSED jobs as cancelled",
        currentStatus: job.status,
      });
      return;
    }

    try {
      this.logger.log(`Manually marking job ${jobId} as CANCELLED (was ${previousStatus})`);

      const endedAt = new Date();
      const actualTimeSeconds = job.startedAt
        ? (endedAt.getTime() - job.startedAt.getTime()) / 1000
        : null;

      job.status = "CANCELLED";
      job.endedAt = endedAt;
      job.statusReason = "Manually marked as cancelled by user";

      if (!job.statistics) {
        job.statistics = {
          startedAt: job.startedAt,
          endedAt,
          actualPrintTimeSeconds: actualTimeSeconds,
          progress: job.progress,
        };
      } else {
        job.statistics.endedAt = endedAt;
        job.statistics.actualPrintTimeSeconds = actualTimeSeconds;
      }

      await this.printJobService.printJobRepository.save(job);

      this.logger.log(`Job ${jobId} marked as CANCELLED`);

      res.send({
        message: "Job marked as cancelled",
        jobId,
        previousStatus,
        newStatus: "CANCELLED",
      });
    } catch (error) {
      this.logger.error(`Failed to mark job ${jobId} as cancelled: ${error}`);
      res.status(500).send({
        error: "Failed to update job status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @POST()
  @route("/:id/set-unknown")
  @before([ParamId("id")])
  async setUnknown(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    const previousStatus = job.status;

    // Only allow marking PRINTING or PAUSED jobs as unknown (for desync scenarios)
    if (!["PRINTING", "PAUSED"].includes(job.status)) {
      res.status(400).send({
        error: "Can only mark PRINTING or PAUSED jobs as unknown",
        currentStatus: job.status,
        suggestion: "This endpoint is for marking jobs with uncertain state (e.g., after connection loss)",
      });
      return;
    }

    try {
      this.logger.log(`Manually marking job ${jobId} as UNKNOWN (was ${previousStatus})`);

      job.status = "UNKNOWN";
      job.statusReason = "Manually marked as unknown by user (state uncertain)";

      await this.printJobService.printJobRepository.save(job);

      this.logger.log(`Job ${jobId} marked as UNKNOWN`);

      res.send({
        message: "Job marked as unknown",
        jobId,
        previousStatus,
        newStatus: "UNKNOWN",
      });
    } catch (error) {
      this.logger.error(`Failed to mark job ${jobId} as unknown: ${error}`);
      res.status(500).send({
        error: "Failed to update job status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @POST()
  @route("/:id/re-analyze")
  @before([ParamId("id")])
  async reAnalyzeJob(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    this.logger.log(`Re-analyzing job ${jobId}`);

    try {
      // Check if we have the file locally
      if (!job.fileStorageId) {
        // No local file - trigger download event for async processing
        this.logger.log(`Job ${jobId} has no fileStorageId - triggering download and analysis`);
        await this.printJobService.triggerFileAnalysis(jobId);

        res.send({
          message: "File download and analysis triggered (async)",
          jobId,
          status: "pending",
        });
        return;
      }

      // We have the file - re-analyze it now
      const filePath = this.fileStorageService.getFilePath(job.fileStorageId);

      // Check if file exists
      const exists = await this.fileAnalysisService.needsAnalysis(filePath);
      if (!exists) {
        throw new NotFoundException(`File not found in storage: ${job.fileStorageId}`);
      }

      this.logger.log(`Re-analyzing file for job ${jobId}: ${filePath}`);

      // Mark as analyzing
      job.analysisState = "ANALYZING";
      await this.printJobService.printJobRepository.save(job);

      // Analyze the file
      const { metadata, thumbnails } = await this.fileAnalysisService.analyzeFile(filePath);

      // Save thumbnails
      let thumbnailMetadata: any[] = [];
      if (thumbnails && thumbnails.length > 0) {
        thumbnailMetadata = await this.fileStorageService.saveThumbnails(job.fileStorageId, thumbnails);
        this.logger.log(`Saved ${thumbnailMetadata.length} thumbnail(s) for job ${jobId}`);
      }

      // Update job with new metadata
      await this.printJobService.handleFileAnalyzed(jobId, metadata, thumbnails);

      // Update metadata JSON cache with thumbnail index
      const fileHash = job.fileHash || undefined;
      await this.fileStorageService.saveMetadata(job.fileStorageId, metadata, fileHash, job.fileName, thumbnailMetadata);

      this.logger.log(`Successfully re-analyzed job ${jobId}`);

      res.send({
        message: "File re-analyzed successfully",
        jobId,
        status: "analyzed",
        metadata,
        thumbnailCount: thumbnails?.length || 0,
      });
    } catch (error) {
      this.logger.error(`Failed to re-analyze job ${jobId}: ${error}`);
      res.status(500).send({
        error: "Re-analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @DELETE()
  @route("/:id")
  @before([ParamId("id")])
  async deleteJob(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);
    const deleteFileParam = req.query.deleteFile === 'true';

    // Prevent deleting jobs that are currently printing
    if (job.status === "PRINTING" || job.status === "PAUSED") {
      res.status(400).send({
        error: "Cannot delete active print job",
        status: job.status,
        suggestion: "Wait for print to complete or cancel it first",
      });
      return;
    }

    try {

      const fileStorageId = job.fileStorageId;
      const fileName = job.fileName;

      // Delete the job
      await this.printJobService.printJobRepository.remove(job);
      this.logger.log(`Deleted job ${jobId}: ${fileName}`);

      // Handle file deletion based on user preference and file usage
      if (fileStorageId && deleteFileParam) {
        // User wants to delete the file - check if other jobs reference it
        const otherJobs = await this.printJobService.printJobRepository.count({
          where: { fileStorageId },
        });

        if (otherJobs === 0) {
          // No other jobs reference this file - safe to delete
          try {
            await this.fileStorageService.deleteFile(fileStorageId);
            this.logger.log(`Deleted file as requested: ${fileStorageId}`);
            res.send({
              message: "Job and associated file deleted",
              jobId,
              fileDeleted: true,
            });
          } catch (error) {
            this.logger.warn(`Failed to delete file ${fileStorageId}: ${error}`);
            res.send({
              message: "Job deleted, but file deletion failed",
              jobId,
              fileDeleted: false,
            });
          }
        } else {
          // Other jobs still reference this file - cannot delete
          this.logger.log(`File ${fileStorageId} still referenced by ${otherJobs} other job(s) - keeping file`);
          res.send({
            message: "Job deleted (file kept - still used by other jobs)",
            jobId,
            fileDeleted: false,
            remainingReferences: otherJobs,
          });
        }
      } else {
        // User doesn't want to delete the file, or no file exists
        res.send({
          message: "Job deleted",
          jobId,
          fileDeleted: false,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to delete job ${jobId}: ${error}`);
      res.status(500).send({
        error: "Delete failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @GET()
  @route("/:id/thumbnails")
  @before([ParamId("id")])
  async getThumbnails(req: Request, res: Response) {
    const jobId = req.local.id;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    if (!job.fileStorageId) {
      res.send({ jobId, thumbnails: [] });
      return;
    }

    try {

      // Load metadata to get thumbnail details
      const metadata = await this.fileStorageService.loadMetadata(job.fileStorageId);
      const thumbnailMetadata = metadata?._thumbnails || [];

      res.send({
        jobId,
        fileStorageId: job.fileStorageId,
        thumbnails: thumbnailMetadata.map((thumb: any) => ({
          index: thumb.index,
          url: `/api/print-jobs/${jobId}/thumbnails/${thumb.index}`,
          filename: thumb.filename,
          width: thumb.width,
          height: thumb.height,
          format: thumb.format,
          size: thumb.size,
        })),
      });
    } catch (error) {
      this.logger.error(`Failed to get thumbnails for job ${jobId}: ${error}`);
      res.status(500).send({ error: "Failed to get thumbnails" });
    }
  }

  @GET()
  @route("/:id/thumbnails/:index")
  @before([ParamId("id"), ParamInt("index")])
  async getThumbnail(req: Request, res: Response) {
    const jobId = req.local.id;
    const index = req.local.index;
    const job = await this.printJobService.getJobByIdOrFail(jobId);

    if (!job.fileStorageId) {
      throw new NotFoundException("Job has no stored file");
    }

    try {

      const thumbnail = await this.fileStorageService.getThumbnail(job.fileStorageId, index);

      if (!thumbnail) {
        throw new NotFoundException(`Thumbnail ${index} not found`);
      }

      // Determine content type from magic bytes
      const isPNG = thumbnail[0] === 0x89 && thumbnail[1] === 0x50 && thumbnail[2] === 0x4E && thumbnail[3] === 0x47;
      const isJPG = thumbnail[0] === 0xFF && thumbnail[1] === 0xD8;
      const isQOI = thumbnail[0] === 0x71 && thumbnail[1] === 0x6F && thumbnail[2] === 0x69 && thumbnail[3] === 0x66; // 'qoif'

      let contentType = 'image/png'; // default
      if (isPNG) contentType = 'image/png';
      else if (isJPG) contentType = 'image/jpeg';
      else if (isQOI) contentType = 'image/qoi';

      // Set headers BEFORE sending
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
      res.setHeader('ETag', `"${job.fileStorageId}-${index}"`);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin access
      res.send(thumbnail);
    } catch (error) {
      this.logger.error(`Failed to get thumbnail ${index} for job ${jobId}: ${error}`);
      res.status(500).send({ error: "Failed to get thumbnail" });
    }
  }

  @POST()
  @route("/from-file")
  async createJobFromFile(req: Request, res: Response) {
    const { fileStorageId, printerId } = req.body;

    if (!fileStorageId) {
      res.status(400).send({ error: "fileStorageId is required" });
      return;
    }

    if (!printerId) {
      res.status(400).send({ error: "printerId is required" });
      return;
    }

    try {
      // Check if file exists in storage
      const fileExists = await this.fileStorageService.fileExists(fileStorageId);
      if (!fileExists) {
        throw new NotFoundException("File not found in storage" );
      }

      // Load file metadata
      const metadata = await this.fileStorageService.loadMetadata(fileStorageId);
      if (!metadata) {
        res.status(400).send({ error: "File has no metadata. Please analyze the file first." });
        return;
      }

      // Get printer name - we'll use the metadata or generic name
      const printerName = `Printer ${printerId}`;

      // Create print job
      const job = await this.printJobService.createPendingJob(
        printerId,
        metadata._originalFileName || metadata.fileName || "Unknown",
        metadata,
        printerName
      );

      // Link to storage
      job.fileStorageId = fileStorageId;
      job.fileHash = metadata._fileHash;
      job.analysisState = "ANALYZED"; // File is already analyzed
      job.analyzedAt = new Date();

      // Extract format from metadata
      if (metadata.fileFormat) {
        job.fileFormat = metadata.fileFormat;
      }

      await this.printJobService.printJobRepository.save(job);

      this.logger.log(`Created job ${job.id} from file storage ${fileStorageId} for printer ${printerId}`);

      res.send({
        id: job.id,
        printerId: job.printerId,
        printerName: job.printerName,
        fileName: job.fileName,
        fileStorageId: job.fileStorageId,
        status: job.status,
        analysisState: job.analysisState,
        createdAt: job.createdAt,
      });
    } catch (error) {
      this.logger.error(`Failed to create job from file ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to create job from file" });
    }
  }

  /**
   * Convert date to end of day (23:59:59.999) to include all jobs from that day
   */
  private toEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }
}
