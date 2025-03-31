import { validateInput } from "@/handlers/validators";
import {
  exportPrintersFloorsYamlSchema,
  importPrinterPositionsSchema,
  importPrintersFloorsYamlSchema,
  YamlExportSchema,
} from "../validators/yaml-service.validation";
import { dump, load } from "js-yaml";
import { LoggerService } from "@/handlers/logger";
import { PrinterCache } from "@/state/printer.cache";
import { FloorStore } from "@/state/floor.store";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { IFloorService } from "@/services/interfaces/floor.service.interface";
import { SqliteIdType } from "@/shared.constants";
import { IPrinterGroupService } from "@/services/interfaces/printer-group.service.interface";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";
import { z } from "zod";

export class YamlService {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerGroupService: IPrinterGroupService<SqliteIdType>,
    private readonly printerService: IPrinterService,
    private readonly printerCache: PrinterCache,
    private readonly floorStore: FloorStore,
    private readonly floorService: IFloorService,
    private readonly isTypeormMode: boolean
  ) {
    this.logger = loggerFactory(YamlService.name);
  }

  async importPrintersAndFloors(yamlBuffer: string) {
    const importSpec = (await load(yamlBuffer)) as YamlExportSchema;
    const databaseTypeSqlite = importSpec.databaseType === "sqlite";
    const { exportPrinters, exportFloorGrid } = importSpec.config;

    for (const printer of importSpec.printers) {
      // old export bug
      if (!printer.name && printer.printerName) {
        printer.name = printer.printerName;
        delete printer.printerName;
      }
      // 1.5.2 schema
      if (printer.settingsAppearance?.name) {
        printer.name = printer.settingsAppearance?.name;
        delete printer.settingsAppearance?.name;
      }
      // Ensure the type matches the database it came from (1.6.0+)
      if (databaseTypeSqlite && typeof printer.id === "string") {
        printer.id = parseInt(printer.id);
      }

      // 1.7 backwards compatibility
      // if (![OctoprintType, MoonrakerType].includes[printer.printerType]) {
      if (![OctoprintType, MoonrakerType].includes(printer.printerType)) {
        printer.printerType = OctoprintType;
      }
    }

    if (databaseTypeSqlite) {
      // Ensure the type matches the database it came from (1.6.0+)
      for (const floor of importSpec.floors) {
        if (typeof floor.id === "string") {
          floor.id = parseInt(floor.id);
        }
        // Ensure the type matches the database it came from (1.6.0+)
        for (const printer of floor.printers) {
          if (typeof printer.printerId === "string") {
            printer.printerId = parseInt(printer.printerId);
          }
        }
      }
    }

    const importData = await validateInput(importSpec, importPrintersFloorsYamlSchema);

    // Nested validation is manual (for now)
    if (!!exportFloorGrid) {
      for (const floor of importData.floors) {
        await validateInput(floor, importPrinterPositionsSchema);
      }
    }

    this.logger.log("Analysing printers for import");
    const { updateByPropertyPrinters, insertPrinters } = await this.analysePrintersUpsert(
      importData.printers,
      importData.config.printerComparisonStrategiesByPriority
    );

    this.logger.log("Analysing floors for import");
    const { updateByPropertyFloors, insertFloors } = await this.analyseFloorsUpsert(
      importData.floors,
      importData.config.floorComparisonStrategiesByPriority
    );

    this.logger.log("Analysing groups for import");
    const { updateByNameGroups, insertGroups } = await this.analyseUpsertGroups(importData.groups);

    this.logger.log(`Performing pure insert printers (${insertPrinters.length} printers)`);
    const printerIdMap = {};
    for (const newPrinter of insertPrinters) {
      const state = await this.printerService.create({ ...newPrinter });
      if (!newPrinter.id) {
        throw new Error(`Saved ID was empty ${JSON.stringify(newPrinter)}`);
      }
      printerIdMap[newPrinter.id] = state.id;
    }

    this.logger.log(`Performing update import printers (${updateByPropertyPrinters.length} printers)`);
    for (const updatePrinterSpec of updateByPropertyPrinters) {
      const updateId = updatePrinterSpec.printerId;
      const updatedPrinter = updatePrinterSpec.value;
      if (typeof updateId === "string" && this.isTypeormMode) {
        throw new Error("Cannot update a printer by string id in SQLite mode");
      } else if (typeof updateId === "number" && !this.isTypeormMode) {
        throw new Error("Cannot update a printer by number id in MongoDB mode");
      }

      const originalPrinterId = updatedPrinter.id;
      delete updatePrinterSpec.value.id;

      updatedPrinter.id = updateId;
      const state = await this.printerService.update(updateId, updatedPrinter);
      if (!updatePrinterSpec.printerId) {
        throw new Error("Saved ID was empty");
      }

      printerIdMap[originalPrinterId] = state.id;
    }

    this.logger.log(`Performing pure create floors (${insertFloors.length} floors)`);
    const floorIdMap = {};
    for (const newFloor of insertFloors) {
      const originalFloorId = newFloor.id;
      delete newFloor.id;

      // Replace printerIds with newly mapped IDs
      const knownPrinterPositions = [];

      if (exportFloorGrid && exportPrinters) {
        for (const floorPosition of newFloor.printers) {
          const knownPrinterId = printerIdMap[floorPosition.printerId];
          // If the ID was not mapped, this position is considered discarded
          if (!knownPrinterId) {
            continue;
          }

          delete floorPosition.id;
          delete floorPosition.floorId;
          floorPosition.printerId = knownPrinterId;
          knownPrinterPositions.push(floorPosition);
        }
        newFloor.printers = knownPrinterPositions;
      }

      const createdFloor = await this.floorStore.create({ ...newFloor });
      floorIdMap[originalFloorId] = createdFloor.id;
    }

    this.logger.log(`Performing update of floors (${updateByPropertyFloors.length} floors)`);
    for (const updateFloorSpec of updateByPropertyFloors) {
      const updateId = updateFloorSpec.floorId;

      if (typeof updateId === "string" && this.isTypeormMode) {
        throw new Error("Cannot update a floor by string id in SQLite mode");
      } else if (typeof updateId === "number" && !this.isTypeormMode) {
        throw new Error("Cannot update a floor by number id in MongoDB mode");
      }

      const updatedFloor = updateFloorSpec.value;
      const originalFloorId = updatedFloor.id;
      delete updatedFloor.id;

      const knownPrinters = [];
      if (exportFloorGrid && exportPrinters) {
        for (const floorPosition of updatedFloor?.printers) {
          const knownPrinterId = printerIdMap[floorPosition.printerId];
          // If the ID was not mapped, this position is considered discarded
          if (!knownPrinterId) {
            continue;
          }

          // Purge ids that might be of wrong type or format
          delete floorPosition.id;
          delete floorPosition.floorId;
          floorPosition.printerId = knownPrinterId;
          floorPosition.floorId = updateId;
          knownPrinters.push(floorPosition);
        }
        updatedFloor.id = updateId;
        updatedFloor.printers = knownPrinters;
      }
      const newFloor = await this.floorStore.update(updateId, updatedFloor);
      floorIdMap[originalFloorId] = newFloor.id;
    }

    await this.floorStore.loadStore();

    this.logger.log(`Performing pure create groups (${insertGroups.length} groups)`);
    for (const group of insertGroups) {
      const createdGroup = await this.printerGroupService.createGroup({
        name: group.name,
      });
      for (const printer of group.printers) {
        const knownPrinterId = printerIdMap[printer.printerId];
        // If the ID was not mapped, this position is considered discarded
        if (!knownPrinterId) continue;
        await this.printerGroupService.addPrinterToGroup(createdGroup.id, knownPrinterId);
      }
    }

    this.logger.log(`Performing update of grouped printer links (${updateByNameGroups.length} groups)`);
    for (const updateGroupSpec of updateByNameGroups) {
      const existingGroup = await this.printerGroupService.getGroupWithPrinters(updateGroupSpec.groupId);
      const existingPrinterIds = existingGroup.printers.map((p) => p.printerId);
      const wantedTargetPrinterIds = (updateGroupSpec.value.printers as { printerId: number }[])
        .filter((p) => !!printerIdMap[p.printerId])
        .map((p) => printerIdMap[p.printerId]);

      for (const unwantedId of existingPrinterIds.filter((eid) => !wantedTargetPrinterIds.includes(eid))) {
        await this.printerGroupService.removePrinterFromGroup(existingGroup.id, unwantedId);
      }
      for (const nonExistingNewId of wantedTargetPrinterIds.filter((eid) => !existingPrinterIds.includes(eid))) {
        await this.printerGroupService.addPrinterToGroup(existingGroup.id, nonExistingNewId);
      }
    }

    return {
      updateByPropertyPrinters,
      updateByPropertyFloors,
      insertPrinters,
      insertFloors,
      printerIdMap,
      floorIdMap,
    };
  }

  async analysePrintersUpsert(upsertPrinters, comparisonStrategies: string[]) {
    const existingPrinters = await this.printerService.list();

    const names = existingPrinters.map((p) => p.name.toLowerCase());
    const urls = existingPrinters.map((p) => p.printerURL);
    const ids = existingPrinters.map((p) => p.id.toString());

    const insertPrinters = [];
    const updateByPropertyPrinters = [];
    for (const printer of upsertPrinters) {
      for (const strategy of [...comparisonStrategies, "new"]) {
        if (strategy === "name") {
          const comparedName = printer.name.toLowerCase();
          const foundIndex = names.findIndex((n) => n === comparedName);
          if (foundIndex !== -1) {
            if (!ids[foundIndex]) {
              throw new Error("Update ID is undefined");
            }
            updateByPropertyPrinters.push({
              strategy: "name",
              printerId: this.isTypeormMode ? parseInt(ids[foundIndex]) : ids[foundIndex],
              value: printer,
            });
            break;
          }
        } else if (strategy === "url") {
          const comparedName = printer.printerURL.toLowerCase();
          const foundIndex = urls.findIndex((n) => n === comparedName);
          if (foundIndex !== -1) {
            if (!ids[foundIndex]) {
              throw new Error("Update ID is undefined");
            }
            updateByPropertyPrinters.push({
              strategy: "url",
              printerId: this.isTypeormMode ? parseInt(ids[foundIndex]) : ids[foundIndex],
              value: printer,
            });
            break;
          }
        } else if (strategy === "id") {
          const comparedName = printer.id.toLowerCase();
          const foundIndex = ids.findIndex((n) => n === comparedName);
          if (foundIndex !== -1) {
            if (!ids[foundIndex]) {
              throw new Error("Update ID is undefined");
            }
            updateByPropertyPrinters.push({
              strategy: "id",
              printerId: this.isTypeormMode ? parseInt(ids[foundIndex]) : ids[foundIndex],
              value: printer,
            });
            break;
          }
        } else if (strategy === "new") {
          if (!printer.id) {
            throw new Error(JSON.stringify(printer));
          }
          insertPrinters.push(printer);
          break;
        }
      }
    }

    return {
      updateByPropertyPrinters,
      insertPrinters,
    };
  }

  async analyseFloorsUpsert(upsertFloors, comparisonStrategy: string) {
    const existingFloors = await this.floorService.list();
    const names = existingFloors.map((p) => p.name.toLowerCase());
    const floorLevels = existingFloors.map((p) => p.floor);
    const ids = existingFloors.map((p) => p.id.toString());

    const insertFloors = [];
    const updateByPropertyFloors = [];
    for (const floor of upsertFloors) {
      for (const strategy of [comparisonStrategy, "new"]) {
        if (strategy === "name") {
          const comparedProperty = floor.name.toLowerCase();
          const foundIndex = names.findIndex((n) => n === comparedProperty);
          if (foundIndex !== -1) {
            if (!ids[foundIndex]) {
              throw new Error("IDS not found, floor name");
            }
            updateByPropertyFloors.push({
              strategy: "name",
              floorId: this.isTypeormMode ? parseInt(ids[foundIndex]) : ids[foundIndex],
              value: floor,
            });
            break;
          }
        } else if (strategy === "floor") {
          const comparedProperty = floor.floor;
          const foundIndex = floorLevels.findIndex((n) => n === comparedProperty);
          if (foundIndex !== -1) {
            if (!ids[foundIndex]) {
              throw new Error("IDS not found, floor level");
            }
            updateByPropertyFloors.push({
              strategy: "floor",
              floorId: this.isTypeormMode ? parseInt(ids[foundIndex]) : ids[foundIndex],
              value: floor,
            });
            break;
          }
        } else if (strategy === "id") {
          const comparedProperty = floor.id.toLowerCase();
          const foundIndex = ids.findIndex((n) => n === comparedProperty);
          if (foundIndex !== -1) {
            if (!ids[foundIndex]) {
              throw new Error("IDS not found, floor id");
            }
            updateByPropertyFloors.push({
              strategy: "id",
              floorId: this.isTypeormMode ? parseInt(ids[foundIndex]) : ids[foundIndex],
              value: floor,
            });
            break;
          }
        } else if (strategy === "new") {
          insertFloors.push(floor);
          break;
        }
      }
    }

    return {
      updateByPropertyFloors,
      insertFloors,
    };
  }

  async analyseUpsertGroups(upsertGroups: any[]) {
    if (!this.isTypeormMode || !upsertGroups?.length) {
      return {
        updateByNameGroups: [],
        insertGroups: [],
      };
    }

    const existingGroups = await this.printerGroupService.listGroups();
    const names = existingGroups.map((p) => p.name.toLowerCase());
    const ids = existingGroups.map((p) => p.id.toString());

    const insertGroups = [];
    const updateByNameGroups = [];
    for (const group of upsertGroups) {
      const comparedProperty = group.name.toLowerCase();
      const foundIndex = names.findIndex((n) => n === comparedProperty);
      if (foundIndex !== -1) {
        if (!ids[foundIndex]) {
          throw new Error("IDS not found, group name");
        }
        updateByNameGroups.push({
          strategy: "name",
          groupId: parseInt(ids[foundIndex]),
          value: group,
        });
        break;
      } else {
        insertGroups.push(group);
      }
    }

    return {
      insertGroups,
      updateByNameGroups,
    };
  }

  async exportPrintersAndFloors(options: z.infer<typeof exportPrintersFloorsYamlSchema>) {
    const input = await validateInput(options, exportPrintersFloorsYamlSchema);

    if (!this.isTypeormMode) {
      input.exportGroups = false;
    }
    const { exportFloors, exportPrinters, exportFloorGrid, exportGroups } = input;

    const dumpedObject = {
      version: process.env.npm_package_version,
      exportedAt: new Date(),
      databaseType: this.isTypeormMode ? "sqlite" : "mongo",
      config: input,
      printers: undefined as any,
      floors: undefined as any,
      groups: undefined as any,
    };

    if (exportPrinters) {
      const printers = await this.printerService.list();
      dumpedObject.printers = printers.map((p) => {
        const printerId = p.id;
        const { apiKey } = this.printerCache.getLoginDto(printerId);
        return {
          id: printerId,
          disabledReason: p.disabledReason,
          enabled: p.enabled,
          printerType: p.printerType,
          dateAdded: p.dateAdded,
          name: p.name,
          printerURL: p.printerURL,
          apiKey,
        };
      });
    }

    if (exportFloors) {
      const floors = await this.floorStore.listCache();
      dumpedObject.floors = floors.map((f) => {
        const dumpedFloor = {
          id: f.id,
          floor: f.floor,
          name: f.name,
          printers: undefined as any,
        };

        if (exportFloorGrid) {
          dumpedFloor.printers = f.printers.map((p) => {
            const fPrinterId = p.printerId;
            return {
              printerId: fPrinterId,
              x: p.x,
              y: p.y,
            };
          });
        }

        return dumpedFloor;
      });
    }

    if (exportGroups && this.isTypeormMode) {
      const groups = await this.printerGroupService.listGroups();
      dumpedObject.groups = groups.map((g) => {
        return {
          name: g.name,
          id: g.id,
          printers: g.printers.map((p) => {
            return {
              printerId: p.printerId,
            };
          }),
        };
      });
    }

    return dump(dumpedObject, {});
  }
}
