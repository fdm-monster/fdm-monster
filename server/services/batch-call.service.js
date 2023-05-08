class BatchCallService {
  octoPrintApiService;
  printerStore;
  jobsCache;
  filesStore;

  constructor({ octoPrintApiService, printerStore, jobsCache, filesStore }) {
    this.octoPrintApiService = octoPrintApiService;
    this.printerStore = printerStore;
    this.jobsCache = jobsCache;
    this.filesStore = filesStore;
  }

  async batchReprintCalls(printerIds) {
    const promises = [];
    for (const printerId of printerIds) {
      const printerLogin = this.printerStore.getPrinterLogin(printerId);
      const job = this.jobsCache.getPrinterJob(printerId);
      let reprintPath = job?.filePath;
      if (!reprintPath?.length) {
        const files = this.filesStore.getFiles(printerId)?.files;
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

module.exports = { BatchCallService };
