const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");
const { validNewPrinterState } = require("./test-data/printer.data");
const awilix = require("awilix");
const AxiosMock = require("../mocks/axios.mock");

let batchCallService;
let printerStore;
let httpClient;

beforeAll(async () => {
  await dbHandler.connect();
  const container = configureContainer();
  container.register(DITokens.httpClient, awilix.asClass(AxiosMock).singleton());
  printerStore = container.resolve(DITokens.printerStore);
  batchCallService = container.resolve(DITokens.batchCallService);
  httpClient = container.resolve(DITokens.httpClient);
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
    await printerStore.loadPrinterStore();
    let printer = await printerStore.addPrinter(validNewPrinterState);
    let printer2 = await printerStore.addPrinter(validNewPrinterState);

    const result = await batchCallService.batchReprintCalls([printer.id, printer2.id]);
    expect(result).toHaveLength(2);
  });
});
