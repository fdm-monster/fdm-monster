import { ILoggerFactory } from "@/handlers/logger-factory";
import { FileStorageService } from "@/services/file-storage.service";
import { getMediaPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import path from "node:path";

export class BackfillFileRecordsTask {
  private readonly logger;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly fileStorageService: FileStorageService
  ) {
    this.logger = loggerFactory(BackfillFileRecordsTask.name);
  }

  async execute(): Promise<void> {
    this.logger.log("Starting FileRecord backfill task...");

    const storageBasePath = join(getMediaPath(), AppConstants.defaultPrintFilesStorage);
    const STORAGE_SUBDIRS = ["gcode", "3mf", "bgcode"] as const;

    let totalFilesScanned = 0;
    let totalRecordsCreated = 0;
    let totalRecordsExisting = 0;
    let totalErrors = 0;

    for (const subdir of STORAGE_SUBDIRS) {
      const dirPath = join(storageBasePath, subdir);

      try {
        const files = await readdir(dirPath);

        for (const file of files) {
          if (file.endsWith('_thumbnails') || file.endsWith('.json')) {
            continue;
          }

          totalFilesScanned++;
          const fileId = path.parse(file).name;

          const existingRecord = await this.fileStorageService.getFileRecordByGuid(fileId);

          if (existingRecord) {
            totalRecordsExisting++;
            this.logger.debug(`FileRecord already exists for ${fileId}, skipping`);
            continue;
          }

          try {
            const metadata = await this.fileStorageService.loadMetadata(fileId);
            const originalFileName = metadata?._originalFileName || file;

            let fileType: "gcode" | "3mf" | "bgcode" = "gcode";
            if (subdir === "3mf") {
              fileType = "3mf";
            } else if (subdir === "bgcode") {
              fileType = "bgcode";
            }

            await this.fileStorageService.createFileRecord({
              parentId: 0,
              type: fileType,
              name: originalFileName,
              fileGuid: fileId,
              metadata: null,
            });

            totalRecordsCreated++;
            this.logger.log(`Created FileRecord for ${fileId} (${originalFileName})`);
          } catch (error) {
            totalErrors++;
            this.logger.error(`Failed to create FileRecord for ${fileId}:`, error);
          }
        }
      } catch (error) {
        this.logger.error(`Error scanning directory ${subdir}:`, error);
      }
    }

    this.logger.log(`FileRecord backfill complete:`);
    this.logger.log(`  Files scanned: ${totalFilesScanned}`);
    this.logger.log(`  Records created: ${totalRecordsCreated}`);
    this.logger.log(`  Records existing: ${totalRecordsExisting}`);
    this.logger.log(`  Errors: ${totalErrors}`);
  }
}
