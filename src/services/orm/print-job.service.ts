import { Repository } from "typeorm";
import { PrintJob, PrintJobMetadata } from "@/entities/print-job.entity";
import EventEmitter2 from "eventemitter2";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import {
  updateStatisticsForCompletion,
  updateStatisticsForFailure,
  updateStatisticsForCancellation,
  calculateJobDuration,
} from "@/utils/job-stats.util";

// Events emitted by this service
export interface PrintJobAnalyzedEvent {
  jobId: number;
  printerId: number;
  metadata: PrintJobMetadata;
}

export interface PrintJobStartedEvent {
  jobId: number;
  printerId: number;
  fileName: string;
  startedAt: Date;
}

export interface PrintJobProgressEvent {
  jobId: number;
  printerId: number;
  progress: number;
  currentLayer?: number;
  totalLayers?: number;
}

export interface PrintJobCompletedEvent {
  jobId: number;
  printerId: number;
  fileName: string;
  actualTimeSeconds: number;
  estimatedTimeSeconds?: number;
}

export interface PrintJobFailedEvent {
  jobId: number;
  printerId: number;
  fileName: string;
  reason: string;
  failedAt: Date;
}

export interface PrintJobCancelledEvent {
  jobId: number;
  printerId: number;
  fileName: string;
  cancelledAt: Date;
}

export interface IPrintJobService {
  handleFileAnalyzed(jobId: number, metadata: PrintJobMetadata, thumbnails?: any[]): Promise<PrintJob>;
  handlePrintStarted(printerId: number, fileName: string, jobId?: number, printerName?: string): Promise<PrintJob>;
  handlePrintProgress(printerId: number, progress: number, currentLayer?: number, totalLayers?: number): Promise<PrintJob | null>;
  handlePrintCompleted(printerId: number, fileName?: string): Promise<PrintJob | null>;
  handlePrintFailed(printerId: number, reason: string, fileName?: string): Promise<PrintJob | null>;
  handlePrintCancelled(printerId: number, reason?: string): Promise<PrintJob | null>;
  handlePrintPaused(printerId: number): Promise<PrintJob | null>;
  handlePrintResumed(printerId: number): Promise<PrintJob | null>;
  cleanupStaleJobs(): Promise<void>;
  getActivePrintJob(printerId: number): Promise<PrintJob | null>;
  getPrintJobHistory(printerId: number, limit?: number): Promise<PrintJob[]>;

  // Helper methods for printer middleware
  markStarted(printerId: number, fileName: string, printerName?: string): Promise<PrintJob>;
  markProgress(printerId: number, fileName: string, progress: number, currentLayer?: number, totalLayers?: number): Promise<PrintJob | null>;
  markFinished(printerId: number, fileName: string): Promise<PrintJob | null>;
  markFailed(printerId: number, fileName: string, reason: string): Promise<PrintJob | null>;
  updateJobMetadata(printerId: number, fileName: string, partialMetadata: Partial<PrintJobMetadata>): Promise<void>;

  // Search methods for API
  searchPrintJobs(searchPrinter?: string, searchFile?: string, startDate?: Date, endDate?: Date): Promise<PrintJob[]>;
  searchPrintJobsPaged(searchPrinter?: string, searchFile?: string, startDate?: Date, endDate?: Date, page?: number, pageSize?: number): Promise<[PrintJob[], number]>;

  // Job creation
  createPendingJob(printerId: number, fileName: string, metadata: PrintJobMetadata, printerName?: string): Promise<PrintJob>;

  // File download and analysis
  triggerFileAnalysis(jobId: number): Promise<void>;

  // Manual status updates
  markAsCompleted(jobId: number, reason?: string): Promise<PrintJob>;
  markAsFailed(jobId: number, reason: string): Promise<PrintJob>;
  markAsCancelled(jobId: number, reason?: string): Promise<PrintJob>;
  markAsUnknown(jobId: number, reason?: string): Promise<PrintJob>;

  // File reference counting
  countJobsReferencingFile(fileStorageId: string): Promise<number>;

  // Job management
  updateJob(job: PrintJob): Promise<PrintJob>;
  deleteJob(job: PrintJob): Promise<void>;
}

export class PrintJobService implements IPrintJobService {
  printJobRepository: Repository<PrintJob>;
  eventEmitter2: EventEmitter2;
  private readonly logger;

  constructor(loggerFactory: ILoggerFactory, typeormService: TypeormService, eventEmitter2: EventEmitter2) {
    this.printJobRepository = typeormService.getDataSource().getRepository(PrintJob);
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(PrintJobService.name);
  }

  async getJobByIdOrFail(id: number, relations?: string[]): Promise<PrintJob> {
    const job = await this.printJobRepository.findOne({
      where: { id },
      relations
    });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }

  async handleFileAnalyzed(
    jobId: number,
    metadata: PrintJobMetadata,
    thumbnails?: any[],
  ): Promise<PrintJob> {
    const job = await this.printJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Print job ${jobId} not found`);
    }

    job.metadata = metadata;
    job.analysisState = "ANALYZED";
    job.analyzedAt = new Date();
    // Status remains unchanged - analysis state is separate from job status
    job.fileFormat = metadata.fileFormat;

    await this.printJobRepository.save(job);

    this.eventEmitter2.emit("printJob.analyzed", {
      jobId: job.id,
      printerId: job.printerId,
      metadata,
    } as PrintJobAnalyzedEvent);

    this.logger.log(`Print job ${jobId} analyzed: ${metadata.fileName}`);
    return job;
  }

  async handlePrintStarted(
    printerId: number,
    fileName: string,
    jobId?: number,
    printerName?: string,
  ): Promise<PrintJob> {
    const existingJob = await this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (existingJob?.fileName === fileName && !jobId) {
      return existingJob;
    }

    // Different file is printing - mark the old one as UNKNOWN
    if (existingJob && existingJob.fileName !== fileName && !jobId) {
      existingJob.status = "UNKNOWN";
      existingJob.statusReason =
        "Print state unknown - printer started new job while previous job was still marked as printing. " +
        "This may indicate a disconnect, server restart, or manual printer control.";
      existingJob.endedAt = new Date();
      await this.printJobRepository.save(existingJob);

      this.logger.warn(
        `Printer ${printerId} started new print "${fileName}" while job ${existingJob.id} was PRINTING "${existingJob.fileName}". ` +
        `Marked job ${existingJob.id} as UNKNOWN.`
      );
    }

    let job: PrintJob | null;
    if (jobId) {
      job = await this.printJobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        throw new Error(`Print job ${jobId} not found`);
      }
    } else {
      // First, look for a PENDING job (created during upload)
      job = await this.printJobRepository.findOne({
        where: { printerId, fileName, status: "PENDING" },
        order: { createdAt: "DESC" },
      });

      // If no pending/analyzed job, look for any recent job with this filename
      if (!job) {
        job = await this.printJobRepository.findOne({
          where: { printerId, fileName },
          order: { createdAt: "DESC" },
        });
      }

      // If still no job, create a new one
      if (!job) {
        this.logger.log(`Creating new job for ${fileName} - no pending or existing job found`);
        job = this.printJobRepository.create({
          printerId,
          printerName: printerName || null,
          fileName,
          status: "PRINTING",
          analysisState: "NOT_ANALYZED",
        });
      } else if (job.status === "PENDING") {
        this.logger.log(`Promoting pending job ${job.id} to PRINTING`);
      } else if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
        // Don't reuse completed jobs - this is a re-print, create new job
        this.logger.log(`Creating new job for re-print of ${fileName} (previous job ${job.id} was ${job.status})`);
        job = this.printJobRepository.create({
          printerId,
          printerName: printerName || job.printerName || null,
          fileName,
          status: "PRINTING",
          analysisState: job.analysisState, // Keep analysis state from previous print
          metadata: job.metadata, // Reuse metadata from previous print
          fileFormat: job.fileFormat,
        });
      }
    }

    job.status = "PRINTING";
    job.startedAt = new Date();
    job.progress = 0;

    // Set/update printerName if provided
    if (printerName && !job.printerName) {
      job.printerName = printerName;
    }

    if (!job.statistics) {
      job.statistics = {
        startedAt: new Date(),
        endedAt: null,
        actualPrintTimeSeconds: null,
        progress: 0,
      };
    } else {
      job.statistics.startedAt = new Date();
      job.statistics.progress = 0;
    }

    await this.printJobRepository.save(job);

    this.eventEmitter2.emit("printJob.started", {
      jobId: job.id,
      printerId,
      fileName,
      startedAt: job.startedAt,
    } as PrintJobStartedEvent);

    this.logger.log(`Print job ${job.id} started on printer ${printerId}: ${fileName}`);
    return job;
  }

  async handlePrintProgress(
    printerId: number,
    progress: number,
  ): Promise<PrintJob | null> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      return null;
    }

    job.progress = Math.min(100, Math.max(0, progress));

    if (job.statistics) {
      job.statistics.progress = job.progress;
    } else {
      job.statistics = {
        startedAt: job.startedAt,
        endedAt: null,
        actualPrintTimeSeconds: null,
        progress: job.progress,
      };
    }

    await this.printJobRepository.save(job);

    this.eventEmitter2.emit("printJob.progress", {
      jobId: job.id,
      printerId,
      progress: job.progress,
    } as PrintJobProgressEvent);

    return job;
  }

  async handlePrintCompleted(printerId: number, fileName?: string): Promise<PrintJob | null> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      this.logger.warn(`No active print job found for printer ${printerId} on completion`);
      return null;
    }

    if (fileName && job.fileName !== fileName) {
      this.logger.warn(
        `Filename mismatch on completion: expected "${job.fileName}", got "${fileName}"`
      );
    }

    const endedAt = new Date();
    const actualTimeSeconds = calculateJobDuration(job.startedAt, endedAt);

    job.status = "COMPLETED";
    updateStatisticsForCompletion(job, endedAt);

    await this.printJobRepository.save(job);

    this.eventEmitter2.emit("printJob.completed", {
      jobId: job.id,
      printerId,
      fileName: job.fileName,
      actualTimeSeconds,
      estimatedTimeSeconds: job.metadata?.gcodePrintTimeSeconds,
    } as PrintJobCompletedEvent);

    this.logger.log(
      `Print job ${job.id} completed on printer ${printerId}: ${job.fileName} ` +
      `(${actualTimeSeconds?.toFixed(0)}s actual, ${job.metadata?.gcodePrintTimeSeconds}s estimated)`
    );

    return job;
  }

  async handlePrintFailed(
    printerId: number,
    reason: string,
    fileName?: string,
  ): Promise<PrintJob | null> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      this.logger.warn(`No active print job found for printer ${printerId} on failure`);
      return null;
    }

    const endedAt = new Date();

    job.status = "FAILED";
    updateStatisticsForFailure(job, reason, endedAt);

    await this.printJobRepository.save(job);

    this.eventEmitter2.emit("printJob.failed", {
      jobId: job.id,
      printerId,
      fileName: job.fileName,
      reason,
      failedAt: endedAt,
    } as PrintJobFailedEvent);

    this.logger.log(
      `Print job ${job.id} failed on printer ${printerId}: ${job.fileName} - ${reason}`
    );

    return job;
  }

  async handlePrintCancelled(printerId: number, reason?: string): Promise<PrintJob | null> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      this.logger.warn(`No active print job found for printer ${printerId} on cancellation`);
      return null;
    }

    const endedAt = new Date();

    job.status = "CANCELLED";
    updateStatisticsForCancellation(job, reason, endedAt);

    await this.printJobRepository.save(job);

    this.eventEmitter2.emit("printJob.cancelled", {
      jobId: job.id,
      printerId,
      fileName: job.fileName,
      cancelledAt: endedAt,
    } as PrintJobCancelledEvent);

    this.logger.log(`Print job ${job.id} cancelled on printer ${printerId}: ${job.fileName}`);
    return job;
  }

  async handlePrintPaused(printerId: number): Promise<PrintJob | null> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      this.logger.warn(`No active print job found for printer ${printerId} on pause`);
      return null;
    }

    job.status = "PAUSED";
    await this.printJobRepository.save(job);

    this.logger.log(`Print job ${job.id} paused on printer ${printerId}`);
    return job;
  }

  async handlePrintResumed(printerId: number): Promise<PrintJob | null> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, status: "PAUSED" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      this.logger.warn(`No paused print job found for printer ${printerId} on resume`);
      return null;
    }

    job.status = "PRINTING";
    await this.printJobRepository.save(job);

    this.logger.log(`Print job ${job.id} resumed on printer ${printerId}`);
    return job;
  }

  async cleanupStaleJobs(): Promise<void> {
    const staleJobs = await this.printJobRepository.find({
      where: { status: "PRINTING" },
    });

    for (const job of staleJobs) {
      job.status = "UNKNOWN";
      job.statusReason =
        "Print state unknown after server restart. The print may have completed, " +
        "failed, or still be running. Check your printer for current status.";
      await this.printJobRepository.save(job);

      this.logger.warn(
        `Marked job ${job.id} (printer ${job.printerId}) as UNKNOWN after startup - ` +
        `was PRINTING before server stopped`
      );
    }

    if (staleJobs.length > 0) {
      this.logger.log(`Cleaned up ${staleJobs.length} stale print job(s) on startup`);
    }
  }

  async getActivePrintJob(printerId: number): Promise<PrintJob | null> {
    return this.printJobRepository.findOne({
      where: { printerId, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });
  }

  async getPrintJobHistory(
    printerId: number,
    limit: number = 50,
  ): Promise<PrintJob[]> {
    return this.printJobRepository.find({
      where: { printerId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async markStarted(printerId: number, fileName: string, printerName?: string): Promise<PrintJob> {
    return await this.handlePrintStarted(printerId, fileName, undefined, printerName);
  }

  async markProgress(
    printerId: number,
    fileName: string,
    progress: number
  ): Promise<PrintJob | null> {
    return await this.handlePrintProgress(printerId, progress);
  }

  /**
   * Mark print as finished by fileName
   * Used by printer middleware when print completes successfully
   */
  async markFinished(printerId: number, fileName: string): Promise<PrintJob | null> {
    return await this.handlePrintCompleted(printerId, fileName);
  }

  /**
   * Mark print as failed by fileName
   * Used by printer middleware when print fails
   */
  async markFailed(printerId: number, fileName: string, reason: string): Promise<PrintJob | null> {
    return await this.handlePrintFailed(printerId, reason, fileName);
  }

  /**
   * Update job metadata with partial data from printer middleware
   * Useful for updating estimates from OctoPrint/Moonraker during print
   * Only updates if job has no metadata or to supplement existing metadata
   */
  async updateJobMetadata(
    printerId: number,
    fileName: string,
    partialMetadata: Partial<PrintJobMetadata>,
  ): Promise<void> {
    const job = await this.printJobRepository.findOne({
      where: { printerId, fileName, status: "PRINTING" },
      order: { startedAt: "DESC" },
    });

    if (!job) {
      this.logger.debug(`No active job found for printer ${printerId}, file ${fileName} - skipping metadata update`);
      return;
    }

    // If job already has ANALYZED metadata, don't overwrite with incomplete data
    if (job.analysisState === "ANALYZED" && job.metadata) {
      this.logger.debug(`Job ${job.id} already has analyzed metadata, merging only missing fields`);
      // Only merge in fields that are currently null/undefined
      const updatedMetadata = { ...job.metadata } as Record<string, any>;
      for (const [key, value] of Object.entries(partialMetadata)) {
        if (value != null && (updatedMetadata[key] == null || updatedMetadata[key] === null)) {
          updatedMetadata[key] = value;
        }
      }
      job.metadata = updatedMetadata as PrintJobMetadata;
    } else if (job.metadata) {
      // Merge partial metadata with existing metadata
      job.metadata = {
        ...job.metadata,
        ...partialMetadata,
      } as PrintJobMetadata;
    } else {
      // No metadata exists - only create if we have meaningful data
      // Don't create metadata structure with mostly nulls
      const hasData = Object.values(partialMetadata).some(v => v !== null);
      if (!hasData) {
        this.logger.debug(`Skipping metadata creation for job ${job.id} - no meaningful data provided`);
        return;
      }

      // Create minimal metadata structure
      job.metadata = {
        fileName,
        fileFormat: job.fileFormat || "gcode", // Use existing fileFormat or default
        ...partialMetadata,
      } as PrintJobMetadata;
    }

    await this.printJobRepository.save(job);
    this.logger.debug(`Updated metadata for job ${job.id}`);
  }

  // ========== Search methods for API ==========

  /**
   * Search print jobs with optional filters
   */
  async searchPrintJobs(
    searchPrinter?: string,
    searchFile?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PrintJob[]> {
    const query = this.printJobRepository.createQueryBuilder("job");

    if (searchPrinter) {
      query.andWhere("job.printerId = :printerId", { printerId: Number.parseInt(searchPrinter, 10) });
    }

    if (searchFile) {
      query.andWhere("job.fileName LIKE :fileName", { fileName: `%${searchFile}%` });
    }

    if (startDate) {
      query.andWhere("job.startedAt >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("job.startedAt <= :endDate", { endDate });
    }

    return await query
      .orderBy("job.startedAt", "DESC")
      .getMany();
  }

  /**
   * Search print jobs with pagination
   */
  async searchPrintJobsPaged(
    searchPrinter?: string,
    searchFile?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<[PrintJob[], number]> {
    const query = this.printJobRepository.createQueryBuilder("job");

    if (searchPrinter) {
      query.andWhere("job.printerId = :printerId", { printerId: Number.parseInt(searchPrinter, 10) });
    }

    if (searchFile) {
      query.andWhere("job.fileName LIKE :fileName", { fileName: `%${searchFile}%` });
    }

    if (startDate) {
      query.andWhere("job.startedAt >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("job.startedAt <= :endDate", { endDate });
    }

    return await query
      .orderBy("job.startedAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
  }

  // ========== Job creation ==========

  /**
   * Create a pending print job (typically called when file is uploaded)
   * Used when a file is uploaded to a printer, creating a job ready for analysis
   */
  async createPendingJob(
    printerId: number,
    fileName: string,
    metadata: PrintJobMetadata,
    printerName?: string,
  ): Promise<PrintJob> {
    // Determine if metadata contains meaningful analysis data
    // (more than just basic file info)
    const hasAnalysisData = metadata.gcodePrintTimeSeconds !== null ||
      metadata.filamentUsedGrams !== null ||
      metadata.totalFilamentUsedGrams !== null ||
      metadata.layerHeight !== null ||
      metadata.totalLayers !== null;

    const analysisState = hasAnalysisData ? "ANALYZED" : "NOT_ANALYZED";
    // Status is always PENDING for newly created jobs (analysis state is separate)
    const status = "PENDING";

    const job = this.printJobRepository.create({
      printerId,
      printerName: printerName || null,
      fileName,
      status,
      analysisState,
      metadata,
      fileFormat: metadata.fileFormat,
      fileSize: metadata.fileSize,
      analyzedAt: hasAnalysisData ? new Date() : null,
    });

    await this.printJobRepository.save(job);

    this.logger.log(
      `Created ${analysisState.toLowerCase()} print job ${job.id} for printer ${printerId}: ${fileName} (format: ${metadata.fileFormat})`
    );
    return job;
  }

  /**
   * Trigger file analysis for a job (emits event for async processing)
   * Used when a print starts from a file on the printer that we don't have locally
   */
  async triggerFileAnalysis(jobId: number): Promise<void> {
    this.eventEmitter2.emit("printJob.needsFileDownload", { jobId });
    this.logger.log(`Triggered file download and analysis for job ${jobId}`);
  }

  async markAsCompleted(jobId: number, reason?: string): Promise<PrintJob> {
    const job = await this.getJobByIdOrFail(jobId);

    job.status = "COMPLETED";
    updateStatisticsForCompletion(job);

    if (reason) {
      job.statusReason = reason;
    } else {
      job.statusReason = "Manually marked as completed by user";
    }

    await this.printJobRepository.save(job);

    this.logger.log(`Job ${jobId} manually marked as COMPLETED`);

    return job;
  }

  async markAsFailed(jobId: number, reason: string): Promise<PrintJob> {
    const job = await this.getJobByIdOrFail(jobId);

    job.status = "FAILED";
    updateStatisticsForFailure(job, reason);

    await this.printJobRepository.save(job);

    this.logger.log(`Job ${jobId} manually marked as FAILED: ${reason}`);

    return job;
  }

  async markAsCancelled(jobId: number, reason?: string): Promise<PrintJob> {
    const job = await this.getJobByIdOrFail(jobId);

    job.status = "CANCELLED";
    updateStatisticsForCancellation(job, reason);

    await this.printJobRepository.save(job);

    this.logger.log(`Job ${jobId} manually marked as CANCELLED`);

    return job;
  }

  async markAsUnknown(jobId: number, reason?: string): Promise<PrintJob> {
    const job = await this.getJobByIdOrFail(jobId);

    job.status = "UNKNOWN";
    job.statusReason = reason || "Manually marked as unknown by user (state uncertain)";

    await this.printJobRepository.save(job);

    this.logger.log(`Job ${jobId} manually marked as UNKNOWN`);

    return job;
  }

  async countJobsReferencingFile(fileStorageId: string): Promise<number> {
    return await this.printJobRepository.count({
      where: { fileStorageId },
    });
  }

  async updateJob(job: PrintJob): Promise<PrintJob> {
    return await this.printJobRepository.save(job);
  }

  async deleteJob(job: PrintJob): Promise<void> {
    await this.printJobRepository.remove(job);
  }
}
