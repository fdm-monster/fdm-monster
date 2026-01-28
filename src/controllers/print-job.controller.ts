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
import { ParamId } from "@/middleware/param-converter.middleware";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { extractThumbnailsFromMetadata } from "@/utils/thumbnail.util";

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

    const endDateObj = endDate ? this.toEndOfDay(new Date(endDate)) : undefined;

    const [items, count] = await this.printJobService.searchPrintJobsPaged(
      searchPrinter,
      searchFile,
      startDate ? new Date(startDate) : undefined,
      endDateObj,
      page,
      pageSize,
    );

    const itemsWithThumbnails = await Promise.all(
      items.map(async (job) => {
        let thumbnails: any[] = [];
        if (job.fileStorageId) {
          try {
            const metadata = await this.fileStorageService.loadMetadata(job.fileStorageId);
            thumbnails = extractThumbnailsFromMetadata(metadata);
          } catch {}
        }
        return { ...job, thumbnails };
      })
    );

    res.send({ items: itemsWithThumbnails, count, pages: Math.ceil(count / pageSize) });
  }

  @GET()
  @route("/:id")
  @before([ParamId("id")])
  async getJob(req: Request, res: Response) {
    const jobId = req.local.id;

    const job = await this.printJobService.getJobByIdOrFail(jobId, ['printer']);

    try {
      let thumbnails: any[] = [];
      if (job.fileStorageId) {
        const metadata = await this.fileStorageService.loadMetadata(job.fileStorageId);
        thumbnails = extractThumbnailsFromMetadata(metadata);
      }

      res.send({
        ...job,
        thumbnails,
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
      if (["PENDING", "QUEUED"].includes(job.status)) {
        res.status(400).send({
          error: "Can only mark jobs which are not \"PENDING\" | \"QUEUED\" as completed",
          currentStatus: job.status,
          suggestion: "This endpoint is for resolving jobs with unknown state",
        });
        return;
      }

      const previousStatus = job.status;
      await this.printJobService.markAsCompleted(jobId);

      res.send({
        message: "Job marked as completed",
        jobId,
        previousStatus,
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

    if (!["UNKNOWN", "PRINTING", "CANCELLED", "COMPLETED"].includes(job.status)) {
      res.status(400).send({
        error: "Can only mark UNKNOWN, PRINTING, CANCELLED, or COMPLETED jobs as failed",
        currentStatus: job.status,
      });
      return;
    }

    try {
      await this.printJobService.markAsFailed(jobId, "Manually marked as failed by user");

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

    if (!["UNKNOWN", "PRINTING", "PAUSED"].includes(job.status)) {
      res.status(400).send({
        error: "Can only mark UNKNOWN, PRINTING, or PAUSED jobs as cancelled",
        currentStatus: job.status,
      });
      return;
    }

    try {
      await this.printJobService.markAsCancelled(jobId, "Manually marked as cancelled by user");

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

    if (!["PRINTING", "PAUSED"].includes(job.status)) {
      res.status(400).send({
        error: "Can only mark PRINTING or PAUSED jobs as unknown",
        currentStatus: job.status,
        suggestion: "This endpoint is for marking jobs with uncertain state (e.g., after connection loss)",
      });
      return;
    }

    try {
      await this.printJobService.markAsUnknown(jobId);

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
      if (!job.fileStorageId) {
        this.logger.log(`Job ${jobId} has no fileStorageId - triggering download and analysis`);
        await this.printJobService.triggerFileAnalysis(jobId);

        res.send({
          message: "File download and analysis triggered (async)",
          jobId,
          status: "pending",
        });
        return;
      }

      const filePath = this.fileStorageService.getFilePath(job.fileStorageId);
      const exists = await this.fileAnalysisService.needsAnalysis(filePath);
      if (!exists) {
        throw new NotFoundException(`File not found in storage: ${job.fileStorageId}`);
      }

      this.logger.log(`Re-analyzing file for job ${jobId}: ${filePath}`);

      job.analysisState = "ANALYZING";
      await this.printJobService.updateJob(job);

      const { metadata, thumbnails } = await this.fileAnalysisService.analyzeFile(filePath);

      let thumbnailMetadata: any[] = [];
      if (thumbnails && thumbnails.length > 0) {
        thumbnailMetadata = await this.fileStorageService.saveThumbnails(job.fileStorageId, thumbnails);
        this.logger.log(`Saved ${thumbnailMetadata.length} thumbnail(s) for job ${jobId}`);
      }

      await this.printJobService.handleFileAnalyzed(jobId, metadata, thumbnails);

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

      await this.printJobService.deleteJob(job);
      this.logger.log(`Deleted job ${jobId}: ${fileName}`);

      if (fileStorageId && deleteFileParam) {
        const otherJobs = await this.printJobService.countJobsReferencingFile(fileStorageId);

        if (otherJobs === 0) {
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
          this.logger.log(`File ${fileStorageId} still referenced by ${otherJobs} other job(s) - keeping file`);
          res.send({
            message: "Job deleted (file kept - still used by other jobs)",
            jobId,
            fileDeleted: false,
            remainingReferences: otherJobs,
          });
        }
      } else {
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

  private toEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }
}
