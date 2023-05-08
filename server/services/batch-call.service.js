class BatchCallService {
  octoPrintApiService;
  printerStore;
  jobCache;

  constructor({ octoPrintApiService, printerStore, jobCache }) {
    this.octoPrintApiService = octoPrintApiService;
    this.printerStore = printerStore;
    this.jobCache = jobCache;
  }

  async batchReprintCalls(printerIds) {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = this.printerStore.getPrinterLogin(printerId);
      const job = this.jobCache.getPrinterJob(printerId);
      const reprintPath = job?.filePath;
      if (!reprintPath?.length) {
        promises.push(Promise.resolve({ failure: true, error: "No file to reprint", printerId }));
        continue;
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

module.exports = { BatchCallService };
