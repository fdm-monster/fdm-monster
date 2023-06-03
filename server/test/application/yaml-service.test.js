const dbHandler = require("../db-handler");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");
const { Printer } = require("../../models");
const { exportYamlBuffer } = require("./test-data/yaml-import");

let container;
let yamlService;
/**
 * @type {PrinterCache}
 */
let printerCache;
beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
});
afterEach(async () => {
  await Printer.deleteMany();
});
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("YamlService", () => {
  it("should import yaml", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer);
  });
});
