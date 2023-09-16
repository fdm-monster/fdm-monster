import { clearDatabase, closeDatabase, connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { validNewPrinterState } from "./test-data/printer.data";
import { asClass } from "awilix";
import { AxiosMock } from "../mocks/axios.mock";
import { BatchCallService } from "@/services/batch-call.service";
import { SettingsStore } from "@/state/settings.store";
import { PrinterService } from "@/services/printer.service";

let batchCallService: BatchCallService;
let printerService: PrinterService;
let httpClient: AxiosMock;

beforeAll(async () => {
  await connect();
  const container = configureContainer();
  container.register(DITokens.httpClient, asClass(AxiosMock).singleton());
  printerService = container.resolve(DITokens.printerService);
  batchCallService = container.resolve(DITokens.batchCallService);
  const settingsStore = container.resolve(DITokens.settingsStore) as SettingsStore;
  httpClient = container.resolve(DITokens.httpClient);
  await settingsStore.loadSettings();
});
afterEach(async () => {
  await clearDatabase();
});
afterAll(async () => {
  await closeDatabase();
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
