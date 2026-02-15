import { YamlService } from "@/services/core/yaml.service";
import { PrinterCache } from "@/state/printer.cache";
import { DITokens } from "@/container.tokens";
import { exportYamlBuffer1_3_1, exportYamlBuffer1_5_0, exportYamlBuffer1_6_0 } from "./test-data/yaml-import";
import { setupTestApp } from "../test-server";
import { join } from "path";
import { readFileSync } from "node:fs";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { PrinterTagService } from "@/services/orm/printer-tag.service";
import { testPrinterData } from "./test-data/printer.data";
import { FloorStore } from "@/state/floor.store";
import { FloorPositionService } from "@/services/orm/floor-position.service";
import { OctoprintType } from "@/services/printer-api.interface";

let yamlService: YamlService;
let printerCache: PrinterCache;
let printerService: IPrinterService;
let floorService: IFloorService;
let floorStore: FloorStore;
let printerTagService: PrinterTagService;
let floorPositionService: FloorPositionService;

beforeAll(async () => {
  const { container } = await setupTestApp(true);
  yamlService = container.resolve(DITokens.yamlService);
  printerCache = container.resolve(DITokens.printerCache);
  printerService = container.resolve(DITokens.printerService);
  floorService = container.resolve(DITokens.floorService);
  floorPositionService = container.resolve(DITokens.floorPositionService);
  floorStore = container.resolve(DITokens.floorStore);
  printerTagService = container.resolve(DITokens.printerTagService);
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
    await yamlService.importYaml(exportYamlBuffer1_3_1);

    const yamlDump = await yamlService.exportYaml({
      exportFloors: true,
      exportPrinters: true,
      exportFloorGrid: true,
      exportTags: true,
      exportSettings: true,
      exportUsers: true,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump.includes(`printerType: ${OctoprintType}`)).toBeTruthy();
  });

  it("should import yaml from version 1.3.1", async () => {
    await yamlService.importYaml(exportYamlBuffer1_3_1);

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_3_1");
    expect(floor).toBeDefined();
  });

  it("should import yaml from version 1.5.0", async () => {
    await yamlService.importYaml(exportYamlBuffer1_5_0);

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_5_0");
    expect(floor).toBeDefined();
  });

  it("should import 1.5.2 mongodb yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.5.2-mongodb.yaml"));
    await yamlService.importYaml(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Dragon Eggggg")!;
    expect(printer).toBeDefined();

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_5_2")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(2);
    expect(typeof printer.id).toBe("number");
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();
  });

  it("should import yaml from version 1.6.0 sqlite", async () => {
    await yamlService.importYaml(exportYamlBuffer1_6_0);

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_6_0")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(2);
  });

  it("should import 1.6.0 sqlite yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.6.0-sqlite.yaml"));
    await yamlService.importYaml(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Minipi Local")!;
    expect(printer).toBeDefined();

    const floors = await floorService.list();
    const floor = floors.find((f) => f.name === "Default Floor1_6_0")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(3);
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();

    const tags = await printerTagService.listTags();
    expect(tags).toHaveLength(0);
  });

  it("should import 1.6.1 sqlite yaml", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.6.1-sqlite-groups.yaml"));
    await yamlService.importYaml(buffer.toString());

    const printers = await printerService.list();
    const printer = printers.find((p) => p.name === "Minipi Local1_6_1")!;
    expect(printer).toBeDefined();

    const floors = await floorService.list();
    expect(floors).toHaveLength(1);
    const floor = floors.find((f) => f.name === "Default Floor1_6_1")!;
    expect(floor).toBeDefined();
    expect(floor.printers).toHaveLength(4);
    expect(floor.printers.find((p) => p.printerId.toString() === printer.id.toString())).toBeDefined();

    const tags = await printerTagService.listTags();
    expect(tags).toBeDefined();
    const tag = tags.find((g) => g.name === "Group A123_1.6.1")!;
    expect(tag).toBeDefined();
    expect(tag.printers).toHaveLength(2);
    expect(tags.find((g) => g.name === "Group test_1.6.1")!.printers).toHaveLength(0);
  });

  it("should parse 1.9.1 mongodb full yaml file format", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.9.1-mongodb-full.yaml"));

    await expect(yamlService.importYaml(buffer.toString())).rejects.toThrow("Settings table is not empty");
  });

  it("should parse 1.9.1 sqlite full yaml file format", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.9.1-sqlite-full.yaml"));

    await expect(yamlService.importYaml(buffer.toString())).rejects.toThrow("Settings table is not empty");
  });

  it("should export yaml with system data (settings, users)", async () => {
    const yamlDump = await yamlService.exportYaml({
      exportFloors: false,
      exportPrinters: false,
      exportFloorGrid: false,
      exportTags: false,
      exportSettings: true,
      exportUsers: true,
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
    const yamlDump = await yamlService.exportYaml({
      exportFloors: true,
      exportPrinters: true,
      exportFloorGrid: true,
      exportTags: true,
      exportSettings: true,
      exportUsers: true,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("exportPrinters: true");
    expect(yamlDump).toContain("exportFloors: true");
    expect(yamlDump).toContain("exportTags: true");
    expect(yamlDump).toContain("exportSettings: true");
    expect(yamlDump).toContain("exportUsers: true");
  });

  it("should export yaml with only printers (no system data)", async () => {
    const yamlDump = await yamlService.exportYaml({
      exportFloors: false,
      exportPrinters: true,
      exportFloorGrid: false,
      exportTags: false,
      exportSettings: false,
      exportUsers: false,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("printers:");
    expect(yamlDump).toContain("exportPrinters: true");
    expect(yamlDump).not.toContain("settings:");
    expect(yamlDump).not.toContain("users:");
  });

  it("should export yaml with floors and printer floor positions", async () => {
    const printer = await printerService.create({ ...testPrinterData, name: "ExportTestPrinter" });
    await floorService.create({
      name: "ExportTestFloor",
      order: 99,
      printers: [
        {
          x: 1,
          y: 2,
          printerId: printer.id,
        },
      ],
    });

    const yamlDump = await yamlService.exportYaml({
      exportFloors: true,
      exportPrinters: true,
      exportFloorGrid: true,
      exportTags: false,
      exportSettings: false,
      exportUsers: false,
      printerComparisonStrategiesByPriority: ["name"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("floors:");
    expect(yamlDump).toContain("printers:");
    expect(yamlDump).toContain("ExportTestPrinter");

    // Verify printerId is properly serialized and not empty object
    expect(yamlDump).toContain("printerId:");
    expect(yamlDump).not.toContain("printerId: {}");
    expect(yamlDump).not.toContain("printerId: null");

    // Parse YAML to verify structure - check that at least one printerId line is valid
    const yamlLines = yamlDump.split("\n");
    const printerIdLines = yamlLines.filter((line) => line.includes("printerId:"));
    expect(printerIdLines.length).toBeGreaterThan(0);

    // Verify that none of the printerId lines are empty objects
    for (const line of printerIdLines) {
      expect(line.trim()).not.toBe("printerId: {}");
    }
  });

  it("should import floor over existing floor", async () => {
    const printer = await printerService.create({ ...testPrinterData, name: "YamlImportTestPrinter" });
    const defaultFloor = await floorService.create({
      name: "Floor1_DifferentName",
      order: 15,
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

    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-1.5.2-mongodb-simple.yaml"));
    await yamlService.importYaml(buffer.toString());

    // Probe the new floor and assert a position on it is taken
    const floors = await floorService.list();
    expect(floors).toHaveLength(2);
    const newFloor2 = floors.find((f) => f.name === "Floor2")!;
    expect(newFloor2).toBeDefined();

    expect(typeof newFloor2.id).toBe("number");

    expect(newFloor2).toBeDefined();
    expect(newFloor2.order).toBe(16);
    expect(newFloor2.printers).toHaveLength(1);

    const positionTemp = await floorPositionService.findPosition(newFloor2.id as number, 0, 0);
    expect(positionTemp).not.toBeNull();

    // The original floor's name is now gone, and the original printer has not been removed from it (overwrite action)
    expect(floors.find((f) => f.name === "Floor1_DifferentName")).toBeUndefined();
    const mutatedFloor1 = floors.find((f) => f.name === "Floor1" && f.order === 15)!;
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

  it("should parse 2.0.1 sqlite full yaml file format with credential settings", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-2.0.1-sqlite-full.yaml"));

    // Should reject import because settings table is not empty in test environment
    await expect(yamlService.importYaml(buffer.toString())).rejects.toThrow("Settings table is not empty");
  });

  it("should export yaml with credential settings in proper nested structure", async () => {
    const yamlDump = await yamlService.exportYaml({
      exportFloors: false,
      exportPrinters: false,
      exportFloorGrid: false,
      exportTags: false,
      exportSettings: true,
      exportUsers: false,
      printerComparisonStrategiesByPriority: ["name", "id"],
      floorComparisonStrategiesByPriority: "floor",
    });

    expect(yamlDump).toBeDefined();
    expect(yamlDump).toContain("settings:");
    expect(yamlDump).toContain("credential");

    // Verify credential settings are nested under 'credential' key
    expect(yamlDump).toContain("jwtExpiresIn:");
    expect(yamlDump).toContain("refreshTokenAttempts:");
    expect(yamlDump).toContain("refreshTokenExpiry:");

    // Verify slicerApiKey is in the exported YAML (if one exists)
    // Note: slicerApiKey should be nested under credentials, not at top level
    const hasSlicerKey = yamlDump.includes("slicerApiKey:");
    if (hasSlicerKey) {
      // Ensure it's in the credential section, not at top level
      const lines = yamlDump.split("\n");
      const credentialLine = lines.findIndex((l) => l.trim().startsWith("credential"));
      const slicerKeyLine = lines.findIndex((l) => l.includes("slicerApiKey:"));

      // slicerApiKey should appear after credential section starts
      expect(slicerKeyLine).toBeGreaterThan(credentialLine);
    }
  });

  it("should validate 2.0.1 yaml structure has credentials nested correctly", async () => {
    const buffer = readFileSync(join(__dirname, "./test-data/export-fdm-monster-2.0.1-sqlite-full.yaml"));
    const yamlContent = buffer.toString();

    // Verify the YAML structure has credentials properly nested
    expect(yamlContent).toContain("settings:");
    expect(yamlContent).toContain("credentials:");
    expect(yamlContent).toContain("jwtExpiresIn: 3600");
    expect(yamlContent).toContain("refreshTokenAttempts: -1");
    expect(yamlContent).toContain("refreshTokenExpiry: 1209600");
    expect(yamlContent).toContain("slicerApiKey: ec7cdc28-c649-4cd3-8ec4-dcfa34a03d1b");

    // Verify slicerApiKey is nested under credentials, not at top level of settings
    const lines = yamlContent.split("\n");
    const settingsLine = lines.findIndex((l) => l.trim() === "settings:");
    const credentialsLine = lines.findIndex((l) => l.trim() === "credentials:");
    const slicerKeyLine = lines.findIndex((l) => l.trim().startsWith("slicerApiKey:"));

    // Credentials should be after settings
    expect(credentialsLine).toBeGreaterThan(settingsLine);
    // slicerApiKey should be after credentials
    expect(slicerKeyLine).toBeGreaterThan(credentialsLine);

    // Verify indentation - slicerApiKey should be indented more than credentials
    const credentialsIndent = lines[credentialsLine].search(/\S/);
    const slicerKeyIndent = lines[slicerKeyLine].search(/\S/);
    expect(slicerKeyIndent).toBeGreaterThan(credentialsIndent);
  });
});
