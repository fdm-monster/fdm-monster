jest.mock("../../../server/services/history.service");

const emptyLegalHistoryCache = [{ printHistory: {} }];
const realisticHistoryCache = require("../mock-data/Histories.json");
const { configureContainer } = require("../../../container");
const DITokens = require("../../../container.tokens");
const { assignYCumSum } = require("../../../utils/graph-point.utils");

const interestingButWeirdHistoryCache = [
  {
    success: false,
    reason: "failed",
    totalLength: 1,
    filamentSelection: {
      spools: {
        profile: {
          diameter: 5,
          density: 3
        }
      }
    },
    job: {
      filament: "pla"
    },
    spools: {
      pla: {
        type: "pla"
      }
    }
  }
];

const nullJobHistoryCache = [
  {
    job: null
  },
  {
    success: true,
    job: null
  }
];

function legacyConvertIncremental(input) {
  let usageWeightCalc = 0;
  let newObj = [];
  for (let i = 0; i < input.length; i++) {
    if (typeof newObj[i - 1] !== "undefined") {
      usageWeightCalc = newObj[i - 1].y + input[i].y;
    } else {
      usageWeightCalc = input[i].y;
    }
    newObj.push({ x: input[i].x, y: usageWeightCalc });
  }
  return newObj;
}

let container;
let historyStore;
let mockHistoryService;

beforeEach(() => {
  if (container) container.dispose();
  container = configureContainer();
  historyStore = container.resolve(DITokens.historyStore);
  mockHistoryService = container.resolve(DITokens.historyService);

  mockHistoryService.resetMockData();

  /*eslint no-extend-native: "off"*/
  Date.prototype.getTimezoneOffset = jest.fn(() => 0);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("historyStore", () => {
  Date.now = () => 1618059562000;
  process.env.TZ = "UTC";

  it("should initiate and finish within 5 sec for empty history", async () => {
    expect(await mockHistoryService.find({})).toHaveLength(0);

    await historyStore.loadHistoryStore();
    const { stats, history } = historyStore.getHistoryCache();

    expect(stats).toBeTruthy();
    expect(history).toBeTruthy();
    expect(history).toHaveLength(0);
  });

  it("should initiate and finish within 5 sec for non-empty history", async () => {
    // Mock only function
    mockHistoryService.saveMockData(emptyLegalHistoryCache);
    expect(await mockHistoryService.find({})).toStrictEqual(emptyLegalHistoryCache);

    await historyStore.loadHistoryStore();

    const { history, stats } = historyStore.getHistoryCache();
    expect(history[0].path).toBeUndefined();
    expect(stats).toBeTruthy();
  });

  it("should initiate and finish within 5 sec for realistic history", async () => {
    // Mock only function
    mockHistoryService.saveMockData(realisticHistoryCache);

    expect(await mockHistoryService.find({})).toStrictEqual(realisticHistoryCache);

    await historyStore.loadHistoryStore();

    const { history } = historyStore.getHistoryCache();
    expect(history.length).toEqual(realisticHistoryCache.length);
    history.forEach((h) => {
      expect(h.printerName).toContain("PRINTER");
      expect(h.notes).not.toBeUndefined();
      expect(h.startDate).toContain("202");
      expect(h.endDate).toContain("202");
      expect(h.printCost).not.toBeUndefined();
      expect(h.printCost).not.toBeNaN();
    });
    const stats = historyStore.generateStatistics();
    expect(stats).toBeTruthy();

    expect(stats).toEqual({
      completed: 10,
      cancelled: 4,
      failed: 0,
      longestPrintTime: 20900,
      shortestPrintTime: 64,
      averagePrintTime: 11014.1,
      mostPrintedFile: "file.gcode",
      printerMost: "PRINTER2",
      printerLeast: "PRINTER1",
      totalFilamentCost: NaN,
      highestFilamentCost: NaN,
      totalPrintCost: 7.634603469051243,
      highestPrintCost: 1.8927111237950278,
      currentFailed: 247,
      historyByDay: [],
      totalByDay: [],
      usageOverTime: []
    });

    expect(stats.historyByDay).toHaveLength(0);
    expect(stats.totalSpoolCost).not.toBe("NaN");
    expect(stats.highestSpoolCost).not.toBe("NaN");
  });

  it("should be able to generate statistics without error", async function () {
    mockHistoryService.saveMockData(emptyLegalHistoryCache);
    expect(await mockHistoryService.find({})).toHaveLength(1);

    // Empty history database => empty cache
    await historyStore.loadHistoryStore();
    const { history } = historyStore.getHistoryCache();
    expect(history).toHaveLength(1);

    // Another test phase
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);
    await historyStore.loadHistoryStore();
    const { history: history2 } = historyStore.getHistoryCache();
    expect(history2[0].printCost).toEqual(0);
    // Act
    const historyStats = historyStore.generateStatistics();
    // Assert
    expect(historyStats).toBeTruthy();
    expect(historyStats.failed).toEqual(1);
  });

  // TODO conform new type for filament (key-value array)
  // TODO historyStore[0]:job:printTimeAccuracy === NaN
  it("should turn a single tool into array", async () => {
    mockHistoryService.saveMockData(realisticHistoryCache);

    await historyStore.loadHistoryStore();
    const { history } = historyStore.getHistoryCache();

    expect(history).toHaveLength(14);
    expect(history[3].spools).toBeFalsy();
  });

  it("should not throw when job property is null", async () => {
    mockHistoryService.saveMockData(nullJobHistoryCache);

    await expect(await historyStore.loadHistoryStore()).resolves;
    const stats = await historyStore.generateStatistics();

    expect(stats).toBeTruthy();
    expect(stats.completed).toEqual(1);
    expect(stats.failed).toEqual(1);
  });
});

/**
 * Most of these functions below are easily tested in isolation
 */
describe("historyStore:Static", () => {
  it("assignYCumSum tolerate falsy y values and skips falsy entries", () => {
    const undefinedYInput = [
      { x: 0, y: undefined },
      { x: 0, y: 1 },
      { x: 0, y: undefined },
      { x: 0 },
      { x: 0, y: 1 }
    ];
    const missingYInput = [
      { x: 0 },
      { x: 0, y: 1 },
      {
        x: 0,
        y: 1
      },
      { x: 0 },
      { x: 0, y: 1 }
    ];
    const falsyContainingInput = [
      null,
      {
        x: 0,
        y: 1
      },
      { x: 0 },
      undefined,
      { x: 0, y: 1 }
    ];
    // Prove that the old function was buggy
    expect(legacyConvertIncremental(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: NaN
    });
    expect(legacyConvertIncremental(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: NaN
    });
    expect(() => legacyConvertIncremental(falsyContainingInput)[4]).toThrow();

    // Prove that the new function outputs something useful
    expect(assignYCumSum(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: 2
    });
    expect(assignYCumSum(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: 3
    });

    // Prove that the new function outputs for only defined x properties, but tolerates falsy y
    const gappyCumSum = assignYCumSum(falsyContainingInput);
    expect(gappyCumSum.length).toEqual(3);
    expect(gappyCumSum[2]).toStrictEqual({ x: 0, y: 2 });
  });

  it("assignYCumSum is equivalent to map-cumulativeSum operator", () => {
    const input = [
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 }
    ];
    const unitUnderTestResult = legacyConvertIncremental(input);
    expect(unitUnderTestResult).toHaveLength(5);
    expect(unitUnderTestResult[4]).toStrictEqual({ x: 0, y: 5 });

    const operatorComparedResult = assignYCumSum(input);
    expect(operatorComparedResult).toStrictEqual(unitUnderTestResult);
  });
});

describe("historyStore:Utilities", () => {
  it("deeply nested property material should never resolve to falsy property", () => {
    const testedValues = ["", null, undefined, {}, [], 0, -1];
    for (let value of testedValues) {
      expect(value?.spools?.profile?.material || "").toBe("");
    }
  });
});
