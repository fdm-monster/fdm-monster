import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { BackfillFileRecordsTask } from "@/tasks/backfill-file-records.task";
import { FileStorageService } from "@/services/file-storage.service";
import { getMediaPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";

describe("BackfillFileRecords Migration", () => {
  let backfillTask: BackfillFileRecordsTask;
  let fileStorageService: FileStorageService;

  beforeAll(async () => {
    const { container } = await setupTestApp(false);
    backfillTask = container.resolve<BackfillFileRecordsTask>(DITokens.backfillFileRecordsTask);
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);

    await fileStorageService.ensureStorageDirectories();
  });

  it("should backfill FileRecords for existing files", async () => {
    const testFileId = `test-backfill-${Date.now()}`;
    const gcodeDir = join(getMediaPath(), AppConstants.defaultPrintFilesStorage, "gcode");

    if (!existsSync(gcodeDir)) {
      mkdirSync(gcodeDir, { recursive: true });
    }

    writeFileSync(join(gcodeDir, `${testFileId}.gcode`), "G28\nG1 X10 Y10\n");
    writeFileSync(join(gcodeDir, `${testFileId}.gcode.json`), JSON.stringify({
      _originalFileName: "test-backfill.gcode",
      _fileHash: "abc123"
    }));

    let record = await fileStorageService.getFileRecordByGuid(testFileId);
    expect(record).toBeNull();

    const stats = await backfillTask.execute({ quiet: true });

    expect(stats.filesScanned).toBeGreaterThanOrEqual(1);
    expect(stats.recordsCreated).toBeGreaterThanOrEqual(1);

    record = await fileStorageService.getFileRecordByGuid(testFileId);
    expect(record).toBeTruthy();
    expect(record?.name).toBe("test-backfill.gcode");
    expect(record?.type).toBe("gcode");

    await fileStorageService.deleteFile(testFileId);
  });

  it("should be idempotent (skip existing records)", async () => {
    const stats1 = await backfillTask.execute({ quiet: true });
    const stats2 = await backfillTask.execute({ quiet: true });

    expect(stats2.recordsCreated).toBe(0);
    expect(stats2.recordsExisting).toBe(stats1.filesScanned);
  });

  it("should handle files without metadata gracefully", async () => {
    const testFileId = `test-no-metadata-${Date.now()}`;
    const gcodeDir = join(getMediaPath(), AppConstants.defaultPrintFilesStorage, "gcode");

    writeFileSync(join(gcodeDir, `${testFileId}.gcode`), "G28\n");

    const stats = await backfillTask.execute({ quiet: true });

    const record = await fileStorageService.getFileRecordByGuid(testFileId);
    expect(record).toBeTruthy();
    expect(record?.name).toBe(`${testFileId}.gcode`);

    await fileStorageService.deleteFile(testFileId);
  });

  it("should return statistics object", async () => {
    const stats = await backfillTask.execute({ quiet: true });

    expect(stats).toHaveProperty('filesScanned');
    expect(stats).toHaveProperty('recordsCreated');
    expect(stats).toHaveProperty('recordsExisting');
    expect(stats).toHaveProperty('errors');

    expect(typeof stats.filesScanned).toBe('number');
    expect(typeof stats.recordsCreated).toBe('number');
    expect(typeof stats.recordsExisting).toBe('number');
    expect(typeof stats.errors).toBe('number');
  });

  it("should skip thumbnail directories and json files", async () => {
    const testFileId = `test-skip-${Date.now()}`;
    const gcodeDir = join(getMediaPath(), AppConstants.defaultPrintFilesStorage, "gcode");

    const thumbnailDir = join(gcodeDir, `${testFileId}_thumbnails`);
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true });
    }

    writeFileSync(join(gcodeDir, `${testFileId}.gcode`), "G28\n");
    writeFileSync(join(gcodeDir, `${testFileId}.gcode.json`), "{}");

    const statsBefore = await backfillTask.execute({ quiet: true });

    const record = await fileStorageService.getFileRecordByGuid(testFileId);
    expect(record).toBeTruthy();

    await fileStorageService.deleteFile(testFileId);
  });
});
