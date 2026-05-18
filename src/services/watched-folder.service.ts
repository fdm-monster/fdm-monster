import { watch, type FSWatcher } from "chokidar";
import { basename, dirname, extname, relative, sep } from "node:path";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { AppConstants } from "@/server.constants";
import type { ConfigService } from "@/services/core/config.service";
import type { FileStorageService } from "@/services/file-storage.service";
import type { FileAnalysisService } from "@/services/file-analysis.service";
import type { RoutingService } from "@/services/routing.service";

const acceptedExtensions = [
  ...AppConstants.defaultAcceptedGcodeExtensions,
  ...AppConstants.defaultAcceptedBambuExtensions,
];

export class WatchedFolderService {
  private readonly logger: LoggerService;
  private watcher: FSWatcher | null = null;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
    private readonly fileAnalysisService: FileAnalysisService,
    private readonly routingService: RoutingService,
  ) {
    this.logger = loggerFactory(WatchedFolderService.name);
  }

  async start(): Promise<void> {
    const folderPath = this.configService.watchedFolderPath();
    if (!folderPath || this.watcher) {
      return;
    }

    this.logger.log(`Watching folder for dropped print files: ${folderPath}`);
    this.watcher = watch(folderPath, {
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 200 },
    });
    this.watcher.on("add", (filePath) => void this.handleFile(folderPath, filePath));
  }

  async stop(): Promise<void> {
    await this.watcher?.close();
    this.watcher = null;
  }

  isAccepted(filePath: string): boolean {
    return acceptedExtensions.includes(extname(filePath).toLowerCase());
  }

  subfolderOf(rootPath: string, filePath: string): string | null {
    const rel = relative(rootPath, dirname(filePath));
    if (!rel || rel.startsWith("..")) {
      return null;
    }
    return rel.split(sep)[0] || null;
  }

  async handleFile(rootPath: string, filePath: string): Promise<void> {
    if (!this.isAccepted(filePath)) {
      return;
    }

    if (this.configService.watchedFolderMode() === "library") {
      this.logger.warn(`Watched-folder library mode is not yet implemented; leaving ${filePath} in place`);
      return;
    }

    try {
      const originalName = basename(filePath);
      const subfolder = this.subfolderOf(rootPath, filePath);

      const fileHash = await this.fileStorageService.calculateFileHash(filePath);
      const fileStorageId = await this.fileStorageService.saveFile(
        { originalname: originalName, path: filePath } as Express.Multer.File,
        fileHash,
      );

      const analysis = await this.fileAnalysisService.analyzeFile(this.fileStorageService.getFilePath(fileStorageId));
      const metadata: any = analysis.metadata ?? {};
      // The subfolder is the primary routing signal and overrides any gcode token
      if (subfolder) {
        metadata.routingTarget = subfolder;
      }

      const thumbnails = analysis.thumbnails ?? [];
      const thumbnailMetadata =
        thumbnails.length > 0 ? await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails) : [];
      await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, originalName, thumbnailMetadata);

      const result = await this.routingService.queueForFile(fileStorageId);
      this.logger.log(
        result.queued
          ? `Imported ${originalName} from watched folder and queued it on printer ${result.printerId}`
          : `Imported ${originalName} from watched folder (left unassigned)`,
      );
    } catch (e) {
      this.logger.error(`Failed to import watched-folder file ${filePath}: ${e}`);
    }
  }
}
