import { afterAll, afterEach, beforeAll, describe, it } from "@jest/globals";
import { YamlService } from "../../server/services/yaml.service";
import { AwilixContainer } from "awilix";
import { PrinterCache } from "../../server/state/printer.cache";
import { connect, closeDatabase } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { Printer } from "@/models";
import { exportYamlBuffer } from "./test-data/yaml-import";

let container: AwilixContainer;
let yamlService: YamlService;
let printerCache: PrinterCache;
beforeAll(async () => {
  await connect();
  container = configureContainer();
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
});
afterEach(async () => {
  await Printer.deleteMany();
});
afterAll(async () => {
  await closeDatabase();
});

describe("YamlService", () => {
  it("should import yaml", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer);
  });
});
