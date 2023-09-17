/**
 * @typedef {Object} BatchSingletonModel
 * @property {boolean} [success]
 * @property {boolean} [failure]
 * @property {string} printerId
 * @property {number} time
 * @property {string} [error]
 */

/**
 * @typedef {Array<BatchSingletonModel>} BatchModel
 */

export class BatchCallService {
  /**
   * @type {OctoPrintApiService}
   */
  octoPrintApiService;
  /**
   * @type {PrinterSocketStore}
   */
  printerSocketStore;
  /**
   * @type {PrinterCache}
   */
  printerCache;
  /**
   * @type {PrinterEventsCache}
   */
  printerEventsCache;
  filesStore;
  /**
   * @type {PrinterService}
   */
  printerService;

  constructor({ octoPrintApiService, printerCache, printerEventsCache, printerSocketStore, filesStore, printerService }) {
    this.octoPrintApiService = octoPrintApiService;
    this.printerCache = printerCache;
    this.printerEventsCache = printerEventsCache;
    this.printerSocketStore = printerSocketStore;
    this.filesStore = filesStore;
    this.printerService = printerService;
  }

  /**
   * @param {string[]} printerIds
   * @param {boolean} enabled
   * @returns {void}
   */
  async batchTogglePrintersEnabled(printerIds, enabled) {
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

  /**
   * @param {string[]} printerIds
   * @returns {void}
   */
  batchConnectSocket(printerIds) {
    for (const printerId of printerIds) {
      this.printerSocketStore.reconnectOctoPrint(printerId);
    }
  }

  /**
   * @param {string[]} printerIds
   * @returns {Promise<Awaited<BatchModel>[]>}
   */
  async batchConnectUsb(printerIds) {
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

  /**
   * @param {string[]} printerIds
   * @returns {Promise<Awaited<BatchModel>[]>}
   */
  async batchReprintCalls(printerIds) {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = await this.printerCache.getLoginDtoAsync(printerId);

      // TODO test this
      let reprintPath = await this.printerEventsCache.getPrinterSocketEvents(printerId)?.current?.job?.file?.path;
      if (!reprintPath?.length) {
        const files = await this.filesStore.getFiles(printerId)?.files;
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
