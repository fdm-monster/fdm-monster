import { YamlService } from "@/services/core/yaml.service";
import { PrinterCache } from "@/state/printer.cache";
import { AwilixContainer } from "awilix";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { Printer } from "@/models";
import { exportYamlBuffer1_3_1, exportYamlBuffer1_5_0 } from "./test-data/yaml-import";
import { TypeormService } from "@/services/typeorm/typeorm.service";

let container: AwilixContainer;
let yamlService: YamlService;
let printerCache: PrinterCache;
let typeorm: TypeormService;
beforeAll(async () => {
  container = configureContainer(true);
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  await typeorm.createConnection();
});
afterEach(async () => {
  await typeorm.getDataSource().getRepository(Printer).clear();
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
});
