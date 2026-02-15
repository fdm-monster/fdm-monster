import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { PrintJobService } from "@/services/orm/print-job.service";
import { FileStorageService } from "@/services/file-storage.service";

export interface CachedPrinterThumbnail {
  printerId: number;
  thumbnailBase64: string;
  jobId: number;
  fileName: string;
  updatedAt: Date;
}

/**
 * Cache for printer thumbnails using analyzed print job files
 * Automatically uses the most recent completed or active print job thumbnail
 */
export class PrinterThumbnailCache extends KeyDiffCache<CachedPrinterThumbnail> {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printJobService: PrintJobService,
    private readonly fileStorageService: FileStorageService,
  ) {
    super();
    this.logger = loggerFactory(PrinterThumbnailCache.name);
  }

  async loadCache() {
    this.logger.log("Loading printer thumbnail cache from print jobs...");
    try {
      // Get all printers with recent jobs that have thumbnails
      const recentJobs = await this.printJobService.printJobRepository
        .createQueryBuilder("job")
        .select("job.printerId")
        .addSelect("MAX(job.endedAt)", "maxEndedAt")
        .where("job.fileStorageId IS NOT NULL")
        .andWhere("job.analysisState = :state", { state: "ANALYZED" })
        .groupBy("job.printerId")
        .getRawMany();

      let loadedCount = 0;
      for (const result of recentJobs) {
        const printerId = result.job_printerId;
        if (printerId) {
          try {
            await this.loadPrinterThumbnail(printerId);
            loadedCount++;
          } catch (error) {
            this.logger.warn(`Failed to load thumbnail for printer ${printerId}: ${error}`);
          }
        }
      }

      this.logger.log(`Loaded ${loadedCount} printer thumbnails from print jobs`);
    } catch (error) {
      this.logger.error("Failed to load thumbnail cache", error);
    }
  }

  /**
   * Load thumbnail for a specific printer from its most recent print job
   */
  async loadPrinterThumbnail(printerId: number): Promise<void> {
    try {
      // Find most recent job with thumbnails for this printer
      const job = await this.printJobService.printJobRepository.findOne({
        where: {
          printerId,
          analysisState: "ANALYZED",
        },
        order: {
          endedAt: "DESC",
          startedAt: "DESC",
          createdAt: "DESC",
        },
      });

      if (!job || !job.fileStorageId) {
        this.logger.debug(`No suitable job found for printer ${printerId}`);
        return;
      }

      // Load metadata to check for thumbnails
      const metadata = await this.fileStorageService.loadMetadata(job.fileStorageId);
      const thumbnails = metadata?._thumbnails || [];

      if (thumbnails.length === 0) {
        this.logger.debug(`No thumbnails found for job ${job.id}`);
        return;
      }

      // Get the first (typically largest) thumbnail
      const thumbnailBuffer = await this.fileStorageService.getThumbnail(job.fileStorageId, 0);

      if (!thumbnailBuffer) {
        this.logger.warn(`Thumbnail file not found for job ${job.id}`);
        return;
      }

      const thumbnailBase64 = thumbnailBuffer.toString("base64");

      await this.setPrinterThumbnail(printerId, thumbnailBase64, job.id, job.fileName);

      this.logger.debug(`Loaded thumbnail for printer ${printerId} from job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to load thumbnail for printer ${printerId}: ${error}`);
      throw error;
    }
  }

  /**
   * Set/update printer thumbnail in cache
   */
  async setPrinterThumbnail(
    printerId: number,
    thumbnailBase64: string,
    jobId: number,
    fileName: string,
  ): Promise<void> {
    await this.setKeyValue(printerId, {
      printerId,
      thumbnailBase64,
      jobId,
      fileName,
      updatedAt: new Date(),
    });
  }

  /**
   * Remove printer thumbnail from cache
   */
  async unsetPrinterThumbnail(printerId: number): Promise<void> {
    await this.deleteKeyValue(printerId);
  }

  /**
   * Reset entire cache
   */
  async resetCache(): Promise<void> {
    this.logger.log("Resetting printer thumbnail cache");
    this.keyValueStore.clear();
    this.resetDiffs();
  }

  /**
   * Update thumbnail after print job completes
   * Called by event handlers when a job finishes
   */
  async handleJobCompleted(printerId: number, jobId: number): Promise<void> {
    try {
      this.logger.log(`Updating thumbnail for printer ${printerId} after job ${jobId} completed`);
      await this.loadPrinterThumbnail(printerId);
    } catch (error) {
      this.logger.error(`Failed to update thumbnail after job completion: ${error}`);
    }
  }

  /**
   * Update thumbnail after print job starts (for active print preview)
   * Called by event handlers when a job starts
   */
  async handleJobStarted(printerId: number, jobId: number): Promise<void> {
    try {
      const job = await this.printJobService.printJobRepository.findOne({
        where: { id: jobId },
      });

      if (!job || !job.fileStorageId) {
        return;
      }

      // Load metadata to check for thumbnails
      const metadata = await this.fileStorageService.loadMetadata(job.fileStorageId);
      const thumbnails = metadata?._thumbnails || [];

      if (thumbnails.length === 0) {
        return;
      }

      // Get the first thumbnail
      const thumbnailBuffer = await this.fileStorageService.getThumbnail(job.fileStorageId, 0);

      if (!thumbnailBuffer) {
        return;
      }

      const thumbnailBase64 = thumbnailBuffer.toString("base64");
      await this.setPrinterThumbnail(printerId, thumbnailBase64, job.id, job.fileName);

      this.logger.debug(`Updated thumbnail for printer ${printerId} from started job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to update thumbnail after job start: ${error}`);
    }
  }
}
