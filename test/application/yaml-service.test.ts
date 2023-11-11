import { YamlService } from "@/services/core/yaml.service";
import { PrinterCache } from "@/state/printer.cache";
import { AwilixContainer } from "awilix";
import { connect, closeDatabase } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { Printer } from "@/models";
import { exportYamlBuffer } from "./test-data/yaml-import";
import { readFileSync } from "node:fs";
import { join } from "path";

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

describe(YamlService.name, () => {
  it("should import yaml", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer);
  });

  it("should import 1.5.2 yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.5.2.yaml"));
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(buffer);
  });
});
