import { Not, Repository } from "typeorm";
import { PrintJob } from "@/entities/print-job.entity";
import { FileRecord } from "@/entities/file-record.entity";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { AppConstants } from "@/server.constants";
import { getMediaPath } from "@/utils/fs.utils";
import path, { basename, extname, join } from "node:path";
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync, createReadStream, statSync } from "node:fs";
import { Readable } from "node:stream";
import { NotFoundException, ConflictException } from "@/exceptions/runtime.exceptions";

export interface IFileStorageService {
  saveFile(file: Express.Multer.File, fileHash?: string): Promise<string>;
  getFile(fileStorageId: string): Promise<Buffer>;
  deleteFile(fileStorageId: string): Promise<void>;
  getFilePath(fileStorageId: string): string;
  getFileSize(fileStorageId: string): number;
  calculateFileHash(filePath: string): Promise<string>;
  validateUniqueFilename(fileName: string): Promise<void>;
  saveMetadata(
    fileStorageId: string,
    metadata: any,
    fileHash?: string,
    originalFileName?: string,
    thumbnailMetadata?: any[],
  ): Promise<void>;
  loadMetadata(fileStorageId: string): Promise<any | null>;
  hasMetadata(fileStorageId: string): Promise<boolean>;
  getDeterministicId(fileHash: string, fileName: string): string;
  findDuplicateByOriginalFileName(originalFileName: string): Promise<{ fileStorageId: string; metadata: any } | null>;
  saveThumbnails(
    fileStorageId: string,
    thumbnails: Array<{ data?: string; format?: string; width?: number; height?: number }>,
  ): Promise<
    Array<{
      index: number;
      path: string;
      filename: string;
      width: number;
      height: number;
      format: string;
      size: number;
    }>
  >;
  getThumbnail(fileStorageId: string, index: number): Promise<Buffer | null>;
  listThumbnails(fileStorageId: string): Promise<string[]>;
  listFileRecords(parentId?: number): Promise<FileRecord[]>;
  getFileRecordById(id: number): Promise<FileRecord | null>;
  getFileRecordByGuid(guid: string): Promise<FileRecord | null>;
  createFileRecord(data: Partial<FileRecord>): Promise<FileRecord>;
  updateFileRecord(id: number, data: Partial<FileRecord>): Promise<FileRecord>;
  deleteFileRecord(id: number): Promise<void>;
}

export class FileStorageService implements IFileStorageService {
  printJobRepository: Repository<PrintJob>;
  fileRecordRepository: Repository<FileRecord>;
  private readonly logger;
  private readonly storageBasePath: string;
  private readonly STORAGE_SUBDIRS = ["gcode", "3mf", "bgcode"] as const;

  constructor(loggerFactory: ILoggerFactory, typeormService: TypeormService) {
    this.printJobRepository = typeormService.getDataSource().getRepository(PrintJob);
    this.fileRecordRepository = typeormService.getDataSource().getRepository(FileRecord);
    this.logger = loggerFactory(FileStorageService.name);

    this.storageBasePath = join(getMediaPath(), AppConstants.defaultPrintFilesStorage);
  }

  async ensureStorageDirectories() {
    try {
      await mkdir(this.storageBasePath, { recursive: true });
      for (const subdir of this.STORAGE_SUBDIRS) {
        await mkdir(join(this.storageBasePath, subdir), { recursive: true });
      }
    } catch (error) {
      this.logger.error("Failed to create storage directories", error);
    }
  }

  readFileStream(fileStorageId: string): Readable {
    const filePath = this.getFilePath(fileStorageId);
    const stream = createReadStream(filePath);

    stream.on("error", (err) => {
      this.logger.error(`Failed to read file ${fileStorageId}: ${err.message}`, err);
    });

    return stream;
  }

  getFileSize(fileStorageId: string): number {
    const filePath = this.getFilePath(fileStorageId);
    const stats = statSync(filePath);
    return stats.size;
  }

  async validateUniqueFilename(fileName: string): Promise<void> {
    const existing = await this.findDuplicateByOriginalFileName(fileName);
    if (existing) {
      throw new ConflictException(
        `A file named "${fileName}" already exists in storage. Please rename the file, delete the existing file (ID: ${existing.fileStorageId}), or choose a different name.`,
        existing.fileStorageId,
      );
    }
  }

  async saveFile(file: Express.Multer.File, fileHash?: string): Promise<string> {
    const fileExt = extname(file.originalname).toLowerCase();

    let fileId: string;
    if (fileHash) {
      const nameHash = createHash("sha256")
        .update(fileHash + file.originalname)
        .digest("hex")
        .substring(0, 32);
      fileId = `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
    } else {
      fileId = crypto.randomUUID();
    }

    let subdir = "gcode";
    let fileType: "gcode" | "3mf" | "bgcode" = "gcode";
    if (fileExt === ".3mf" || file.originalname.includes(".gcode.3mf")) {
      subdir = "3mf";
      fileType = "3mf";
    } else if (fileExt === ".bgcode") {
      subdir = "bgcode";
      fileType = "bgcode";
    }

    const targetDir = join(this.storageBasePath, subdir);
    const targetPath = join(targetDir, `${fileId}${fileExt}`);

    if (file.path) {
      await rename(file.path, targetPath);
    } else if (file.buffer) {
      await writeFile(targetPath, file.buffer);
    } else {
      throw new Error("File has no path or buffer");
    }

    await this.createFileRecord({
      parentId: 0,
      type: fileType,
      name: file.originalname,
      fileGuid: fileId,
      metadata: null,
    });

    this.logger.log(`Saved file ${file.originalname} as ${fileId}`);
    return fileId;
  }

  async getFile(fileStorageId: string): Promise<Buffer> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      throw new Error(`File ${fileStorageId} not found in storage`);
    }

    return readFile(filePath);
  }

  async deleteFile(fileStorageId: string): Promise<void> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      this.logger.warn(`File ${fileStorageId} not found, cannot delete`);
      return;
    }

    await unlink(filePath);

    const metadataPath = filePath + ".json";
    try {
      await unlink(metadataPath);
      this.logger.debug(`Deleted metadata JSON for ${fileStorageId}`);
    } catch {}

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, "_thumbnails");
    try {
      await rm(thumbnailDir, { recursive: true, force: true });
      this.logger.debug(`Deleted thumbnails for ${fileStorageId}`);
    } catch {}

    const fileRecord = await this.getFileRecordByGuid(fileStorageId);
    if (fileRecord) {
      await this.deleteFileRecord(fileRecord.id);
    }

    this.logger.log(`Deleted file ${fileStorageId}`);
  }

  getFilePath(fileStorageId: string): string {
    for (const subdir of this.STORAGE_SUBDIRS) {
      for (const ext of [".gcode", ".3mf", ".bgcode", ""]) {
        const fullPath = join(this.storageBasePath, subdir, fileStorageId + ext);
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
    }

    return join(this.storageBasePath, "gcode", fileStorageId);
  }

  async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hashSum = createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  }

  getDeterministicId(fileHash: string, fileName: string): string {
    const nameHash = createHash("sha256")
      .update(fileHash + fileName)
      .digest("hex")
      .substring(0, 32);
    return `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
  }

  private async findFilePath(fileStorageId: string): Promise<string | null> {
    for (const subdir of this.STORAGE_SUBDIRS) {
      const dirPath = join(this.storageBasePath, subdir);
      try {
        const files = await readdir(dirPath);
        const matchingFile = files.find((f) => f.startsWith(fileStorageId));
        if (matchingFile) {
          return join(dirPath, matchingFile);
        }
      } catch {}
    }

    return null;
  }

  async fileExists(fileStorageId: string): Promise<boolean> {
    const filePath = await this.findFilePath(fileStorageId);
    return filePath !== null;
  }

  async findDuplicateByHash(fileHash: string): Promise<PrintJob | null> {
    return this.printJobRepository.findOne({
      where: { fileHash },
      order: { createdAt: "DESC" },
    });
  }

  async findDuplicateByOriginalFileName(originalFileName: string): Promise<{
    fileStorageId: string;
    metadata: any;
  } | null> {
    for (const subdir of this.STORAGE_SUBDIRS) {
      const dirPath = join(this.storageBasePath, subdir);
      try {
        const dirFiles = await readdir(dirPath);

        for (const file of dirFiles) {
          if (file.endsWith("_thumbnails") || file.endsWith(".json")) continue;

          const fileId = path.parse(file).name;
          const metadata = await this.loadMetadata(fileId);

          if (metadata?._originalFileName === originalFileName) {
            return {
              fileStorageId: fileId,
              metadata,
            };
          }
        }
      } catch (error) {
        this.logger.error(`Error searching for duplicate in ${subdir}`, error);
      }
    }

    return null;
  }

  async saveMetadata(
    fileStorageId: string,
    metadata: any,
    fileHash?: string,
    originalFileName?: string,
    thumbnailMetadata?: any[],
  ): Promise<void> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      this.logger.warn(`Cannot save metadata - file ${fileStorageId} not found`);
      return;
    }

    const metadataPath = filePath + ".json";

    let existingOriginalFileName = originalFileName;
    let existingThumbnails = thumbnailMetadata;
    try {
      const existingContent = await readFile(metadataPath, "utf8");
      const existing = JSON.parse(existingContent);
      if (existing._originalFileName && !originalFileName) {
        existingOriginalFileName = existing._originalFileName;
      }
      if (existing._thumbnails && !thumbnailMetadata) {
        existingThumbnails = existing._thumbnails;
      }
    } catch {}

    const metadataWithMeta = {
      ...metadata,
      _fileHash: fileHash || null,
      _analyzedAt: new Date().toISOString(),
      _fileStorageId: fileStorageId,
      _originalFileName: existingOriginalFileName || metadata.fileName || null,
      _thumbnails: existingThumbnails || [],
    };

    await writeFile(metadataPath, JSON.stringify(metadataWithMeta, null, 2), "utf8");
    const thumbnailMeta = thumbnailMetadata ? ` with ${thumbnailMetadata.length} thumbnail(s)` : "";
    this.logger.debug(`Saved metadata for ${fileStorageId}${thumbnailMeta}`);
  }

  async loadMetadata(fileStorageId: string): Promise<any | null> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      return null;
    }

    const metadataPath = filePath + ".json";
    try {
      const content = await readFile(metadataPath, "utf8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async hasMetadata(fileStorageId: string): Promise<boolean> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      return false;
    }

    const metadataPath = filePath + ".json";
    try {
      await access(metadataPath);
      return true;
    } catch {
      return false;
    }
  }

  async saveThumbnails(
    fileStorageId: string,
    thumbnails: Array<{ data?: string; format?: string; width?: number; height?: number }>,
  ): Promise<
    Array<{
      index: number;
      path: string;
      filename: string;
      width: number;
      height: number;
      format: string;
      size: number;
    }>
  > {
    const savedThumbnails: Array<any> = [];

    if (!thumbnails || thumbnails.length === 0) {
      return savedThumbnails;
    }

    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      this.logger.warn(`Cannot save thumbnails - file ${fileStorageId} not found`);
      return savedThumbnails;
    }

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, "_thumbnails");

    try {
      await rm(thumbnailDir, { recursive: true, force: true });
      this.logger.debug(`Cleared old thumbnails for ${fileStorageId}`);
    } catch {}

    await mkdir(thumbnailDir, { recursive: true });

    for (let i = 0; i < thumbnails.length; i++) {
      const thumb = thumbnails[i];
      if (!thumb.data) continue;

      const ext = thumb.format?.toLowerCase() || "png";
      const filename = `thumb_${i}.${ext}`;
      const thumbPath = join(thumbnailDir, filename);

      try {
        const buffer = Buffer.from(thumb.data, "base64");
        await writeFile(thumbPath, buffer);

        const relativePath = path.relative(this.storageBasePath, thumbPath);

        savedThumbnails.push({
          index: i,
          path: relativePath,
          filename,
          width: thumb.width || 0,
          height: thumb.height || 0,
          format: ext,
          size: buffer.length,
        });

        this.logger.debug(
          `Saved thumbnail ${i} for ${fileStorageId} (${thumb.width}x${thumb.height}, ${buffer.length} bytes)`,
        );
      } catch (error) {
        this.logger.warn(`Failed to save thumbnail ${i} for ${fileStorageId}: ${error}`);
      }
    }

    return savedThumbnails;
  }

  async getThumbnail(fileStorageId: string, index: number): Promise<Buffer | null> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) return null;

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, "_thumbnails");

    for (const ext of ["png", "jpg", "jpeg", "qoi"]) {
      const thumbPath = join(thumbnailDir, `thumb_${index}.${ext}`);
      try {
        return await readFile(thumbPath);
      } catch {}
    }

    return null;
  }

  async listThumbnails(fileStorageId: string): Promise<string[]> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) return [];

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, "_thumbnails");

    try {
      const files = await readdir(thumbnailDir);
      return files.filter((f) => f.startsWith("thumb_")).sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }

  async listAllFiles(options?: {
    page?: number;
    pageSize?: number;
    type?: "gcode" | "3mf" | "bgcode";
    sortBy?: "createdAt" | "name" | "type";
    sortOrder?: "ASC" | "DESC";
  }): Promise<{
    files: Array<{
      fileStorageId: string;
      fileName: string;
      fileFormat: string;
      fileSize: number;
      fileHash: string;
      createdAt: Date;
      thumbnailCount: number;
      metadata?: any;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }> {
    // First, check ALL file records (across all pages) for orphans and clean them up
    const allRecords = (await this.listFileRecords(undefined, {
      type: options?.type,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
      // Don't paginate - get ALL records to check for orphans
    })) as FileRecord[];

    const orphanedIds: number[] = [];
    for (const record of allRecords) {
      if (record.type === "dir") continue;

      const filePath = await this.findFilePath(record.fileGuid);
      if (!filePath) {
        this.logger.warn(
          `FileRecord ${record.id} (${record.fileGuid}) will be deleted - ` + `physical file missing: ${record.name}`,
        );
        orphanedIds.push(record.id);
      }
    }

    // Batch delete orphaned records if any found
    if (orphanedIds.length > 0) {
      await this.fileRecordRepository
        .createQueryBuilder()
        .delete()
        .from(FileRecord)
        .where("id IN (:...ids)", { ids: orphanedIds })
        .andWhere("type != :type", { type: "dir" })
        .execute();

      this.logger.log(`Deleted ${orphanedIds.length} orphaned FileRecords during list operation`);
    }

    // Now get the paginated results (after cleanup)
    const result = await this.listFileRecords(undefined, { ...options, paginate: true });
    const files: any[] = [];

    for (const record of result.items) {
      if (record.type === "dir") continue;

      try {
        const filePath = await this.findFilePath(record.fileGuid);
        if (!filePath) {
          // This shouldn't happen since we just cleaned up, but log if it does
          this.logger.warn(`FileRecord ${record.id} still missing after cleanup - skipping`);
          continue;
        }

        const stats = await stat(filePath);
        const metadata = await this.loadMetadata(record.fileGuid);
        const thumbnails = await this.listThumbnails(record.fileGuid);

        files.push({
          fileStorageId: record.fileGuid,
          fileName: metadata?._originalFileName || record.name,
          fileFormat: record.type,
          fileSize: stats.size,
          fileHash: metadata?._fileHash || "",
          createdAt: record.createdAt,
          thumbnailCount: thumbnails.length,
          metadata: metadata,
        });
      } catch (error) {
        this.logger.error(`Error getting file info for ${record.fileGuid}`, error);
      }
    }

    // Recalculate accurate count after orphan deletion (if any were deleted)
    let totalCount = result.totalCount;
    let totalPages = result.totalPages;

    if (orphanedIds.length > 0) {
      // Build where clause matching the filter used in listFileRecords
      const where: any = { type: Not("dir") };
      if (options?.type) {
        where.type = options.type;
      }

      totalCount = await this.fileRecordRepository.count({ where });
      totalPages = Math.ceil(totalCount / result.pageSize);
    }

    return {
      files,
      page: result.page,
      pageSize: result.pageSize,
      totalCount,
      totalPages,
    };
  }

  async getFileInfo(fileStorageId: string): Promise<{
    fileStorageId: string;
    fileName: string;
    fileFormat: string;
    fileSize: number;
    fileHash: string;
    createdAt: Date;
    thumbnailCount: number;
    metadata?: any;
  } | null> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) return null;

    try {
      const stats = await stat(filePath);
      const metadata = await this.loadMetadata(fileStorageId);
      const thumbnails = await this.listThumbnails(fileStorageId);
      const ext = extname(filePath).substring(1);

      return {
        fileStorageId,
        fileName: metadata?._originalFileName || basename(filePath),
        fileFormat: ext,
        fileSize: stats.size,
        fileHash: metadata?._fileHash || "",
        createdAt: stats.birthtime,
        thumbnailCount: thumbnails.length,
        metadata: metadata,
      };
    } catch (error) {
      this.logger.error(`Error getting file info for ${fileStorageId}`, error);
      return null;
    }
  }

  async listFileRecords(
    parentId?: number,
    options?: {
      paginate?: boolean;
      page?: number;
      pageSize?: number;
      type?: "gcode" | "3mf" | "bgcode";
      sortBy?: "createdAt" | "name" | "type";
      sortOrder?: "ASC" | "DESC";
    },
  ): Promise<
    FileRecord[] | { items: FileRecord[]; totalCount: number; page: number; pageSize: number; totalPages: number }
  > {
    const sortBy = options?.sortBy || "createdAt";
    const sortOrder = options?.sortOrder || "DESC";

    const where: any = {};
    if (parentId !== undefined) {
      where.parentId = parentId;
    }
    if (options?.type) {
      where.type = options.type;
    }

    if (options?.paginate) {
      const page = options.page || 1;
      const pageSize = options.pageSize || 50;

      const [items, totalCount] = await this.fileRecordRepository.findAndCount({
        where,
        order: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return {
        items,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    }

    return await this.fileRecordRepository.find({
      where,
      order: { [sortBy]: sortOrder },
    });
  }

  async getFileRecordById(id: number): Promise<FileRecord | null> {
    return await this.fileRecordRepository.findOne({
      where: { id },
    });
  }

  async getFileRecordByGuid(guid: string): Promise<FileRecord | null> {
    return await this.fileRecordRepository.findOne({
      where: { fileGuid: guid },
    });
  }

  async createFileRecord(data: Partial<FileRecord>): Promise<FileRecord> {
    if (data.fileGuid) {
      const existing = await this.getFileRecordByGuid(data.fileGuid);
      if (existing) {
        throw new ConflictException(
          `File record with fileGuid "${data.fileGuid}" already exists`,
          existing.id.toString(),
        );
      }
    }

    const record = this.fileRecordRepository.create(data);
    const saved = await this.fileRecordRepository.save(record);

    this.logger.log(`Created file record ${saved.id}: ${saved.name} (type: ${saved.type})`);
    return saved;
  }

  async updateFileRecord(id: number, data: Partial<FileRecord>): Promise<FileRecord> {
    const record = await this.getFileRecordById(id);
    if (!record) {
      throw new NotFoundException(`File record ${id} not found`);
    }

    if (data.fileGuid && data.fileGuid !== record.fileGuid) {
      const existing = await this.getFileRecordByGuid(data.fileGuid);
      if (existing) {
        throw new ConflictException(
          `File record with fileGuid "${data.fileGuid}" already exists`,
          existing.id.toString(),
        );
      }
    }

    Object.assign(record, data);
    const updated = await this.fileRecordRepository.save(record);

    this.logger.log(`Updated file record ${id}`);
    return updated;
  }

  async deleteFileRecord(id: number): Promise<void> {
    const record = await this.getFileRecordById(id);
    if (!record) {
      throw new NotFoundException(`File record ${id} not found`);
    }

    await this.fileRecordRepository.remove(record);
    this.logger.log(`Deleted file record ${id}: ${record.name}`);
  }
}
