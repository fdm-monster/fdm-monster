import { before, DELETE, GET, POST, PUT, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { Request, Response } from "express";
import { authorizeRoles, authenticate } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { PrintQueueService } from "@/services/print-queue.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

@route(AppConstants.apiRoute + "/print-queue")
@before([authenticate(), authorizeRoles([ROLES.ADMIN, ROLES.OPERATOR])])
export class PrintQueueController {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printQueueService: PrintQueueService,
  ) {
    this.logger = loggerFactory(PrintQueueController.name);
  }

  @GET()
  @route("/global")
  async getGlobalQueue(req: Request, res: Response) {
    try {
      // Get all jobs with PENDING or QUEUED status
      const jobs = await this.printQueueService.printJobRepository.find({
        where: [
          { status: "PENDING" },
          { status: "QUEUED" },
        ],
        order: { createdAt: "ASC" },
        relations: ['printer'],
      });

      // Expand multi-plate jobs into individual plate work items
      const workItems: any[] = [];
      let totalPlates = 0;

      for (const job of jobs) {
        const metadata = job.metadata as any;
        const plateCount = metadata?.totalPlates || metadata?.plates?.length || 1;

        if (plateCount > 1 && metadata?.plates) {
          // Multi-plate job - create work item for each plate
          metadata.plates.forEach((plate: any, index: number) => {
            // Get SKU count for this plate (user-defined or default to 1)
            const skuCount = plate.skuCount || 1;

            workItems.push({
              jobId: job.id,
              fileName: job.fileName,
              plateNumber: plate.plateNumber || (index + 1),
              plateCount: plateCount,
              skuCount: skuCount, // Parts/SKUs per plate
              printerId: job.printerId,
              printerName: job.printerName,
              printerType: job.printer?.printerType,
              queuePosition: job.queuePosition,
              status: job.status,
              estimatedTimeSeconds: plate.gcodePrintTimeSeconds,
              filamentGrams: plate.filamentUsedGrams,
            });
            totalPlates++;
          });
        } else {
          // Single-plate job
          const skuCount = metadata?.skuCount || 1;

          workItems.push({
            jobId: job.id,
            fileName: job.fileName,
            plateNumber: 1,
            plateCount: 1,
            skuCount: skuCount, // Parts/SKUs per plate
            printerId: job.printerId,
            printerName: job.printerName,
            printerType: job.printer?.printerType,
            queuePosition: job.queuePosition,
            status: job.status,
            estimatedTimeSeconds: metadata?.gcodePrintTimeSeconds,
            filamentGrams: metadata?.filamentUsedGrams,
          });
          totalPlates++;
        }
      }

      // Calculate total SKU count
      const totalSkus = workItems.reduce((sum, item) => sum + item.skuCount, 0);

      res.send({
        workItems,
        totalPlates,
        totalSkus,
        totalJobs: jobs.length,
        summary: {
          pending: workItems.filter(w => w.status === "PENDING").length,
          queued: workItems.filter(w => w.status === "QUEUED").length,
          totalEstimatedTimeSeconds: workItems.reduce((sum, w) => sum + (w.estimatedTimeSeconds || 0), 0),
          totalFilamentGrams: workItems.reduce((sum, w) => sum + (w.filamentGrams || 0), 0),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get global queue: ${error}`);
      res.status(500).send({ error: "Failed to get global queue" });
    }
  }

  @GET()
  @route("/:printerId")
  async getQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);

    if (isNaN(printerId)) {
      res.status(400).send({ error: "Invalid printer ID" });
      return;
    }

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
  async addToQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);
    const jobId = parseInt(req.params.jobId);
    const position = req.body.position ? parseInt(req.body.position) : undefined;

    if (isNaN(printerId) || isNaN(jobId)) {
      res.status(400).send({ error: "Invalid printer ID or job ID" });
      return;
    }

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

  @DELETE()
  @route("/:printerId/:jobId")
  async removeFromQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);
    const jobId = parseInt(req.params.jobId);

    if (isNaN(printerId) || isNaN(jobId)) {
      res.status(400).send({ error: "Invalid printer ID or job ID" });
      return;
    }

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

  @PUT()
  @route("/:printerId/reorder")
  async reorderQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);
    const jobIds = req.body.jobIds;

    if (isNaN(printerId)) {
      res.status(400).send({ error: "Invalid printer ID" });
      return;
    }

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
  async clearQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);

    if (isNaN(printerId)) {
      res.status(400).send({ error: "Invalid printer ID" });
      return;
    }

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

  @POST()
  @route("/:printerId/process")
  async processQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);

    if (isNaN(printerId)) {
      res.status(400).send({ error: "Invalid printer ID" });
      return;
    }

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

  @GET()
  @route("/:printerId/next")
  async getNextInQueue(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);

    if (isNaN(printerId)) {
      res.status(400).send({ error: "Invalid printer ID" });
      return;
    }

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
}
