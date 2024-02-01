import { YamlService } from "@/services/core/yaml.service";
import { PrinterCache } from "@/state/printer.cache";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { exportYamlBuffer1_3_1, exportYamlBuffer1_5_0 } from "./test-data/yaml-import";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { setupTestApp } from "../test-server";
import { join } from "path";
import { readFileSync } from "node:fs";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";

let container: AwilixContainer;
let yamlService: YamlService;
let printerCache: PrinterCache;
let printerService: IPrinterService;
let typeorm: TypeormService;
beforeAll(async () => {
  const { container } = await setupTestApp(true);
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
});
afterEach(async () => {
  const printers = await printerService.list();
  for (let printer of printers) {
    await printerService.delete(printer.id);
  }
});

describe(YamlService.name, () => {
  it("should import yaml from version 1.5.0", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_5_0(true));
  });

  it("should import yaml from version 1.3.1", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_3_1);
  });

  it("should import 1.5.2 yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.5.2.yaml"));
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(buffer);
  });
});
