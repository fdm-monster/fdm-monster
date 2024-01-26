import { PrinterFilesStore } from "@/state/printer-files.store";
import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { PrinterCache } from "@/state/printer.cache";
import { PrinterEventsCache } from "@/state/printer-events.cache";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";

interface BatchSingletonModel {
  success?: boolean;
  failure?: boolean;
  printerId: string;
  time: number;
  error?: string;
}

type BatchModel = Array<BatchSingletonModel>;

export class BatchCallService {
  octoPrintApiService: OctoPrintApiService;
  printerSocketStore: PrinterSocketStore;
  printerCache: PrinterCache;
  printerEventsCache: PrinterEventsCache;
  printerFilesStore: PrinterFilesStore;
  printerService: IPrinterService;

  constructor({
    octoPrintApiService,
    printerCache,
    printerEventsCache,
    printerSocketStore,
    printerFilesStore,
    printerService,
  }: {
    octoPrintApiService: OctoPrintApiService;
    printerCache: PrinterCache;
    printerEventsCache: PrinterEventsCache;
    printerSocketStore: PrinterSocketStore;
    printerFilesStore: PrinterFilesStore;
    printerService: IPrinterService;
  }) {
    this.octoPrintApiService = octoPrintApiService;
    this.printerCache = printerCache;
    this.printerEventsCache = printerEventsCache;
    this.printerSocketStore = printerSocketStore;
    this.printerFilesStore = printerFilesStore;
    this.printerService = printerService;
  }

  async batchTogglePrintersEnabled(printerIds: string[], enabled: boolean): Promise<void[]> {
    const promises = [];
    for (const printerId of printerIds) {
      let promise = Promise.resolve();
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
      this.printerSocketStore.reconnectOctoPrint(printerId);
    }
  }

  async batchConnectUsb(printerIds: string[]): Promise<Awaited<BatchModel>[]> {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);
      const time = Date.now();

      const command = this.octoPrintApiService.connectCommand;
      const promise = this.octoPrintApiService
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

  async getReprintFiles(printerIds: string[]): Promise<string[]> {
    const promises = [];
    for (const printerId of printerIds) {
      const promise = new Promise<string>(async () => {
        const login = await this.printerCache.getLoginDtoAsync(printerId);
        const files = await this.octoPrintApiService.getLocalFiles(login, true);
        files.sort((f1, f2) => {
          return f1.prints.last < f2.prints.last ? -1 : 1;
        });
        return files[0];
      });
      promises.push(promise);
    }

    return await Promise.all(promises);
  }

  async batchReprintCalls(printerIds: string[]): Promise<Awaited<BatchModel>[]> {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);

      // TODO test this
      let reprintPath = await this.printerEventsCache.getPrinterSocketEvents(printerId)?.current?.job?.file?.path;
      if (!reprintPath?.length) {
        const files = await this.printerFilesStore.getFiles(printerId)?.files;
        if (files?.length) {
          files.sort((f1, f2) => {
            // Sort by date, newest first
            return f1.date < f2.date ? 1 : -1;
          });

          reprintPath = files[0].path;
        }

        if (!files?.length) {
          promises.push(Promise.resolve({ failure: true, error: "No file to reprint", printerId }));
          continue;
        }
      }

      const time = Date.now();
      const promise = this.octoPrintApiService
        .selectPrintFile(printerLogin, reprintPath, true)
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
}
