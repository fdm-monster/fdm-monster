import { Repository } from "typeorm";
import { PrintJob } from "@/entities/print-job.entity";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { AppConstants } from "@/server.constants";
import { getMediaPath } from "@/utils/fs.utils";
import path, { basename, extname, join } from "node:path";
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

// edited by claude on 2026.01.24.09.30
export interface IFileStorageService {
  saveFile(file: Express.Multer.File, fileHash?: string): Promise<string>;
  getFile(fileStorageId: string): Promise<Buffer>;
  deleteFile(fileStorageId: string): Promise<void>;
  getFilePath(fileStorageId: string): string;
  calculateFileHash(filePath: string): Promise<string>;
  saveMetadata(fileStorageId: string, metadata: any, fileHash?: string, originalFileName?: string, thumbnailMetadata?: any[]): Promise<void>;
  loadMetadata(fileStorageId: string): Promise<any | null>;
  hasMetadata(fileStorageId: string): Promise<boolean>;
  getDeterministicId(fileHash: string, fileName: string): string;
  saveThumbnails(fileStorageId: string, thumbnails: Array<{data?: string; format?: string; width?: number; height?: number}>): Promise<Array<{index: number; path: string; filename: string; width: number; height: number; format: string; size: number}>>;
  getThumbnail(fileStorageId: string, index: number): Promise<Buffer | null>;
  listThumbnails(fileStorageId: string): Promise<string[]>;
  updateFileMetadata(fileStorageId: string, updates: {fileName?: string; metadata?: any}): Promise<void>;
  batchUpdateFileMetadata(updates: Array<{fileStorageId: string; fileName?: string; metadata?: any}>): Promise<{success: Array<{fileStorageId: string}>; failed: Array<{fileStorageId: string; error: string}>}>;
}
// End of Claude's edit

/**
 * Service for managing print job file storage with optional queue support
 */
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

  /**
   * Read file from storage
   */
  readFile(fileStorageId: string): Buffer {
    const filePath = this.getFilePath(fileStorageId);
    return readFileSync(filePath);
  }

  /**
   * Save uploaded file to storage
   * Storage ID is deterministic based on file hash + filename for deduplication
   */
  async saveFile(file: Express.Multer.File, fileHash?: string): Promise<string> {
    const fileExt = extname(file.originalname).toLowerCase();

    // Generate deterministic file ID from hash + filename
    let fileId: string;
    if (fileHash) {
      // Deterministic: hash(fileHash + fileName) for deduplication
      const nameHash = createHash('sha256')
        .update(fileHash + file.originalname)
        .digest('hex')
        .substring(0, 32);
      fileId = `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
    } else {
      // Fallback to random UUID if no hash provided
      fileId = crypto.randomUUID();
    }

    // Determine subdirectory based on file type
    let subdir = "gcode";
    if (fileExt === ".3mf" || file.originalname.includes(".gcode.3mf")) {
      subdir = "3mf";
    } else if (fileExt === ".bgcode") {
      subdir = "bgcode";
    }

    const targetDir = join(this.storageBasePath, subdir);
    const targetPath = join(targetDir, `${fileId}${fileExt}`);

    // Copy file to storage
    if (file.path) {
      // Multer already saved it, move it
      await rename(file.path, targetPath);
    } else if (file.buffer) {
      // File is in memory, write it
      await writeFile(targetPath, file.buffer);
    } else {
      throw new Error("File has no path or buffer");
    }

    this.logger.log(`Saved file ${file.originalname} as ${fileId}`);
    return fileId;
  }

  /**
   * Get file from storage
   */
  async getFile(fileStorageId: string): Promise<Buffer> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      throw new Error(`File ${fileStorageId} not found in storage`);
    }

    return readFile(filePath);
  }

  /**
   * Delete file from storage (also deletes metadata JSON and thumbnails)
   */
  async deleteFile(fileStorageId: string): Promise<void> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      this.logger.warn(`File ${fileStorageId} not found, cannot delete`);
      return;
    }

    // Delete the file
    await unlink(filePath);

    // Delete metadata JSON if it exists
    const metadataPath = filePath + ".json";
    try {
      await unlink(metadataPath);
      this.logger.debug(`Deleted metadata JSON for ${fileStorageId}`);
    } catch {
      // Metadata file might not exist
    }

    // Delete thumbnail directory if it exists
    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, '_thumbnails');
    try {
      await rm(thumbnailDir, { recursive: true, force: true });
      this.logger.debug(`Deleted thumbnails for ${fileStorageId}`);
    } catch {
      // Thumbnail dir might not exist
    }

    this.logger.log(`Deleted file ${fileStorageId}`);
  }

  /**
   * Get full file path
   */
  getFilePath(fileStorageId: string) : string {
    // This is synchronous, returns best-guess path
    // Use findFilePath for async validation

    // Try to find file with common extensions
    for (const subdir of this.STORAGE_SUBDIRS) {
      for (const ext of [".gcode", ".3mf", ".bgcode", ""]) {
        const fullPath = join(this.storageBasePath, subdir, fileStorageId + ext);
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
    }

    // Return best guess if not found (caller should validate)
    return join(this.storageBasePath, "gcode", fileStorageId);
  }

  /**
   * Calculate SHA256 hash of file
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hashSum = createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  }

  /**
   * Get deterministic storage ID from file hash + filename
   * Same file with same name = same ID (perfect deduplication)
   */
  getDeterministicId(fileHash: string, fileName: string): string {
    const nameHash = createHash('sha256')
      .update(fileHash + fileName)
      .digest('hex')
      .substring(0, 32);
    return `${nameHash.substring(0, 8)}-${nameHash.substring(8, 12)}-${nameHash.substring(12, 16)}-${nameHash.substring(16, 20)}-${nameHash.substring(20, 32)}`;
  }

  /**
   * Find file path across subdirectories
   */
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
        // Directory might not exist, continue
      }
    }

    return null;
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(fileStorageId: string): Promise<boolean> {
    const filePath = await this.findFilePath(fileStorageId);
    return filePath !== null;
  }

  /**
   * Find duplicate files by hash
   */
  async findDuplicateByHash(fileHash: string): Promise<PrintJob | null> {
    return this.printJobRepository.findOne({
      where: { fileHash },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Save analysis metadata as JSON alongside the file
   * Also stores hash, timestamp, original filename, and thumbnail index
   */
  async saveMetadata(fileStorageId: string, metadata: any, fileHash?: string, originalFileName?: string, thumbnailMetadata?: any[]): Promise<void> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      this.logger.warn(`Cannot save metadata - file ${fileStorageId} not found`);
      return;
    }

    const metadataPath = filePath + ".json";

    // Load existing metadata to preserve originalFileName and thumbnails
    let existingOriginalFileName = originalFileName;
    let existingThumbnails = thumbnailMetadata;
    try {
      const existingContent = await readFile(metadataPath, "utf8");
      const existing = JSON.parse(existingContent);
      // Preserve original filename from first save
      if (existing._originalFileName && !originalFileName) {
        existingOriginalFileName = existing._originalFileName;
      }
      // Preserve thumbnails if not provided
      if (existing._thumbnails && !thumbnailMetadata) {
        existingThumbnails = existing._thumbnails;
      }
    } catch {
      // File doesn't exist yet
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

  /**
   * Load analysis metadata from JSON file
   */
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
      // Metadata file doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Check if metadata JSON exists for a file
   */
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

  /**
   * Save thumbnails for a file
   * Returns array of thumbnail metadata with paths
   * Clears old thumbnails before saving new ones
   */
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

    // Delete old thumbnails directory if it exists
    try {
      await rm(thumbnailDir, { recursive: true, force: true });
      this.logger.debug(`Cleared old thumbnails for ${fileStorageId}`);
    } catch {
      // Directory might not exist
    }

    // Create fresh thumbnail directory
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

  /**
   * Get a specific thumbnail for a file
   */
  async getThumbnail(fileStorageId: string, index: number): Promise<Buffer | null> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) return null;

    const thumbnailDir = filePath.replace(/\.(gcode|3mf|bgcode)$/i, '_thumbnails');

    // Try different extensions (PNG, JPG, QOI)
    for (const ext of ['png', 'jpg', 'jpeg', 'qoi']) {
      const thumbPath = join(thumbnailDir, `thumb_${index}.${ext}`);
      try {
        return await readFile(thumbPath);
      } catch {
        // Try next extension
      }
    }

    return null;
  }

  /**
   * List all thumbnails for a file
   */
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

  /**
   * List all stored files with metadata
   */
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
          // Skip thumbnail directories and metadata files
          if (file.endsWith('_thumbnails') || file.endsWith('.json')) continue;

          const fileId = path.parse(file).name;
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          // Load metadata
          const metadata = await this.loadMetadata(fileId);

          // Count thumbnails
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

    // Sort by creation date, newest first
    return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get file information with metadata
   */
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

  // edited by claude on 2026.01.24.09.30
  /**
   * Update file metadata (fileName path and/or custom metadata fields)
   * Only updates the metadata JSON, does not move the physical file
   */
  async updateFileMetadata(fileStorageId: string, updates: {fileName?: string; metadata?: any}): Promise<void> {
    const filePath = await this.findFilePath(fileStorageId);
    if (!filePath) {
      throw new Error(`File ${fileStorageId} not found`);
    }

    // Load existing metadata
    const existingMetadata = await this.loadMetadata(fileStorageId);
    if (!existingMetadata) {
      throw new Error(`Metadata for ${fileStorageId} not found`);
    }

    // Merge updates into existing metadata
    const updatedMetadata = {
      ...existingMetadata,
      ...(updates.metadata || {}),
    };

    // Update fileName if provided
    if (updates.fileName !== undefined) {
      updatedMetadata._originalFileName = updates.fileName;
      updatedMetadata.fileName = updates.fileName;
    }

    // Save updated metadata
    const metadataPath = filePath + ".json";
    await writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2), "utf8");
    this.logger.log(`Updated metadata for ${fileStorageId}`);
  }

  /**
   * Batch update file metadata for multiple files
   * Returns success/failure results for each file
   */
  async batchUpdateFileMetadata(updates: Array<{fileStorageId: string; fileName?: string; metadata?: any}>): Promise<{
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
  // End of Claude's edit
}

