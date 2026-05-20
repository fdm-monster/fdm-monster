import { watch, type FSWatcher } from "chokidar";
import { mkdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, extname, join, relative, sep } from "node:path";
import type { EventEmitter2 } from "eventemitter2";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { AppConstants } from "@/server.constants";
import type { ConfigService, WatchedFolderMode } from "@/services/core/config.service";
import type { FileStorageService } from "@/services/file-storage.service";
import type { FileAnalysisService } from "@/services/file-analysis.service";
import type { RoutingService } from "@/services/routing.service";
import { printerEvents, tagEvents } from "@/constants/event.constants";

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
    private readonly eventEmitter2: EventEmitter2,
  ) {
    this.logger = loggerFactory(WatchedFolderService.name);
  }

  async start(): Promise<void> {
    const folderPath = this.configService.watchedFolderPath();
    if (!folderPath || this.watcher) {
      return;
    }

    await this.ensureTargetFolders(folderPath);
    const refreshEvents = [
      printerEvents.printerCreated,
      printerEvents.batchPrinterCreated,
      printerEvents.printerUpdated,
      tagEvents.tagCreated,
      tagEvents.tagUpdated,
    ];
    for (const event of refreshEvents) {
      this.eventEmitter2.on(event, () => void this.ensureTargetFolders(folderPath));
    }

    const usePolling = this.configService.watchedFolderPolling();
    this.logger.log(`Watching folder for dropped print files: ${folderPath} (polling: ${usePolling})`);
    this.watcher = watch(folderPath, {
      ignoreInitial: false,
      usePolling,
      interval: 1000,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 200 },
    });
    this.watcher.on("add", (filePath) => void this.handleFile(folderPath, filePath));
  }

  // Auto-create by-printer/<name> and by-tag/<name> folders so users have somewhere to drop files
  async ensureTargetFolders(rootPath: string): Promise<void> {
    const { printers, tags } = await this.routingService.listRoutingTargets();
    await this.ensureScheme(rootPath, "by-printer", printers);
    await this.ensureScheme(rootPath, "by-tag", tags);
  }

  private async ensureScheme(rootPath: string, scheme: string, names: string[]): Promise<void> {
    const schemeDir = join(rootPath, scheme);
    await mkdir(schemeDir, { recursive: true });
    const invalidChars = '\\/:*?"<>|';
    for (const name of names) {
      if ([...name].some((c) => invalidChars.includes(c))) {
        this.logger.warn(`Skipping ${scheme} subfolder for "${name}": name has filesystem-invalid characters`);
        continue;
      }
      try {
        await mkdir(join(schemeDir, name), { recursive: true });
      } catch (e) {
        this.logger.error(`Could not create watched-folder subfolder "${scheme}/${name}": ${e}`);
      }
    }
  }

  async stop(): Promise<void> {
    await this.watcher?.close();
    this.watcher = null;
  }

  isAccepted(filePath: string): boolean {
    return acceptedExtensions.includes(extname(filePath).toLowerCase());
  }

  // Maps a watched-folder path to its routing scheme: by-printer/<name>/ or by-tag/<name>/
  routeOf(rootPath: string, filePath: string): { kind: "printer" | "tag"; key: string } | null {
    const rel = relative(rootPath, dirname(filePath));
    if (!rel || rel.startsWith("..")) {
      return null;
    }
    const [scheme, key] = rel.split(sep);
    if (!key) {
      return null;
    }
    if (scheme === "by-printer") {
      return { kind: "printer", key };
    }
    if (scheme === "by-tag") {
      return { kind: "tag", key };
    }
    return null;
  }

  async handleFile(rootPath: string, filePath: string): Promise<void> {
    if (!this.isAccepted(filePath)) {
      return;
    }

    const mode = this.configService.watchedFolderMode();
    try {
      const originalName = basename(filePath);
      const route = this.routeOf(rootPath, filePath);
      const fileHash = await this.fileStorageService.calculateFileHash(filePath);

      // Library mode leaves the file in place, so a re-scan must not re-import it
      if (mode === "library") {
        const existingId = this.fileStorageService.getDeterministicId(fileHash, originalName);
        if (await this.fileStorageService.fileExists(existingId)) {
          return;
        }
      }

      const fileStorageId = await this.storeFile(filePath, originalName, fileHash, mode);

      const analysis = await this.fileAnalysisService.analyzeFile(this.fileStorageService.getFilePath(fileStorageId));
      const metadata: any = analysis.metadata ?? {};
      // The folder is the primary routing signal and overrides any gcode token
      if (route) {
        const gcodeTarget = metadata.routingTarget;
        if (gcodeTarget && String(gcodeTarget).toLowerCase() !== route.key.toLowerCase()) {
          this.logger.warn(`${originalName}: folder "${route.key}" overrides gcode fdmm_target "${gcodeTarget}"`);
        }
        metadata.routingTarget = route.key;
        metadata.routingTargetKind = route.kind;
      }

      const thumbnails = analysis.thumbnails ?? [];
      const thumbnailMetadata =
        thumbnails.length > 0 ? await this.fileStorageService.saveThumbnails(fileStorageId, thumbnails) : [];
      await this.fileStorageService.saveMetadata(fileStorageId, metadata, fileHash, originalName, thumbnailMetadata);

      const result = await this.routingService.queueForFile(fileStorageId, route?.kind);
      if (result.queued) {
        this.logger.log(`Imported ${originalName} from watched folder and queued it on printer ${result.printerId}`);
      } else if (result.resolution.kind === "ambiguous") {
        this.logger.log(
          `Imported ${originalName} from watched folder — "${result.resolution.routingTarget}" matches both a printer and a tag, awaiting manual routing (job ${result.jobId})`,
        );
      } else {
        this.logger.log(
          `Imported ${originalName} from watched folder — awaiting printer assignment (job ${result.jobId})`,
        );
      }
    } catch (e) {
      this.logger.error(`Failed to import watched-folder file ${filePath}: ${e}`);
    }
  }

  private async storeFile(
    filePath: string,
    originalName: string,
    fileHash: string,
    mode: WatchedFolderMode,
  ): Promise<string> {
    if (mode === "library") {
      // Copy so the user's file stays in the watched folder
      const buffer = await readFile(filePath);
      return this.fileStorageService.saveFile({ originalname: originalName, buffer } as Express.Multer.File, fileHash);
    }

    // Consume: move the file into the library. rename() fails across devices
    // (a bind-mounted watched folder vs the media volume), so fall back to copy + delete.
    try {
      return await this.fileStorageService.saveFile(
        { originalname: originalName, path: filePath } as Express.Multer.File,
        fileHash,
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EXDEV") {
        throw e;
      }
      const buffer = await readFile(filePath);
      const fileStorageId = await this.fileStorageService.saveFile(
        { originalname: originalName, buffer } as Express.Multer.File,
        fileHash,
      );
      await rm(filePath, { force: true });
      return fileStorageId;
    }
  }
}
