import { SettingsStore } from "@/state/settings.store";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { writeFileSync } from "node:fs";
import { errorSummary } from "@/utils/error.utils";
import { isDevelopmentEnvironment } from "@/utils/env.utils";
import { ConfigService } from "@/services/core/config.service";
import { AppConstants } from "@/server.constants";

export class PrinterStateUpdatePollTask {
  printerCache: PrinterCache;
  printerEventsCache: PrinterEventsCache;
  settingsStore: SettingsStore;
  configService: ConfigService;
  octoPrintApiService: OctoPrintApiService;
  taskManagerService: TaskManagerService;
  logger: LoggerService;

  constructor({
    printerCache,
    printerEventsCache,
    octoPrintApiService,
    settingsStore,
    configService,
    taskManagerService,
    loggerFactory,
  }: {
    printerCache: PrinterCache;
    printerEventsCache: PrinterEventsCache;
    octoPrintApiService: OctoPrintApiService;
    settingsStore: SettingsStore;
    configService: ConfigService;
    taskManagerService: TaskManagerService;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerCache = printerCache;
    this.printerEventsCache = printerEventsCache;
    this.settingsStore = settingsStore;
    this.configService = configService;
    this.octoPrintApiService = octoPrintApiService;
    this.taskManagerService = taskManagerService;
    this.logger = loggerFactory(PrinterStateUpdatePollTask.name);
  }

  async run() {
    const startTime = Date.now();
    this.logger.log("Refreshing disconnected printer states");

    const printers = await this.printerCache.listCachedPrinters(false);
    const promisesStateUpdate = [];
    for (const printer of printers) {
      const login = this.printerCache.getLoginDto(printer.id);
      try {
        const promise = await this.octoPrintApiService.getConnection(login).then(async (connection) => {
          const current = await this.octoPrintApiService.getPrinterCurrent(login, false, null, ["sd", "temperature"]);
          if (
            this.configService.get(
              AppConstants.debugFileWritePrinterStatesKey,
              AppConstants.defaultDebugFileWritePrinterStates
            ) === "true"
          ) {
            writeFileSync(`printer_current_${printer.id}.txt`, JSON.stringify(current, null, 2));
            writeFileSync(`printer_connection_${printer.id}.txt`, JSON.stringify(connection, null, 2));
          }
          await this.printerEventsCache.setSubstate(printer.id, "current", "state", current);
        });
        promisesStateUpdate.push(promise);
      } catch (e: any) {
        this.logger.warn(`Printer state update ${errorSummary(e)}`);
      }
    }

    await Promise.all(promisesStateUpdate);

    if (this.settingsStore.getSettingsSensitive().server.debugSettings?.debugSocketRetries) {
      this.logger.log(`Printer state updates (count: ${printers.length}) completed (${Date.now() - startTime}ms)`);
    } else {
      this.logger.log(`Completed printer state update (count: ${printers.length})`);
    }
  }
}
