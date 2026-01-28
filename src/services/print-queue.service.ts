import { Repository, Not, IsNull } from "typeorm";
import { PrintJob } from "@/entities/print-job.entity";
import { Printer } from "@/entities/printer.entity";
import { EventEmitter2 } from "eventemitter2";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { LoggerService } from "@/handlers/logger";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { FileStorageService } from "@/services/file-storage.service";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { SOCKET_STATE } from "@/shared/dtos/socket-state.type";
import { API_STATE } from "@/shared/dtos/api-state.type";
import { captureException } from "@sentry/node";

export interface QueuedJob {
  id: number;
  fileName: string;
  queuePosition: number;
  status: string;
  estimatedTimeSeconds?: number;
  filamentGrams?: number;
  createdAt: Date;
}

export interface IPrintQueueService {
  addToQueue(printerId: number, jobId: number, position?: number): Promise<void>;

  removeFromQueue(jobId: number): Promise<void>;

  getQueue(printerId: number): Promise<QueuedJob[]>;

  getGlobalQueuePaged(page: number, pageSize: number): Promise<[PrintJob[], number]>;

  getNextInQueue(printerId: number): Promise<PrintJob | null>;

  reorderQueue(printerId: number, jobIds: number[]): Promise<void>;

  clearQueue(printerId: number): Promise<void>;

  processQueue(printerId: number): Promise<PrintJob | null>;
}

/**
 * Simplified service for managing print job queues per printer
 */
export class PrintQueueService implements IPrintQueueService {
  printJobRepository: Repository<PrintJob>;
  printerRepository: Repository<Printer>;
  eventEmitter2: EventEmitter2;
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    typeormService: TypeormService,
    eventEmitter2: EventEmitter2,
    private readonly printerApiFactory: PrinterApiFactory,
    private readonly fileStorageService: FileStorageService,
    private readonly printerSocketStore: PrinterSocketStore,
  ) {
    this.printJobRepository = typeormService.getDataSource().getRepository(PrintJob);
    this.printerRepository = typeormService.getDataSource().getRepository(Printer);
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(PrintQueueService.name);

    this.eventEmitter2.on("printQueue.jobSubmitted", (event: { printerId: number; jobId: number; fileName: string; fileStorageId?: string; queuePosition?: number | null }) => {
      this.handleJobSubmission(event.printerId, event.jobId, event.fileName, event.fileStorageId, event.queuePosition).catch((error) => {
        this.logger.error(`Failed to handle job submission for job ${event.jobId}`, error);
        captureException(error);
      });
    });

    this.logger.log("Print queue service initialized");
  }

  private isPrinterConnected(printerId: number): { connected: boolean; reason?: string } {
    const socket = this.printerSocketStore.getPrinterSocket(printerId);

    if (!socket) {
      return { connected: false, reason: "No socket connection found" };
    }

    const socketState = socket.socketState;
    const apiState = socket.apiState;

    if (socketState !== SOCKET_STATE.opened && socketState !== SOCKET_STATE.authenticated) {
      return { connected: false, reason: `Socket not connected (state: ${socketState})` };
    }

    if (apiState !== API_STATE.responding) {
      return { connected: false, reason: `Printer not responding (API state: ${apiState})` };
    }

    return { connected: true };
  }

  async addToQueue(printerId: number, jobId: number, position?: number): Promise<void> {
    const job = await this.printJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Print job ${ jobId } not found`);
    }

    this.ensurePrinterAssignment(job, printerId);

    if (position === undefined || position === null) {
      const maxPosition = await this.getMaxQueuePosition(printerId);
      job.queuePosition = (maxPosition ?? -1) + 1;
    } else {
      await this.shiftQueuePositions(printerId, position);
      job.queuePosition = position;
    }

    job.status = "QUEUED";
    await this.printJobRepository.save(job);

    this.logger.log(`Added job ${ jobId } to printer ${ printerId } queue at position ${ job.queuePosition }`);
    this.eventEmitter2.emit("printQueue.jobAdded", {
      printerId,
      jobId,
      position: job.queuePosition,
    });
  }

  async removeFromQueue(jobId: number): Promise<void> {
    const job = await this.printJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Print job ${ jobId } not found`);
    }

    const printerId = job.printerId;
    const oldPosition = job.queuePosition;

    job.queuePosition = null;
    if (job.status === "QUEUED") {
      job.status = "PENDING";
    }
    await this.printJobRepository.save(job);

    if (oldPosition !== null && printerId) {
      await this.compactQueuePositions(printerId, oldPosition);
    }

    this.logger.log(`Removed job ${ jobId } from queue`);
    this.eventEmitter2.emit("printQueue.jobRemoved", {
      printerId,
      jobId,
    });
  }

  async getQueue(printerId: number): Promise<QueuedJob[]> {
    const jobs = await this.printJobRepository.find({
      where: {
        printerId,
        status: "QUEUED",
        queuePosition: Not(IsNull()),
      },
      order: { queuePosition: "ASC" },
    });

    return jobs.map(j => ({
      id: j.id,
      fileName: j.fileName,
      queuePosition: j.queuePosition!,
      status: j.status,
      estimatedTimeSeconds: (j.metadata as any)?.gcodePrintTimeSeconds,
      filamentGrams: (j.metadata as any)?.filamentUsedGrams,
      createdAt: j.createdAt,
    }));
  }

  async getGlobalQueuePaged(page: number, pageSize: number): Promise<[PrintJob[], number]> {
    const skip = (page - 1) * pageSize;

    return await this.printJobRepository.findAndCount({
      where: { status: "QUEUED" },
      order: {
        printerId: "ASC",
        queuePosition: "ASC",
      },
      relations: ['printer'],
      take: pageSize,
      skip: skip,
    });
  }


  async getNextInQueue(printerId: number): Promise<PrintJob | null> {
    return this.printJobRepository.findOne({
      where: {
        printerId,
        status: "QUEUED",
        queuePosition: Not(IsNull()),
      },
      order: { queuePosition: "ASC" },
    });
  }

  async reorderQueue(printerId: number, jobIds: number[]): Promise<void> {
    for (let i = 0; i < jobIds.length; i++) {
      const job = await this.printJobRepository.findOne({ where: { id: jobIds[i] } });
      if (job?.printerId === printerId) {
        job.queuePosition = i;
        await this.printJobRepository.save(job);
      }
    }

    this.logger.log(`Reordered queue for printer ${ printerId }`);
    this.eventEmitter2.emit("printQueue.reordered", { printerId });
  }

  async clearQueue(printerId: number): Promise<void> {
    const jobs = await this.printJobRepository.find({
      where: {
        printerId,
        status: "QUEUED",
      },
    });

    for (const job of jobs) {
      job.status = "PENDING";
      job.queuePosition = null;
      await this.printJobRepository.save(job);
    }

    this.logger.log(`Cleared queue for printer ${ printerId } (${ jobs.length } jobs)`);
    this.eventEmitter2.emit("printQueue.cleared", { printerId });
  }

  async processQueue(printerId: number): Promise<PrintJob | null> {
    const nextJob = await this.getNextInQueue(printerId);

    if (!nextJob) {
      this.logger.log(`No jobs in queue for printer ${ printerId }`);
      return null;
    }

    this.logger.log(`Processing queue: next job is ${ nextJob.id } (${ nextJob.fileName })`);

    this.eventEmitter2.emit("printQueue.processNext", {
      printerId,
      jobId: nextJob.id,
      fileName: nextJob.fileName,
      fileStorageId: nextJob.fileStorageId,
    });

    return nextJob;
  }


  private ensurePrinterAssignment(job: PrintJob, printerId: number): void {
    if (!job.printerId) {
      job.printerId = printerId;
    } else if (job.printerId !== printerId) {
      throw new Error(`Job ${job.id} belongs to printer ${job.printerId}, cannot submit to printer ${printerId}`);
    }
  }


  private async getMaxQueuePosition(printerId: number): Promise<number | null> {
    const result = await this.printJobRepository
      .createQueryBuilder("job")
      .select("MAX(job.queuePosition)", "max")
      .where("job.printerId = :printerId", { printerId })
      .getRawOne();

    return result?.max ?? null;
  }

  private async shiftQueuePositions(printerId: number, fromPosition: number): Promise<void> {
    await this.printJobRepository
      .createQueryBuilder()
      .update(PrintJob)
      .set({ queuePosition: () => "queuePosition + 1" })
      .where("printerId = :printerId", { printerId })
      .andWhere("queuePosition >= :fromPosition", { fromPosition })
      .execute();
  }

  private async compactQueuePositions(printerId: number, removedPosition: number): Promise<void> {
    await this.printJobRepository
      .createQueryBuilder()
      .update(PrintJob)
      .set({ queuePosition: () => "queuePosition - 1" })
      .where("printerId = :printerId", { printerId })
      .andWhere("queuePosition > :removedPosition", { removedPosition })
      .execute();
  }

  async submitToPrinter(printerId: number, jobId: number): Promise<void> {
    const job = await this.printJobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new Error(`Print job ${ jobId } not found`);
    }

    this.ensurePrinterAssignment(job, printerId);

    if (job.queuePosition !== null) {
      const oldPosition = job.queuePosition;
      job.queuePosition = null;
      await this.compactQueuePositions(printerId, oldPosition);
    }


    // Update status but keep in queue until submission succeeds
    job.status = "PRINTING";
    job.startedAt = new Date();
    await this.printJobRepository.save(job);

    this.logger.log(`Submitting job ${ jobId } (${ job.fileName }) to printer ${ printerId }`);
    this.eventEmitter2.emit("printQueue.jobSubmitted", {
      printerId,
      jobId: job.id,
      fileName: job.fileName,
      fileStorageId: job.fileStorageId,
      queuePosition,
    });
  }

  /**
   * Handle job submission event - upload file to printer and start print
   */
  private async handleJobSubmission(printerId: number, jobId: number, fileName: string, fileStorageId?: string, queuePosition?: number | null): Promise<void> {
    this.logger.log(`Handling job submission for job ${jobId} on printer ${printerId}`);

    try {
      if (!fileStorageId) {
        throw new Error(`Job ${ jobId } has no fileStorageId - cannot submit to printer`);
      }
      const printerApi = this.printerApiFactory.getById(printerId);

      const fileSize = this.fileStorageService.getFileSize(fileStorageId);
      const fileStream = this.fileStorageService.readFileStream(fileStorageId);

      this.logger.log(`Uploading file ${ fileName } to printer ${ printerId } and starting print`);
      await printerApi.uploadFile({
        stream: fileStream,
        fileName,
        contentLength: fileSize,
        startPrint: true,
      });
      this.logger.log(`Successfully submitted job ${ jobId } to printer ${ printerId }`);

      // Only remove from queue after successful submission
      if (queuePosition !== null && queuePosition !== undefined) {
        const job = await this.printJobRepository.findOne({ where: { id: jobId } });
        if (job && job.queuePosition === queuePosition) {
          job.queuePosition = null;
          await this.printJobRepository.save(job);
          await this.compactQueuePositions(printerId, queuePosition);
          this.logger.log(`Removed job ${jobId} from queue after successful submission`);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to submit job ${ jobId } to printer ${ printerId }`, error);

      // Update job status to reflect failure (keeps startedAt and queuePosition)
      try {
        const job = await this.printJobRepository.findOne({ where: { id: jobId } });
        if (job) {
          job.status = "FAILED";
          job.statusReason = `Print submission failed: ${error instanceof Error ? error.message : "Unknown error"}`;
          job.endedAt = new Date();
          await this.printJobRepository.save(job);
          this.logger.log(`Updated job ${jobId} status to FAILED (still in queue for retry)`);
        }
      } catch (updateError) {
        this.logger.error(`Failed to update job ${ jobId } status after submission error`, updateError);
      }

      throw error;
    }
  }
}

