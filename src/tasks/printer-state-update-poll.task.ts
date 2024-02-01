import { SettingsStore } from "@/state/settings.store";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { writeFileSync } from "node:fs";
import { ConfigService } from "@/services/core/config.service";
import { AppConstants } from "@/server.constants";
import { PrinterConnectionCache } from "@/state/printer-connection.cache";
import { AxiosError } from "axios";

export class PrinterStateUpdatePollTask {
  printerCache: PrinterCache;
  printerConnectionCache: PrinterConnectionCache;
  printerEventsCache: PrinterEventsCache;
  settingsStore: SettingsStore;
  configService: ConfigService;
  octoPrintApiService: OctoPrintApiService;
  taskManagerService: TaskManagerService;
  logger: LoggerService;

  constructor({
    printerCache,
    printerConnectionCache,
    printerEventsCache,
    octoPrintApiService,
    settingsStore,
    configService,
    taskManagerService,
    loggerFactory,
  }: {
    printerCache: PrinterCache;
    printerConnectionCache: PrinterConnectionCache;
    printerEventsCache: PrinterEventsCache;
    octoPrintApiService: OctoPrintApiService;
    settingsStore: SettingsStore;
    configService: ConfigService;
    taskManagerService: TaskManagerService;
    loggerFactory: ILoggerFactory;
  }) {
    this.printerCache = printerCache;
    this.printerConnectionCache = printerConnectionCache;
    this.printerEventsCache = printerEventsCache;
    this.settingsStore = settingsStore;
    this.configService = configService;
    this.octoPrintApiService = octoPrintApiService;
    this.taskManagerService = taskManagerService;
    this.logger = loggerFactory(PrinterStateUpdatePollTask.name);
  }

  async run() {
    const startTime = Date.now();

    const disabledPrintersCount = await this.printerCache.countDisabledPrinters();

    const printers = await this.printerCache.listCachedPrinters(false);
    const promisesStateUpdate = [];
    let failures = 0;
    let operational = 0;
    let disconnected = 0;
    let offlineAfterError = 0;
    let printing = 0;
    let paused = 0;
    for (const printer of printers) {
      const login = this.printerCache.getLoginDto(printer.id);
      try {
        const promise = await this.octoPrintApiService.getConnection(login).then(async (connection) => {
          await this.printerConnectionCache.setPrinterConnection(printer.id, connection);
          if (this._isDebugMode()) {
            writeFileSync(`printer_connection_${printer.id}.txt`, JSON.stringify(connection, null, 2));
          }

          const current = await this.octoPrintApiService
            .getPrinterCurrent(login, false, null, ["sd", "temperature"])
            .catch(async (e: Error) => {
              if ((e as AxiosError).isAxiosError) {
                const castError = e as AxiosError;
                if (castError?.response?.status == 409) {
                  // Printer is not connected, reset the current state
                  await this.printerEventsCache.setSubstate(printer.id, "current", "state", {});
                  disconnected += 1;

                  return null;
                }
              }

              throw e;
            });

          if (!current) return;
          if (this._isDebugMode()) {
            writeFileSync(`printer_current_${printer.id}.txt`, JSON.stringify(current, null, 2));
          }
          const currentState = current.state;
          operational += currentState?.flags.operational ? 1 : 0;
          disconnected += currentState?.flags.closedOrError ? 1 : 0;
          printing += currentState?.flags.printing ? 1 : 0;
          paused += currentState?.flags.paused ? 1 : 0;
          await this.printerEventsCache.setSubstate(printer.id, "current", "state", current);
        });
        promisesStateUpdate.push(promise);
      } catch (e: any) {
        failures++;
      }
    }

    await Promise.all(promisesStateUpdate);

    this.logger.log(
      `Printer state updates (total: ${
        printers.length
      }, failed: ${failures}, disabled: ${disabledPrintersCount}, operational: ${operational}, disconnected: ${disconnected}, offlineAfterError: ${offlineAfterError}, printing: ${printing}, paused: ${paused}) completed (${
        Date.now() - startTime
      }ms)`
    );
  }

  private _isDebugMode() {
    return (
      this.configService.get(AppConstants.debugFileWritePrinterStatesKey, AppConstants.defaultDebugFileWritePrinterStates) ===
      "true"
    );
  }
}
