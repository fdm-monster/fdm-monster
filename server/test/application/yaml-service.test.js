const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");
const { Printer } = require("../../models");
const { exportYamlBuffer } = require("./test-data/yaml-import");

let container;
let yamlService;
let printerStore;
beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  yamlService = container.resolve(DITokens.yamlService);
  printerStore = container.resolve(DITokens.printerStore);
});
afterEach(async () => {
  await Printer.deleteMany();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("YamlService", () => {
  it("should import yaml", async () => {
    await printerStore.loadPrinterStore();
    await yamlService.importPrintersAndFloors(exportYamlBuffer);
  });
});
