import { Repository } from "typeorm";
import { PrintJob } from "@/entities/print-job.entity";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { AppConstants } from "@/server.constants";
import { getMediaPath } from "@/utils/fs.utils";
import path, { basename, extname, join } from "node:path";
import { access, mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import {
  buildDirectoryTree,
  createVirtualDirectory,
  deleteVirtualDirectory,
  listVirtualDirectories
} from "./virtual-directory.utils";

export interface IFileStorageService {
  saveFile(file: Express.Multer.File, fileHash?: string): Promise<string>;
  getFile(fileStorageId: string): Promise<Buffer>;
  deleteFile(fileStorageId: string): Promise<void>;
  getFilePath(fileStorageId: string): string;
  getFileSize(fileStorageId: string): number;
  calculateFileHash(filePath: string): Promise<string>;
  validateUniqueFilename(fileName: string): Promise<void>;
  saveMetadata(fileStorageId: string, metadata: any, fileHash?: string, originalFileName?: string, thumbnailMetadata?: any[]): Promise<void>;
  loadMetadata(fileStorageId: string): Promise<any | null>;
  hasMetadata(fileStorageId: string): Promise<boolean>;
  getDeterministicId(fileHash: string, fileName: string): string;
  findDuplicateByOriginalFileName(originalFileName: string): Promise<{fileStorageId: string; metadata: any} | null>;
  saveThumbnails(fileStorageId: string, thumbnails: Array<{data?: string; format?: string; width?: number; height?: number}>): Promise<Array<{index: number; path: string; filename: string; width: number; height: number; format: string; size: number}>>;
  getThumbnail(fileStorageId: string, index: number): Promise<Buffer | null>;
  listThumbnails(fileStorageId: string): Promise<string[]>;
  updateFileMetadata(fileStorageId: string, updates: {fileName?: string; path?: string; metadata?: any}): Promise<void>;
  batchUpdateFileMetadata(updates: Array<{fileStorageId: string; fileName?: string; path?: string; metadata?: any}>): Promise<{success: Array<{fileStorageId: string}>; failed: Array<{fileStorageId: string; error: string}>}>;
  createVirtualDirectory(virtualPath: string): Promise<Array<{ path: string; markerId: string }>>;
  listVirtualDirectories(): Promise<Array<{markerId: string; path: string; createdAt: string}>>;
  deleteVirtualDirectory(markerId: string): Promise<boolean>;
  getDirectoryTree(): Promise<any>;
}

export class FileStorageService implements IFileStorageService {
  printJobRepository: Repository<PrintJob>;
  private readonly logger;
  private readonly storageBasePath: string;
  private readonly STORAGE_SUBDIRS = ["gcode", "3mf", "bgcode"] as const;

  constructor(loggerFactory: ILoggerFactory, typeormService: TypeormService) {
    this.printJobRepository = typeormService.getDataSource().getRepository(PrintJob);
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

    stream.on("error", err => {
      this.logger.error(
        `Failed to read file ${fileStorageId}: ${err.message}`,
        err,
      );
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
      const { ConflictException } = await import("@/exceptions/runtime.exceptions");
      throw new ConflictException(
        `A file named "${fileName}" already exists in storage. Please rename the file, delete the existing file (ID: ${existing.fileStorageId}), or choose a different name.`,
        existing.fileStorageId
      );
    }
  }

  async saveFile(file: Express.Multer.File, fileHash?: string): Promise<string> {
    const fileExt = extname(file.originalname).toLowerCase();

    let fileId: string;
    if (fileHash) {
      const nameHash = createHash('sha256')
        .update(fileHash + file.originalname)
        .digest('hex')
        .substring(0, 32);
      fileId = `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
    } else {
      fileId = crypto.randomUUID();
    }

    let subdir = "gcode";
    if (fileExt === ".3mf" || file.originalname.includes(".gcode.3mf")) {
      subdir = "3mf";
    } else if (fileExt === ".bgcode") {
      subdir = "bgcode";
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
    } catch {
    }

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, '_thumbnails');
    try {
      await rm(thumbnailDir, { recursive: true, force: true });
      this.logger.debug(`Deleted thumbnails for ${fileStorageId}`);
    } catch {
    }

    this.logger.log(`Deleted file ${fileStorageId}`);
  }

  getFilePath(fileStorageId: string) : string {
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
    const nameHash = createHash('sha256')
      .update(fileHash + fileName)
      .digest('hex')
      .substring(0, 32);
    return `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
  }

  private async findFilePath(fileStorageId: string): Promise<string | null> {
    for (const subdir of this.STORAGE_SUBDIRS) {
      const dirPath = join(this.storageBasePath, subdir);
      try {
        const files = await readdir(dirPath);
        const matchingFile = files.find(f => f.startsWith(fileStorageId));
        if (matchingFile) {
          return join(dirPath, matchingFile);
        }
      } catch {
      }
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
          if (file.endsWith('_thumbnails') || file.endsWith('.json')) continue;

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

  async saveMetadata(fileStorageId: string, metadata: any, fileHash?: string, originalFileName?: string, thumbnailMetadata?: any[]): Promise<void> {
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
    } catch {
    }

    const metadataWithMeta = {
      ...metadata,
      _fileHash: fileHash || null,
      _analyzedAt: new Date().toISOString(),
      _fileStorageId: fileStorageId,
      _originalFileName: existingOriginalFileName || metadata.fileName || null,
      _thumbnails: existingThumbnails || [],
    };

    await writeFile(metadataPath, JSON.stringify(metadataWithMeta, null, 2), "utf8");
    const thumbnailMeta = thumbnailMetadata ? ` with ${thumbnailMetadata.length} thumbnail(s)` : '';
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
    } catch (error) {
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

  async saveThumbnails(fileStorageId: string, thumbnails: Array<{data?: string; format?: string; width?: number; height?: number}>): Promise<Array<{
    index: number;
    path: string;
    filename: string;
    width: number;
    height: number;
    format: string;
    size: number;
  }>> {
    const savedThumbnails: Array<any> = [];

    if (!thumbnails || thumbnails.length === 0) {
      return savedThumbnails;
    }

    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      this.logger.warn(`Cannot save thumbnails - file ${fileStorageId} not found`);
      return savedThumbnails;
    }

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, '_thumbnails');

    try {
      await rm(thumbnailDir, { recursive: true, force: true });
      this.logger.debug(`Cleared old thumbnails for ${fileStorageId}`);
    } catch {
    }

    await mkdir(thumbnailDir, { recursive: true });

    for (let i = 0; i < thumbnails.length; i++) {
      const thumb = thumbnails[i];
      if (!thumb.data) continue;

      const ext = thumb.format?.toLowerCase() || 'png';
      const filename = `thumb_${i}.${ext}`;
      const thumbPath = join(thumbnailDir, filename);

      try {
        const buffer = Buffer.from(thumb.data, 'base64');
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

        this.logger.debug(`Saved thumbnail ${i} for ${fileStorageId} (${thumb.width}x${thumb.height}, ${buffer.length} bytes)`);
      } catch (error) {
        this.logger.warn(`Failed to save thumbnail ${i} for ${fileStorageId}: ${error}`);
      }
    }

    return savedThumbnails;
  }

  async getThumbnail(fileStorageId: string, index: number): Promise<Buffer | null> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) return null;

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, '_thumbnails');

    for (const ext of ['png', 'jpg', 'jpeg', 'qoi']) {
      const thumbPath = join(thumbnailDir, `thumb_${index}.${ext}`);
      try {
        return await readFile(thumbPath);
      } catch {
      }
    }

    return null;
  }

  async listThumbnails(fileStorageId: string): Promise<string[]> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) return [];

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, '_thumbnails');

    try {
      const files = await readdir(thumbnailDir);
      return files.filter(f => f.startsWith('thumb_')).sort((a, b) => a.localeCompare(b));
    } catch {
      return [];
    }
  }

  async listAllFiles(): Promise<Array<{
    fileStorageId: string;
    fileName: string;
    fileFormat: string;
    fileSize: number;
    fileHash: string;
    createdAt: Date;
    thumbnailCount: number;
    metadata?: any;
  }>> {
    const files: any[] = [];

    for (const subdir of this.STORAGE_SUBDIRS) {
      const dirPath = join(this.storageBasePath, subdir);
      try {
        const dirFiles = await readdir(dirPath);

        for (const file of dirFiles) {
          if (file.endsWith('_thumbnails') || file.endsWith('.json')) continue;

          const fileId = path.parse(file).name;
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          const metadata = await this.loadMetadata(fileId);
          if (metadata?.type === 'directory') {
            continue;
          }
          
          const thumbnails = await this.listThumbnails(fileId);

          files.push({
            fileStorageId: fileId,
            fileName: metadata?._fileName || file,
            fileFormat: subdir,
            fileSize: stats.size,
            fileHash: metadata?._fileHash || '',
            createdAt: stats.birthtime,
            thumbnailCount: thumbnails.length,
            metadata: metadata,
          });
        }
      } catch (error) {
        this.logger.error(`Error listing files in ${subdir}`, error);
      }
    }

    return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        fileHash: metadata?._fileHash || '',
        createdAt: stats.birthtime,
        thumbnailCount: thumbnails.length,
        metadata: metadata,
      };
    } catch (error) {
      this.logger.error(`Error getting file info for ${fileStorageId}`, error);
      return null;
    }
  }

  async updateFileMetadata(fileStorageId: string, updates: {fileName?: string; path?: string; metadata?: any}): Promise<void> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      throw new Error(`File ${fileStorageId} not found`);
    }

    const existingMetadata = await this.loadMetadata(fileStorageId);
    if (!existingMetadata) {
      throw new Error(`Metadata for ${fileStorageId} not found`);
    }

    const updatedMetadata = {
      ...existingMetadata,
      ...updates.metadata,
    };

    if (updates.fileName !== undefined) {
      updatedMetadata._originalFileName = updates.fileName;
      updatedMetadata.fileName = updates.fileName;
    }

    if (updates.path !== undefined) {
      updatedMetadata._path = updates.path;
    }

    const metadataPath = filePath + ".json";
    await writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2), "utf8");
    this.logger.log(`Updated metadata for ${fileStorageId}`);
  }

  async batchUpdateFileMetadata(updates: Array<{fileStorageId: string; fileName?: string; path?: string; metadata?: any}>): Promise<{
    success: Array<{fileStorageId: string}>;
    failed: Array<{fileStorageId: string; error: string}>;
  }> {
    const results = {
      success: [] as Array<{fileStorageId: string}>,
      failed: [] as Array<{fileStorageId: string; error: string}>,
    };

    for (const update of updates) {
      try {
        await this.updateFileMetadata(update.fileStorageId, {
          fileName: update.fileName,
          path: update.path,
          metadata: update.metadata,
        });
        results.success.push({ fileStorageId: update.fileStorageId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.failed.push({
          fileStorageId: update.fileStorageId,
          error: errorMessage,
        });
        this.logger.warn(`Failed to update ${update.fileStorageId}: ${errorMessage}`);
      }
    }

    this.logger.log(`Batch update complete: ${results.success.length} succeeded, ${results.failed.length} failed`);
    return results;
  }


  async createVirtualDirectory(virtualPath: string): Promise<Array<{ path: string; markerId: string }>> {
    const createdMarkers = await createVirtualDirectory(this.storageBasePath, virtualPath);
    this.logger.log(`Created virtual directory: ${virtualPath} (${createdMarkers.length} markers created)`);
    return createdMarkers;
  }

  async listVirtualDirectories(): Promise<Array<{markerId: string; path: string; createdAt: string}>> {
    const markers = await listVirtualDirectories(this.storageBasePath);
    return markers.map(m => ({
      markerId: m._fileStorageId,
      path: m.path,
      createdAt: m.createdAt,
    }));
  }

  async deleteVirtualDirectory(markerId: string): Promise<boolean> {
    const deleted = await deleteVirtualDirectory(this.storageBasePath, markerId);
    if (deleted) {
      this.logger.log(`Deleted virtual directory marker: ${markerId}`);
    } else {
      this.logger.warn(`Virtual directory marker not found: ${markerId}`);
    }
    return deleted;
  }

  async getDirectoryTree(): Promise<any> {
    const files = await this.listAllFiles();
    const virtualDirs = await listVirtualDirectories(this.storageBasePath);

    return buildDirectoryTree(files, virtualDirs);
  }
}

