import { before, DELETE, GET, POST, PUT, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import type { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { PrintQueueService } from "@/services/print-queue.service";
import { PrintJobService } from "@/services/orm/print-job.service";
import { FileStorageService } from "@/services/file-storage.service";
import { PrinterCache } from "@/state/printer.cache";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { ParamId } from "@/middleware/param-converter.middleware";
import { NotFoundException } from "@/exceptions/runtime.exceptions";

@route(AppConstants.apiRoute + "/print-queue")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class PrintQueueController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printQueueService: PrintQueueService,
    private readonly printJobService: PrintJobService,
    private readonly fileStorageService: FileStorageService,
    private readonly printerCache: PrinterCache,
  ) {
    this.logger = loggerFactory(PrintQueueController.name);
  }

  @GET()
  async getGlobalQueue(req: Request, res: Response) {
    try {
      const page = Number.parseInt(req.query.page as string) || 1;
      const pageSize = Number.parseInt(req.query.pageSize as string) || 50;

      if (page < 1 || pageSize < 1 || pageSize > 200) {
        res.status(400).send({ error: "Invalid page or pageSize parameters" });
        return;
      }

      const [jobs, totalCount] = await this.printQueueService.getGlobalQueuePaged(page, pageSize);

      const queueItems = jobs.map(job => ({
        jobId: job.id,
        fileName: job.fileName,
        printerId: job.printerId,
        printerName: job.printerName || job.printer?.name,
        queuePosition: job.queuePosition,
        status: job.status,
        createdAt: job.createdAt,
        estimatedTimeSeconds: (job.metadata as any)?.gcodePrintTimeSeconds,
        filamentGrams: (job.metadata as any)?.filamentUsedGrams,
      }));

      res.send({
        items: queueItems,
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } catch (error) {
      this.logger.error(`Failed to get global queue: ${error}`);
      res.status(500).send({ error: "Failed to get global queue" });
    }
  }

  @GET()
  @route("/:printerId")
  @before([ParamId("printerId")])
  async getQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;

    try {
      const queue = await this.printQueueService.getQueue(printerId);
      res.send({
        printerId,
        queue,
        count: queue.length,
      });
    } catch (error) {
      this.logger.error(`Failed to get queue for printer ${printerId}: ${error}`);
      res.status(500).send({ error: "Failed to get queue" });
    }
  }

  @POST()
  @route("/:printerId/add/:jobId")
  @before([ParamId("printerId"), ParamId("jobId")])
  async addToQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;
    const jobId = req.local.jobId;
    const position = req.body.position === undefined ? undefined : Number.parseInt(req.body.position);

    try {
      await this.printQueueService.addToQueue(printerId, jobId, position);
      const queue = await this.printQueueService.getQueue(printerId);

      res.send({
        message: "Job added to queue",
        printerId,
        jobId,
        position,
        queue,
      });
    } catch (error) {
      this.logger.error(`Failed to add job ${jobId} to queue: ${error}`);
      res.status(500).send({
        error: "Failed to add to queue",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @PUT()
  @route("/:printerId/reorder")
  @before([ParamId("printerId")])
  async reorderQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;
    const jobIds = req.body.jobIds;

    if (!Array.isArray(jobIds)) {
      res.status(400).send({ error: "jobIds must be an array" });
      return;
    }

    try {
      await this.printQueueService.reorderQueue(printerId, jobIds);
      const queue = await this.printQueueService.getQueue(printerId);

      res.send({
        message: "Queue reordered",
        printerId,
        queue,
      });
    } catch (error) {
      this.logger.error(`Failed to reorder queue for printer ${printerId}: ${error}`);
      res.status(500).send({
        error: "Failed to reorder queue",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @DELETE()
  @route("/:printerId/clear")
  @before([ParamId("printerId")])
  async clearQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;

    try {
      await this.printQueueService.clearQueue(printerId);

      res.send({
        message: "Queue cleared",
        printerId,
      });
    } catch (error) {
      this.logger.error(`Failed to clear queue for printer ${printerId}: ${error}`);
      res.status(500).send({
        error: "Failed to clear queue",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @DELETE()
  @route("/:printerId/:jobId")
  @before([ParamId("printerId"), ParamId("jobId")])
  async removeFromQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;
    const jobId = req.local.jobId;

    try {
      await this.printQueueService.removeFromQueue(jobId);
      const queue = await this.printQueueService.getQueue(printerId);

      res.send({
        message: "Job removed from queue",
        printerId,
        jobId,
        queue,
      });
    } catch (error) {
      this.logger.error(`Failed to remove job ${jobId} from queue: ${error}`);
      res.status(500).send({
        error: "Failed to remove from queue",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @GET()
  @route("/:printerId/next")
  @before([ParamId("printerId")])
  async getNextInQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;

    try {
      const nextJob = await this.printQueueService.getNextInQueue(printerId);

      res.send({
        printerId,
        nextJob,
      });
    } catch (error) {
      this.logger.error(`Failed to get next job for printer ${printerId}: ${error}`);
      res.status(500).send({ error: "Failed to get next job" });
    }
  }

  @POST()
  @route("/:printerId/process")
  @before([ParamId("printerId")])
  async processQueue(req: Request, res: Response) {
    const printerId = req.local.printerId;

    try {
      const nextJob = await this.printQueueService.processQueue(printerId);

      if (!nextJob) {
        res.send({
          message: "Queue is empty",
          printerId,
          nextJob: null,
        });
        return;
      }

      res.send({
        message: "Processing next job in queue",
        printerId,
        nextJob,
      });
    } catch (error) {
      this.logger.error(`Failed to process queue for printer ${printerId}: ${error}`);
      res.status(500).send({
        error: "Failed to process queue",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  @POST()
  @route("/:printerId/from-file")
  @before([ParamId("printerId")])
  async createJobFromFile(req: Request, res: Response) {
    const printerId = req.local.printerId;
    const { fileStorageId, addToQueue = true, position } = req.body;

    if (!fileStorageId) {
      res.status(400).send({ error: "fileStorageId is required" });
      return;
    }

    try {
      const fileExists = await this.fileStorageService.fileExists(fileStorageId);
      if (!fileExists) {
        throw new NotFoundException("File not found in storage");
      }

      const metadata = await this.fileStorageService.loadMetadata(fileStorageId);
      if (!metadata) {
        res.status(400).send({ error: "File has no metadata. Please analyze the file first." });
        return;
      }

      const printer = await this.printerCache.getCachedPrinterOrThrowAsync(printerId);

      const job = await this.printJobService.createPendingJob(
        printerId,
        metadata._originalFileName || metadata.fileName || "Unknown",
        metadata,
        printer.name
      );

      job.fileStorageId = fileStorageId;
      job.fileHash = metadata._fileHash;
      job.analysisState = "ANALYZED";
      job.analyzedAt = new Date();

      if (metadata.fileFormat) {
        job.fileFormat = metadata.fileFormat;
      }

      await this.printJobService.updateJob(job);

      if (addToQueue) {
        await this.printQueueService.addToQueue(printerId, job.id, position);
      }

      this.logger.log(
        `Created job ${job.id} from file storage ${fileStorageId} for printer ${printerId}${addToQueue ? " and added to queue" : ""}`
      );

      res.send({
        id: job.id,
        printerId: job.printerId,
        printerName: job.printerName,
        fileName: job.fileName,
        fileStorageId: job.fileStorageId,
        status: job.status,
        analysisState: job.analysisState,
        createdAt: job.createdAt,
        addedToQueue: addToQueue,
      });
    } catch (error) {
      this.logger.error(`Failed to create job from file ${fileStorageId}: ${error}`);
      res.status(500).send({ error: "Failed to create job from file" });
    }
  }

  @POST()
  @route("/:printerId/submit/:jobId")
  @before([ParamId("printerId"), ParamId("jobId")])
  async submitToPrinter(req: Request, res: Response) {
    const printerId = req.local.printerId;
    const jobId = req.local.jobId;

    try {
      await this.printQueueService.submitToPrinter(printerId, jobId);

      res.send({
        message: "Job submitted to printer for printing",
        printerId,
        jobId,
      });
    } catch (error) {
      this.logger.error(`Failed to submit job ${jobId} to printer ${printerId}: ${error}`);
      res.status(500).send({
        error: "Failed to submit job to printer",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
