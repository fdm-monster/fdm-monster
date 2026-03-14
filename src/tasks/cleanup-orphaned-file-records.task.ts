import { ILoggerFactory } from "@/handlers/logger-factory";
import { FileStorageService } from "@/services/file-storage.service";
import { Repository } from "typeorm";
import { FileRecord } from "@/entities/file-record.entity";

export class CleanupOrphanedFileRecordsTask {
  private readonly logger;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly fileStorageService: FileStorageService,
    private readonly fileRecordRepository: Repository<FileRecord>
  ) {
    this.logger = loggerFactory(CleanupOrphanedFileRecordsTask.name);
  }

  async execute(): Promise<void> {
    this.logger.log("Starting orphaned FileRecord cleanup task...");

    let totalRecordsScanned = 0;
    let totalOrphanedRecords = 0;
    let totalRecordsDeleted = 0;
    let totalErrors = 0;

    const allRecords = await this.fileRecordRepository.find({
      where: { type: "gcode" },
    });

    const bgcodeRecords = await this.fileRecordRepository.find({
      where: { type: "bgcode" },
    });

    const threemfRecords = await this.fileRecordRepository.find({
      where: { type: "3mf" },
    });

    const records = [...allRecords, ...bgcodeRecords, ...threemfRecords];

    for (const record of records) {
      if (record.type === "dir") {
        continue;
      }

      totalRecordsScanned++;

      try {
        const filePath = await this.fileStorageService.findFilePath(record.fileGuid);

        if (!filePath) {
          totalOrphanedRecords++;
          this.logger.warn(
            `Orphaned FileRecord found: id=${record.id}, fileGuid=${record.fileGuid}, name=${record.name}`
          );

          await this.fileStorageService.deleteFileRecord(record.id);
          totalRecordsDeleted++;
          this.logger.log(`Deleted orphaned FileRecord id=${record.id}`);
        }
      } catch (error) {
        totalErrors++;
        this.logger.error(`Error processing FileRecord id=${record.id}:`, error);
      }
    }

    this.logger.log(`Orphaned FileRecord cleanup complete:`);
    this.logger.log(`  Records scanned: ${totalRecordsScanned}`);
    this.logger.log(`  Orphaned records found: ${totalOrphanedRecords}`);
    this.logger.log(`  Records deleted: ${totalRecordsDeleted}`);
    this.logger.log(`  Errors: ${totalErrors}`);
  }
}
