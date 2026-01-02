import { Repository, In, Not, IsNull } from "typeorm";
import { PrintJob } from "@/entities/print-job.entity";
import { EventEmitter2 } from "eventemitter2";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";

export interface QueuedJob {
  id: number;
  fileName: string;
  queuePosition: number;
  status: string;
  metadata?: any;
}

export interface IPrintQueueService {
  addToQueue(printerId: number, jobId: number, position?: number): Promise<void>;
  removeFromQueue(jobId: number): Promise<void>;
  getQueue(printerId: number): Promise<QueuedJob[]>;
  getNextInQueue(printerId: number): Promise<PrintJob | null>;
  reorderQueue(printerId: number, jobIds: number[]): Promise<void>;
  clearQueue(printerId: number): Promise<void>;
  processQueue(printerId: number): Promise<PrintJob | null>;
}

/**
 * Service for managing print job queues with file storage backing
 */
export class PrintQueueService implements IPrintQueueService {
  printJobRepository: Repository<PrintJob>;
  eventEmitter2: EventEmitter2;
  private readonly logger;

  constructor(loggerFactory: ILoggerFactory, typeormService: TypeormService, eventEmitter2: EventEmitter2) {
    this.printJobRepository = typeormService.getDataSource().getRepository(PrintJob);
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(PrintQueueService.name);
  }

  /**
   * Add job to print queue
   */
  async addToQueue(printerId: number, jobId: number, position?: number): Promise<void> {
    const job = await this.printJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Print job ${jobId} not found`);
    }

    if (job.printerId !== printerId) {
      throw new Error(`Job ${jobId} belongs to different printer`);
    }

    if (position === undefined || position === null) {
      // Add to end of queue
      const maxPosition = await this.getMaxQueuePosition(printerId);
      job.queuePosition = (maxPosition ?? -1) + 1;
    } else {
      // Insert at specific position, shift others down
      await this.shiftQueuePositions(printerId, position);
      job.queuePosition = position;
    }

    job.status = "QUEUED";
    await this.printJobRepository.save(job);

    this.logger.log(`Added job ${jobId} to queue at position ${job.queuePosition}`);
    this.eventEmitter2.emit("printQueue.jobAdded", {
      printerId,
      jobId,
      position: job.queuePosition,
    });
  }

  /**
   * Remove job from queue
   */
  async removeFromQueue(jobId: number): Promise<void> {
    const job = await this.printJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Print job ${jobId} not found`);
    }

    const printerId = job.printerId;
    const oldPosition = job.queuePosition;

    job.queuePosition = null;
    if (job.status === "QUEUED") {
      job.status = "PENDING"; // Return to pending state (analysis state is separate)
    }
    await this.printJobRepository.save(job);

    // Compact queue positions
    if (oldPosition !== null && printerId) {
      await this.compactQueuePositions(printerId, oldPosition);
    }

    this.logger.log(`Removed job ${jobId} from queue`);
    this.eventEmitter2.emit("printQueue.jobRemoved", {
      printerId,
      jobId,
    });
  }

  /**
   * Get current queue for printer
   */
  async getQueue(printerId: number): Promise<QueuedJob[]> {
    const jobs = await this.printJobRepository.find({
      where: {
        printerId,
        status: In(["QUEUED", "ANALYZED"]),
        queuePosition: Not(IsNull()),
      },
      order: { queuePosition: "ASC" },
    });

    return jobs.map(j => ({
      id: j.id,
      fileName: j.fileName,
      queuePosition: j.queuePosition!,
      status: j.status,
      metadata: j.metadata,
    }));
  }

  /**
   * Get next job in queue
   */
  async getNextInQueue(printerId: number): Promise<PrintJob | null> {
    return this.printJobRepository.findOne({
      where: {
        printerId,
        status: In(["QUEUED", "ANALYZED"]),
        queuePosition: Not(IsNull()),
      },
      order: { queuePosition: "ASC" },
    });
  }

  /**
   * Reorder queue by providing new job order
   */
  async reorderQueue(printerId: number, jobIds: number[]): Promise<void> {
    for (let i = 0; i < jobIds.length; i++) {
      const job = await this.printJobRepository.findOne({ where: { id: jobIds[i] } });
      if (job && job.printerId === printerId) {
        job.queuePosition = i;
        await this.printJobRepository.save(job);
      }
    }

    this.logger.log(`Reordered queue for printer ${printerId}`);
    this.eventEmitter2.emit("printQueue.reordered", { printerId });
  }

  /**
   * Clear entire queue for printer
   */
  async clearQueue(printerId: number): Promise<void> {
    const jobs = await this.printJobRepository.find({
      where: {
        printerId,
        status: "QUEUED",
      },
    });

    for (const job of jobs) {
      job.status = "PENDING"; // Return to pending state (analysis state is separate)
      job.queuePosition = null;
      await this.printJobRepository.save(job);
    }

    this.logger.log(`Cleared queue for printer ${printerId} (${jobs.length} jobs)`);
    this.eventEmitter2.emit("printQueue.cleared", { printerId });
  }

  /**
   * Process queue - get next job and emit event for printing
   * Returns the job that should be printed next
   */
  async processQueue(printerId: number): Promise<PrintJob | null> {
    const nextJob = await this.getNextInQueue(printerId);

    if (!nextJob) {
      this.logger.log(`No jobs in queue for printer ${printerId}`);
      return null;
    }

    this.logger.log(`Processing queue: next job is ${nextJob.id} (${nextJob.fileName})`);

    // Emit event for printer to start the job
    this.eventEmitter2.emit("printQueue.processNext", {
      printerId,
      jobId: nextJob.id,
      fileName: nextJob.fileName,
      fileStorageId: nextJob.fileStorageId,
    });

    return nextJob;
  }

  /**
   * Add multiple jobs as a batch (e.g., from multi-plate 3MF)
   */
  async addBatch(printerId: number, jobIds: number[], queueGroup?: string): Promise<void> {
    const startPosition = await this.getMaxQueuePosition(printerId) ?? -1;

    for (let i = 0; i < jobIds.length; i++) {
      const job = await this.printJobRepository.findOne({ where: { id: jobIds[i] } });
      if (job && job.printerId === printerId) {
        job.queuePosition = startPosition + i + 1;
        job.status = "QUEUED";
        if (queueGroup) {
          job.queueGroup = queueGroup;
        }
        await this.printJobRepository.save(job);
      }
    }

    this.logger.log(`Added batch of ${jobIds.length} jobs to queue for printer ${printerId}`);
    this.eventEmitter2.emit("printQueue.batchAdded", {
      printerId,
      jobIds,
      queueGroup,
    });
  }

  /**
   * Get max queue position for printer
   */
  private async getMaxQueuePosition(printerId: number): Promise<number | null> {
    const result = await this.printJobRepository
      .createQueryBuilder("job")
      .select("MAX(job.queuePosition)", "max")
      .where("job.printerId = :printerId", { printerId })
      .getRawOne();

    return result?.max ?? null;
  }

  /**
   * Shift queue positions down to make room
   */
  private async shiftQueuePositions(printerId: number, fromPosition: number): Promise<void> {
    await this.printJobRepository
      .createQueryBuilder()
      .update(PrintJob)
      .set({ queuePosition: () => "queuePosition + 1" })
      .where("printerId = :printerId", { printerId })
      .andWhere("queuePosition >= :fromPosition", { fromPosition })
      .execute();
  }

  /**
   * Compact queue positions after removal
   */
  private async compactQueuePositions(printerId: number, removedPosition: number): Promise<void> {
    await this.printJobRepository
      .createQueryBuilder()
      .update(PrintJob)
      .set({ queuePosition: () => "queuePosition - 1" })
      .where("printerId = :printerId", { printerId })
      .andWhere("queuePosition > :removedPosition", { removedPosition })
      .execute();
  }

  /**
   * Auto-start next job when previous completes (optional auto-queue processing)
   */
  async handleJobCompleted(printerId: number): Promise<void> {
    const nextJob = await this.getNextInQueue(printerId);

    if (nextJob) {
      this.logger.log(`Auto-processing queue after completion: starting job ${nextJob.id}`);
      await this.processQueue(printerId);
    } else {
      this.logger.log(`Queue empty for printer ${printerId} after job completion`);
    }
  }
}

