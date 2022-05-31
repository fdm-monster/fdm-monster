jest.mock("../../services/octoprint/octoprint-api.service");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");

const dbHandler = require("../db-handler");
const { validNewPrinterState } = require("../application/test-data/printer.data");
const { EVENT_TYPES } = require("../../services/octoprint/constants/octoprint-websocket.constants");
let container;
let historyService;
let printersStore;
let octoPrintClientMock;

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  const settingsStore = container.resolve(DITokens.settingsStore);
  await settingsStore.loadSettings();
  historyService = container.resolve(DITokens.historyService);
  printersStore = container.resolve(DITokens.printersStore);
  octoPrintClientMock = container.resolve(DITokens.octoPrintApiService);

  await printersStore.loadPrintersStore();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("HistoryService", () => {
  it("should create history entry", async () => {
    const printerState = await printersStore.addPrinter(validNewPrinterState);
    const entry = await historyService.create(printerState, {}, {}, 0, EVENT_TYPES.PrintDone);
    expect(entry._id).toBeTruthy();
  });
});
