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

  /**
   * Get global queue across all printers with pagination
   * GET /api/print-queue?page=1&pageSize=50
   */
  @GET()
  async getGlobalQueue(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;

      if (page < 1 || pageSize < 1 || pageSize > 200) {
        res.status(400).send({ error: "Invalid page or pageSize parameters" });
        return;
      }

      const skip = (page - 1) * pageSize;

      // Get all QUEUED jobs with pagination
      const [jobs, totalCount] = await this.printQueueService.printJobRepository.findAndCount({
        where: { status: "QUEUED" },
        order: {
          printerId: "ASC",
          queuePosition: "ASC",
        },
        relations: ['printer'],
        take: pageSize,
        skip: skip,
      });

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

  /**
   * Get queue for specific printer
   * GET /api/print-queue/:printerId
   */
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

  /**
   * Add job to printer queue
   * POST /api/print-queue/:printerId/add/:jobId
   * Body: { position?: number }
   */
  @POST()
  @route("/:printerId/add/:jobId")
  async addToQueue(req: Request, res: Response) {
    const printerId = Number.parseInt(req.params.printerId);
    const jobId = Number.parseInt(req.params.jobId);
    const position = req.body.position === undefined ? undefined : Number.parseInt(req.body.position);

    if (Number.isNaN(printerId) || Number.isNaN(jobId)) {
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

  /**
   * Reorder queue for a printer
   * PUT /api/print-queue/:printerId/reorder
   * Body: { jobIds: number[] }
   */
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

  /**
   * Clear all jobs from printer queue
   * DELETE /api/print-queue/:printerId/clear
   */
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

  /**
   * Remove job from queue
   * DELETE /api/print-queue/:printerId/:jobId
   */
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

  /**
   * Get next job in queue for printer
   * GET /api/print-queue/:printerId/next
   */
  @GET()
  @route("/:printerId/next")
  async getNextInQueue(req: Request, res: Response) {
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

  /**
   * Get next job in queue for printer
   * GET /api/print-queue/:printerId/next
   */
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

  /**
   * Process queue - start next job
   * POST /api/print-queue/:printerId/process
   */
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

  /**
   * Submit job directly to printer for immediate printing
   * POST /api/print-queue/:printerId/submit/:jobId
   */
  @POST()
  @route("/:printerId/submit/:jobId")
  async submitToPrinter(req: Request, res: Response) {
    const printerId = parseInt(req.params.printerId);
    const jobId = parseInt(req.params.jobId);

    if (isNaN(printerId) || isNaN(jobId)) {
      res.status(400).send({ error: "Invalid printer ID or job ID" });
      return;
    }

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
