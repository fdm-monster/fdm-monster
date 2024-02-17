import { YamlService } from "@/services/core/yaml.service";
import { PrinterCache } from "@/state/printer.cache";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { exportYamlBuffer1_3_1, exportYamlBuffer1_5_0, exportYamlBuffer1_6_0 } from "./test-data/yaml-import";
import { setupTestApp } from "../test-server";
import { join } from "path";
import { readFileSync } from "node:fs";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IFloorService } from "@/services/interfaces/floor.service.interface";

let container: AwilixContainer;
let yamlService: YamlService;
let printerCache: PrinterCache;
let printerService: IPrinterService;
let floorService: IFloorService;

beforeAll(async () => {
  const { container } = await setupTestApp(true);
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  floorService = container.resolve(DITokens.floorService);
});
afterEach(async () => {
  const printers = await printerService.list();
  for (const printer of printers) {
    await printerService.delete(printer.id);
  }
  const floors = await floorService.list();
  for (const floor of floors) {
    await floorService.delete(floor.id);
  }
});

describe(YamlService.name, () => {
  it("should import yaml from version 1.3.1", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_3_1);

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_3_1");
    expect(floor).toBeDefined();
  });

  it("should import yaml from version 1.5.0", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_5_0(true));

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_5_0");
    expect(floor).toBeDefined();
  });

  it("should import 1.5.2 mongodb yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.5.2-mongodb.yaml"));
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Dragon Eggggg");

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_5_2");
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(2);
    expect(floor.printers.find((p) => p.printerId === printer.id)).toBeDefined();
  });

  it("should import yaml from version 1.6.0 sqlite", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_6_0(true));

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_6_0");
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(2);
  });

  it("should import 1.6.0 sqlite yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.6.0-sqlite.yaml"));
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Dragon Eggggg");

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_6_0");
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(3);
    expect(floor.printers.find((p) => p.printerId === printer.id)).toBeDefined();
  });
});
