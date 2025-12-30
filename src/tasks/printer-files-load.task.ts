import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterFilesStore } from "@/state/printer-files.store";
import { TaskService } from "@/services/interfaces/task.interfaces";

/**
 * Background task to load printer files during boot to avoid blocking server startup
 */
export class PrinterFilesLoadTask implements TaskService {
  logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerFilesStore: PrinterFilesStore,
  ) {
    this.logger = loggerFactory(PrinterFilesLoadTask.name);
  }

  async run() {
    this.logger.log("Loading files store in background");
    try {
      await this.printerFilesStore.loadFilesStore();
      this.logger.log("Files store loaded successfully in background");
    } catch (error) {
      this.logger.error("Failed to load files store in background", error);
    }
  }
}
