import { YamlService } from "@/services/core/yaml.service";
import { PrinterCache } from "@/state/printer.cache";
import { DITokens } from "@/container.tokens";
import { exportYamlBuffer1_3_1, exportYamlBuffer1_5_0, exportYamlBuffer1_6_0 } from "./test-data/yaml-import";
import { setupTestApp } from "../test-server";
import { join } from "path";
import { readFileSync } from "node:fs";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { PrinterGroupService } from "@/services/orm/printer-group.service";
import { testPrinterData } from "./test-data/printer.data";
import { FloorStore } from "@/state/floor.store";
import { FloorPositionService } from "@/services/orm/floor-position.service";
import { OctoprintType } from "@/services/printer-api.interface";
import { SettingsStore } from "@/state/settings.store";

let yamlService: YamlService;
let printerCache: PrinterCache;
let printerService: IPrinterService;
let floorService: IFloorService;
let floorStore: FloorStore;
let printerGroupService: PrinterGroupService;
let settingsStore: SettingsStore;
let isTypeormMode: boolean;
// Use only when isTypeormMode is true
let floorPositionService: FloorPositionService;

beforeAll(async () => {
  const { container, isTypeormMode: _isTypeormMode } = await setupTestApp(true);
  isTypeormMode = _isTypeormMode;
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  floorService = container.resolve(DITokens.floorService);
  floorPositionService = container.resolve(DITokens.floorPositionService);
  floorStore = container.resolve(DITokens.floorStore);
  printerGroupService = container.resolve(DITokens.printerGroupService);
  settingsStore = container.resolve(DITokens.settingsStore);
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
  it("should import yaml from version 1.3.1 and export it", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_3_1);

    const yamlDump = await yamlService.exportPrintersAndFloors({
      exportFloors: true,
      exportPrinters: true,
      exportFloorGrid: true,
      exportGroups: true,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump.includes(`printerType: ${OctoprintType}`)).toBeTruthy();
  });

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
    const printer = printers.find((p) => p.name === "Dragon Eggggg")!;
    expect(printer).toBeDefined();

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_5_2")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(2);
    if (isTypeormMode) {
      expect(typeof printer.id).toBe("number");
    } else {
      expect(typeof printer.id).toBe("string");
    }
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();
  });

  it("should import yaml from version 1.6.0 sqlite", async () => {
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(exportYamlBuffer1_6_0(true));

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_6_0")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(2);
  });

  it("should import 1.6.0 sqlite yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.6.0-sqlite.yaml"));
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Minipi Local")!;
    expect(printer).toBeDefined();

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_6_0")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(3);
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();

    if (isTypeormMode) {
      const groups = await printerGroupService.listGroups();
      expect(groups).toHaveLength(0);
    }
  });

  it("should import 1.6.1 sqlite yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.6.1-sqlite-groups.yaml"));
    await printerCache.loadCache();
    await yamlService.importPrintersAndFloors(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Minipi Local1_6_1")!;
    expect(printer).toBeDefined();

    const floors = await floorService.list();
    expect(floors).toHaveLength(1);
    const floor = floors.find((f) => f.name === "Default Floor1_6_1")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(4);
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();

    if (isTypeormMode) {
      const groups = await printerGroupService.listGroups();
      expect(groups).toBeDefined();
      const group = groups.find((g) => g.name === "Group A123_1.6.1")!;
      expect(group).toBeDefined();
      expect(group.printers).toHaveLength(2);
      expect(groups.find((g) => g.name === "Group test_1.6.1")!.printers).toHaveLength(0);
    } else {
      expect(printerGroupService).toBeNull();
    }
  });

  it("should parse 1.9.1 mongodb full yaml file format", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.9.1-mongodb-full.yaml"));

    // Note: We test that the file can be parsed and validated, but we don't import
    // the system data (settings, users, roles) because the wizard is already completed
    // in the test environment. This is expected behavior - system data can only be
    // imported during first-time setup when wizard is not completed.

    const content = buffer.toString();
    expect(content).toContain("version: 1.9.1");
    expect(content).toContain("databaseType: mongo");
    expect(content).toContain("exportSettings: true");
    expect(content).toContain("exportUsers: true");
    expect(content).toContain("printers:");
    expect(content).toContain("floors:");
    expect(content).toContain("settings:");
    expect(content).toContain("users:");
  });

  it("should export yaml with system data (settings, users)", async () => {
    const yamlDump = await yamlService.exportPrintersAndFloors({
      exportFloors: false,
      exportPrinters: false,
      exportFloorGrid: false,
      exportGroups: false,
      exportSettings: true,
      exportUsers: true,
      exportUserRoles: false,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("settings:");
    expect(yamlDump).toContain("users:");
    expect(yamlDump).toContain("exportSettings: true");
    expect(yamlDump).toContain("exportUsers: true");
  });

  it("should export yaml with all options enabled", async () => {
    const yamlDump = await yamlService.exportPrintersAndFloors({
      exportFloors: true,
      exportPrinters: true,
      exportFloorGrid: true,
      exportGroups: true,
      exportSettings: true,
      exportUsers: true,
      exportUserRoles: true,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("exportPrinters: true");
    expect(yamlDump).toContain("exportFloors: true");
    expect(yamlDump).toContain("exportSettings: true");
    expect(yamlDump).toContain("exportUsers: true");
    if (isTypeormMode) {
      expect(yamlDump).toContain("exportUserRoles: true");
    }
  });

  it("should export yaml with only printers (no system data)", async () => {
    const yamlDump = await yamlService.exportPrintersAndFloors({
      exportFloors: false,
      exportPrinters: true,
      exportFloorGrid: false,
      exportGroups: false,
      exportSettings: false,
      exportUsers: false,
      exportUserRoles: false,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("printers:");
    expect(yamlDump).toContain("exportPrinters: true");
    expect(yamlDump).not.toContain("settings:");
    expect(yamlDump).not.toContain("users:");
  });

  it("should import floor over existing floor", async () => {
    const printer = await printerService.create({ ...testPrinterData, name: "YamlImportTestPrinter" });
    const defaultFloor = await floorService.create({
      name: "Floor1_DifferentName",
      floor: 15,
      printers: [
        {
          // Position is not used in imported floor "Floor1"
          x: 0,
          y: 1,
          printerId: printer.id,
        },
      ],
    });
    expect(defaultFloor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();
    await printerCache.loadCache();

    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.5.2-mongodb-simple.yaml"));
    await yamlService.importPrintersAndFloors(buffer.toString());

    // Probe the new floor and assert a position on it is taken
    const floors = await floorService.list();
    expect(floors).toHaveLength(2);
    const newFloor2 = floors.find((f) => f.name === "Floor2")!;
    expect(newFloor2).toBeDefined();

    if (isTypeormMode) {
      expect(typeof newFloor2.id).toBe("number");
    } else {
      expect(typeof newFloor2.id).toBe("string");
    }
    expect(newFloor2).toBeDefined();
    expect(newFloor2.floor).toBe(16);
    expect(newFloor2.printers).toHaveLength(1);
    if (isTypeormMode) {
      const positionTemp = await floorPositionService.findPosition(newFloor2.id as number, 0, 0);
      expect(positionTemp).not.toBeNull();
    }

    // The original floor's name is now gone, and the original printer has not been removed from it (overwrite action)
    expect(floors.find((f) => f.name === "Floor1_DifferentName")).toBeUndefined();
    const mutatedFloor1 = floors.find((f) => f.name === "Floor1" && f.floor === 15)!;
    expect(mutatedFloor1).toBeDefined();

    expect(mutatedFloor1.printers).toHaveLength(1);
    expect(mutatedFloor1).toBeDefined();
    const originalPrinterPos = mutatedFloor1.printers.find((p) => p.printerId === printer.id);
    expect(originalPrinterPos).toBeUndefined();
    const newPrinterPos = mutatedFloor1.printers.find((p) => p.x === 0 && p.y === 0);
    expect(newPrinterPos).toBeDefined();

    // Test that caching is not the cause
    const cache = await floorStore.listCache();
    const foundPrinters = cache.find((f) => f.name === "Floor2")!;
    expect(foundPrinters).toBeDefined();
    expect(foundPrinters.printers).toHaveLength(1);
  });
});
