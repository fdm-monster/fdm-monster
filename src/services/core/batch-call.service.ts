import { PrinterSocketStore } from "@/state/printer-socket.store";
import { PrinterCache } from "@/state/printer.cache";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { captureException } from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { IPrinterApi, ReprintFileDto, ReprintState } from "@/services/printer-api.interface";
import { LoginDto } from "@/services/interfaces/login.dto";

interface BatchSingletonModel {
  success?: boolean;
  failure?: boolean;
  printerId: number;
  time: number;
  error?: string;
}

type BatchModel = Array<BatchSingletonModel>;

export class BatchCallService {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerApiFactory: PrinterApiFactory,
    private readonly printerCache: PrinterCache,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly printerService: IPrinterService,
  ) {
    this.logger = loggerFactory(BatchCallService.name);
  }

  getPrinter(login: LoginDto): IPrinterApi {
    return this.printerApiFactory.getScopedPrinter(login);
  }

  async batchTogglePrintersEnabled(
    printerIds: number[],
    enabled: boolean,
  ): Promise<
    {
      failure?: boolean;
      error?: any;
      success?: boolean;
      printerId: number;
      time: number;
    }[]
  > {
    const promises = [];
    for (const printerId of printerIds) {
      let promise: Promise<any> | undefined = undefined;
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
      } else if (printerDto.enabled) {
        // If enabled, disable the printer
        promise = this.printerService
          .updateEnabled(printerId, false)
          .then(() => {
            return { success: true, printerId, time: Date.now() - time };
          })
          .catch((e) => {
            return { failure: true, error: e.message, printerId, time: Date.now() - time };
          });
      } else {
        this.logger.warn("Did not toggle printer enabled, its in maintenance");
      }

      if (promise) {
        promises.push(promise);
      }
    }

    return await Promise.all(promises);
  }

  batchConnectSocket(printerIds: number[]): void {
    for (const printerId of printerIds) {
      try {
        this.printerSocketStore.reconnectPrinterAdapter(printerId);
      } catch (e) {
        captureException(e);
        this.logger.error(`Error setting socket to reconnect ${errorSummary(e)}`);
      }
    }
  }

  async batchSettingsGet(printerIds: number[]): Promise<Awaited<BatchModel>> {
    const promises = [];
    for (const printerId of printerIds) {
      const login = await this.printerCache.getLoginDtoAsync(printerId);
      const time = Date.now();

      const client = this.getPrinter(login);

      const promise = client
        .getSettings()
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

  async batchConnectUsb(printerIds: number[]): Promise<Awaited<BatchModel>> {
    const promises = [];
    for (const printerId of printerIds) {
      const login = await this.printerCache.getLoginDtoAsync(printerId);
      const time = Date.now();

      const client = this.getPrinter(login);
      const promise = client
        .connect()
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

  async getBatchPrinterReprintFile(printerIds: number[]): Promise<ReprintFileDto[]> {
    const promises = [];
    for (const printerId of printerIds) {
      const promise = new Promise<ReprintFileDto>(async (resolve, _) => {
        try {
          const login = await this.printerCache.getLoginDtoAsync(printerId);
          const client = this.getPrinter(login);
          const partialReprintState = await client.getReprintState();

          return resolve({
            ...partialReprintState,
            printerId,
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

  async batchReprintCalls(printerIdFileList: { printerId: number; path: string }[]): Promise<Awaited<BatchModel>> {
    const promises = [];
    for (const printerIdFile of printerIdFileList) {
      const { printerId, path } = printerIdFile;
      const login = await this.printerCache.getLoginDtoAsync(printerId);

      const time = Date.now();
      const client = this.getPrinter(login);
      const promise = client
        .startPrint(path)
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
