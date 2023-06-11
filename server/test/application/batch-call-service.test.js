const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");
const { validNewPrinterState } = require("./test-data/printer.data");
const awilix = require("awilix");
const AxiosMock = require("../mocks/axios.mock");

/**
 * @type {BatchCallService}
 */
let batchCallService;
/**
 * @type {PrinterService}
 */
let printerService;
let httpClient;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock).singleton());
  printerService = container.resolve(DITokens.printerService);
  batchCallService = container.resolve(DITokens.batchCallService);
  const settingsStore = container.resolve(DITokens.settingsStore);
  httpClient = container.resolve(DITokens.httpClient);
  await settingsStore.loadSettings();
});
afterEach(async () => {
  await dbHandler.clearDatabase();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

beforeEach(() => {
  httpClient.saveMockResponse(undefined, 200);
});

describe("BatchCallService ", () => {
  it("should call multiple printers ", async () => {
    let printer = await printerService.create(validNewPrinterState);
    let printer2 = await printerService.create(validNewPrinterState);

    const result = await batchCallService.batchReprintCalls([printer.id, printer2.id]);
    expect(result).toHaveLength(2);
  });
});
