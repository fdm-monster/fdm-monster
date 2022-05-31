const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const { getJobCacheDefault } = require("../../../constants/cache.constants");

const printerId1 = "asd";
const copiedFileName = "bla.geezcode";
const websocketCurrentMsg = {
  currentZ: 1.0,
  progress: {},
  job: {
    file: {
      name: copiedFileName // Crucial?
    }
  }
};

const websocketCurrentMsgNoProgress = {
  currentZ: 1.0,
  job: {
    file: {
      name: copiedFileName // Crucial?
    }
  }
};

let container;
let jobsCache;
beforeAll(async () => {
  container = configureContainer();
  jobsCache = container.resolve(DITokens.jobsCache);
});

describe("JobsCache", () => {
  it("should generate printer job report", async function () {
    const printerId2 = "asd2";

    jobsCache.savePrinterJob(printerId1, websocketCurrentMsg);
    const printerJob = jobsCache.getPrinterJob(printerId1);
    expect(printerJob.job.file.name).toEqual(copiedFileName);
    expect(printerJob).toEqual(websocketCurrentMsg);

    const printerJobDefault = jobsCache.getPrinterJob(printerId2);
    expect(printerJobDefault).toEqual(getJobCacheDefault());
  });

  it("should not tolerate saving without id", () => {
    expect(() => jobsCache.getPrinterJob()).toThrow(
      "Job Cache cant get a null/undefined printer id"
    );
  });

  it("should not tolerate updating with wrong id", () => {
    expect(() => jobsCache.updatePrinterJob()).toThrow(
      "this printer ID undefined is not known. Cant update printer job cache."
    );
  });

  it("should be able to get serializable job progress", () => {
    jobsCache.savePrinterJob(printerId1, websocketCurrentMsg);

    expect(jobsCache.jobExists(printerId1)).toBeTruthy();

    const flatJob = jobsCache.getPrinterJobFlat(printerId1);
    expect(flatJob).toHaveProperty("fileName");

    // jobsCache.postProcessJob is work-in-progress due to the costSettings input
  });

  it("should be able to get serializable job without progress", () => {
    jobsCache.savePrinterJob(printerId1, websocketCurrentMsgNoProgress);

    const noProgressJob = jobsCache.getPrinterJobFlat(printerId1);
    expect(noProgressJob.progress).toEqual(0);
  });

  it("should throw for serializing unknown printer job id", () => {
    jobsCache.getPrinterJobFlat("nonexistingid");
  });

  it("should throw on deleting unknown job", () => {
    expect(jobsCache.purgePrinterId("notknown")).toBeUndefined();
  });

  it("should be able to delete known job", () => {
    const knownPrinter = "knownPrinter";
    jobsCache.savePrinterJob(knownPrinter, websocketCurrentMsg);
    jobsCache.purgePrinterId(knownPrinter);
  });
});
