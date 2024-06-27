import { PrinterFilesStore } from "@/state/printer-files.store";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IdType } from "@/shared.constants";
import { CreateOrUpdatePrinterFileDto } from "../interfaces/printer-file.dto";
import { ConnectionState } from "@/services/octoprint/dto/connection/connection.dto";
import { captureException } from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

enum ReprintState {
  PrinterNotAvailable = 0,
  NoLastPrint = 1,
  LastPrintReady = 2,
}

interface ReprintFileDto {
  file?: CreateOrUpdatePrinterFileDto;
  reprintState: ReprintState;
  connectionState: ConnectionState | null;
  printerId: IdType;
}

interface BatchSingletonModel {
  success?: boolean;
  failure?: boolean;
  printerId: IdType;
  time: number;
  error?: string;
}

type BatchModel = Array<BatchSingletonModel>;

export class BatchCallService {
  octoprintClient: OctoprintClient;
  printerSocketStore: PrinterSocketStore;
  printerCache: PrinterCache;
  printerEventsCache: PrinterEventsCache;
  printerFilesStore: PrinterFilesStore;
  printerService: IPrinterService;
  logger: LoggerService;

  constructor({
    octoprintClient,
    printerCache,
    printerEventsCache,
    printerSocketStore,
    printerFilesStore,
    printerService,
    loggerFactory,
  }: {
    octoprintClient: OctoprintClient;
    printerCache: PrinterCache;
    printerEventsCache: PrinterEventsCache;
    printerSocketStore: PrinterSocketStore;
    printerFilesStore: PrinterFilesStore;
    printerService: IPrinterService;
    loggerFactory: ILoggerFactory;
  }) {
    this.octoprintClient = octoprintClient;
    this.printerCache = printerCache;
    this.printerEventsCache = printerEventsCache;
    this.printerSocketStore = printerSocketStore;
    this.printerFilesStore = printerFilesStore;
    this.printerService = printerService;
    this.logger = loggerFactory(BatchCallService.name);
  }

  async batchTogglePrintersEnabled(
    printerIds: string[],
    enabled: boolean
  ): Promise<
    {
      failure?: boolean;
      error?: any;
      success?: boolean;
      printerId: string;
      time: number;
    }[]
  > {
    const promises = [];
    for (const printerId of printerIds) {
      let promise: Promise<any>;
      const printerDto = await this.printerCache.getValue(printerId);
      if (!printerDto) continue;

      const time = Date.now();
      if (enabled) {
        // If disabled, but not in maintenance, enable the printer
        if (!printerDto.enabled && !printerDto.disabledReason?.length) {
          promise = this.printerService
            .updateEnabled(printerId, true)
            .then(() => {
              return { success: true, printerId, time: Date.now() - time };
            })
            .catch((e) => {
              return { failure: true, error: e.message, printerId, time: Date.now() - time };
            });
        }
      } else {
        // If enabled, disable the printer
        if (printerDto.enabled) {
          promise = this.printerService
            .updateEnabled(printerId, false)
            .then(() => {
              return { success: true, printerId, time: Date.now() - time };
            })
            .catch((e) => {
              return { failure: true, error: e.message, printerId, time: Date.now() - time };
            });
        }
      }
      promises.push(promise);
    }

    return await Promise.all(promises);
  }

  batchConnectSocket(printerIds: string[]): void {
    for (const printerId of printerIds) {
      try {
        this.printerSocketStore.reconnectOctoPrint(printerId);
      } catch (e) {
        captureException(e);
        this.logger.error(`Error setting socket to reconnect ${errorSummary(e)}`);
      }
    }
  }

  async batchSettingsGet(printerIds: string[]): Promise<Awaited<BatchModel>> {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
      const time = Date.now();

      const promise = this.octoprintClient
        .getSettings(printerLogin)
        .then((r) => {
          return { success: true, printerId, time: Date.now() - time, value: r };
        })
        .catch((e) => {
          return { failure: true, error: e.message, printerId, time: Date.now() - time };
        });

      promises.push(promise);
    }
    return await Promise.all(promises);
  }

  async batchConnectUsb(printerIds: string[]): Promise<Awaited<BatchModel>> {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
      const time = Date.now();

      const command = this.octoprintClient.connectCommand;
      const promise = this.octoprintClient
        .sendConnectionCommand(printerLogin, command)
        .then(() => {
          return { success: true, printerId, time: Date.now() - time };
        })
        .catch((e) => {
          return { failure: true, error: e.message, printerId, time: Date.now() - time };
        });

      promises.push(promise);
    }
    return await Promise.all(promises);
  }

  async getBatchPrinterReprintFile(printerIds: IdType[]): Promise<ReprintFileDto[]> {
    const promises = [];
    for (const printerId of printerIds) {
      const promise = new Promise<ReprintFileDto>(async (resolve, _) => {
        try {
          const login = await this.printerCache.getLoginDtoAsync(printerId);
          const files = (await this.octoprintClient.getLocalFiles(login, true)).filter((f) => f?.prints?.last?.date);

          const connected = await this.octoprintClient.getConnection(login);
          const connectionState = connected.current?.state;

          // OctoPrint sorts by last print time by default
          // files.sort((f1, f2) => {
          //   return f1?.prints?.last?.date > f2?.prints?.last?.date ? 1 : -1;
          // });

          if (files?.length == 0) {
            return resolve({ connectionState, printerId, reprintState: ReprintState.NoLastPrint });
          }

          return resolve({
            connectionState,
            file: files[0],
            printerId,
            reprintState: ReprintState.LastPrintReady,
          });
        } catch (e) {
          captureException(e);
          return resolve({
            connectionState: null,
            printerId,
            reprintState: ReprintState.PrinterNotAvailable,
          });
        }
      });
      promises.push(promise);
    }

    return await Promise.all(promises);
  }

  async batchReprintCalls(printerIdFileList: { printerId: IdType; path: string }[]): Promise<Awaited<BatchModel>> {
    const promises = [];
    for (const printerIdFile of printerIdFileList) {
      const { printerId, path } = printerIdFile;
      const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);

      const time = Date.now();
      const promise = this.octoprintClient
        .postSelectPrintFile(printerLogin, path, true)
        .then(() => {
          return { success: true, printerId, time: Date.now() - time };
        })
        .catch((e) => {
          captureException(e);
          return { failure: true, error: e.message, printerId, time: Date.now() - time };
        });

      promises.push(promise);
    }
    return await Promise.all(promises);
  }
}
