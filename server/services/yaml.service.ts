const { validateInput } = require("../handlers/validators");
const {
  exportPrintersFloorsYamlRules,
  importPrintersFloorsYamlRules,
  importPrinterPositionsRules,
} = require("./validators/yaml-service.validation");
const { dump, load } = require("js-yaml");

export class YamlService {
  floorStore;
  /**
   * @type {PrinterService}
   */
  printerService;
  /**
   * @type {PrinterCache}
   */
  printerCache;
  /**
   * @type {FloorService}
   */
  floorService;
  /**
   * @type {LoggerService}
   */
  #logger;
  /**
   * @type {string}
   */
  serverVersion;

  constructor({ printerService, printerCache, floorStore, floorService, loggerFactory, serverVersion }) {
    this.floorStore = floorStore;
    this.printerService = printerService;
    this.printerCache = printerCache;
    this.floorService = floorService;
    this.serverVersion = serverVersion;
    this.#logger = loggerFactory("YamlService");
  }

  async importPrintersAndFloors(yamlBuffer) {
    const importSpec = await load(yamlBuffer);
    const { exportPrinters, exportFloorGrid, exportFloors } = importSpec?.config;

    for (const printer of importSpec.printers) {
      if (!printer.settingsAppearance?.name && printer.printerName) {
        printer.settingsAppearance = {
          name: printer.printerName,
        };
        delete printer.printerName;
      }
    }

    const importData = await validateInput(
      importSpec,
      importPrintersFloorsYamlRules(exportPrinters, exportFloorGrid, exportFloors)
    );

    // Nested validation is manual (for now)
    if (!!exportFloorGrid) {
      for (let floor of importData.floors) {
        await validateInput(floor, importPrinterPositionsRules);
      }
    }

    this.#logger.log("Analysing printers for import");
    const { updateByPropertyPrinters, insertPrinters } = await this.analysePrintersUpsert(
      importData.printers,
      importData.config.printerComparisonStrategiesByPriority
    );

    this.#logger.log("Analysing floors for import");
    const { updateByPropertyFloors, insertFloors } = await this.analyseFloorsUpsert(
      importData.floors,
      importData.config.floorComparisonStrategiesByPriority
    );

    this.#logger.log(`Performing pure insert printers (${insertPrinters.length} printers)`);
    const printerIdMap = {};
    for (const newPrinter of insertPrinters) {
      const state = await this.printerService.create(newPrinter);
      printerIdMap[newPrinter.id] = state.id;
    }
    this.#logger.log(`Performing update import printers (${updateByPropertyPrinters.length} printers)`);
    for (const updatePrinterSpec of updateByPropertyPrinters) {
      const updateId = updatePrinterSpec.printerId;
      const state = await this.printerService.update(updateId, updatePrinterSpec.value);
      printerIdMap[updatePrinterSpec.printerId] = state.id;
    }

    this.#logger.log(`Performing pure create floors (${insertFloors.length} floors)`);
    const floorIdMap = {};
    for (const newFloor of insertFloors) {
      // Replace printerIds with newly mapped IDs
      const knownPrinters = [];
      if (exportFloorGrid && exportPrinters) {
        for (const floorPosition of newFloor.printers) {
          const knownPrinterId = printerIdMap[floorPosition.printerId];
          // If the ID was not mapped, this position is considered discarded
          if (!knownPrinterId) continue;

          floorPosition.printerId = knownPrinterId;
          knownPrinters.push(floorPosition);
        }
        newFloor.printers = knownPrinters;
      }

      const state = await this.floorStore.create(newFloor, false);
      floorIdMap[newFloor.id] = state.id;
    }

    this.#logger.log(`Performing update of floors (${updateByPropertyFloors.length} floors)`);
    for (const updateFloorSpec of updateByPropertyFloors) {
      const updateId = updateFloorSpec.floorId;
      const updatedFloor = updateFloorSpec.value;

      const knownPrinters = [];
      if (exportFloorGrid && exportPrinters) {
        for (const floorPosition of updatedFloor?.printers) {
          const knownPrinterId = printerIdMap[floorPosition.printerId];
          // If the ID was not mapped, this position is considered discarded
          if (!knownPrinterId) continue;

          floorPosition.printerId = knownPrinterId;
          knownPrinters.push(floorPosition);
        }
        updatedFloor.printers = knownPrinters;
      }

      const state = await this.floorStore.update(updateId, updatedFloor);
      floorIdMap[updateId] = state.id;
    }

    await this.floorStore.loadStore();

    return {
      updateByPropertyPrinters,
      updateByPropertyFloors,
      insertPrinters,
      insertFloors,
      printerIdMap,
      floorIdMap,
    };
  }

  /**
   *
   * @param upsertPrinters
   * @param comparisonStrategies array of string types
   * @returns {Promise<object>}
   */
  async analysePrintersUpsert(upsertPrinters, comparisonStrategies) {
    const existingPrinters = await this.printerService.list();

    const names = existingPrinters.map((p) => p.settingsAppearance.name.toLowerCase());
    const urls = existingPrinters.map((p) => p.printerURL);
    const ids = existingPrinters.map((p) => p.id.toString());

    const insertPrinters = [];
    const updateByPropertyPrinters = [];
    for (const printer of upsertPrinters) {
      for (const strategy of [...comparisonStrategies, "new"]) {
        if (strategy === "name") {
          const comparedName = printer.settingsAppearance.name.toLowerCase();
          const foundIndex = names.findIndex((n) => n === comparedName);
          if (foundIndex !== -1) {
            updateByPropertyPrinters.push({
              strategy: "name",
              printerId: ids[foundIndex],
              value: printer,
            });
            break;
          }
        } else if (strategy === "url") {
          const comparedName = printer.printerURL.toLowerCase();
          const foundIndex = urls.findIndex((n) => n === comparedName);
          if (foundIndex !== -1) {
            updateByPropertyPrinters.push({
              strategy: "url",
              printerId: ids[foundIndex],
              value: printer,
            });
            break;
          }
        } else if (strategy === "id") {
          const comparedName = printer.id.toLowerCase();
          const foundIndex = ids.findIndex((n) => n === comparedName);
          if (foundIndex !== -1) {
            updateByPropertyPrinters.push({
              strategy: "id",
              printerId: ids[foundIndex],
              value: printer,
            });
            break;
          }
        } else if (strategy === "new") {
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

  async analyseFloorsUpsert(upsertFloors, comparisonStrategy) {
    const existingFloors = await this.floorService.list(false);
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
            updateByPropertyFloors.push({
              strategy: "name",
              floorId: ids[foundIndex],
              value: floor,
            });
            break;
          }
        } else if (strategy === "floor") {
          const comparedProperty = floor.floor;
          const foundIndex = floorLevels.findIndex((n) => n === comparedProperty);
          if (foundIndex !== -1) {
            updateByPropertyFloors.push({
              strategy: "floor",
              floorId: ids[foundIndex],
              value: floor,
            });
            break;
          }
        } else if (strategy === "id") {
          const comparedProperty = floor.id.toLowerCase();
          const foundIndex = ids.findIndex((n) => n === comparedProperty);
          if (foundIndex !== -1) {
            updateByPropertyFloors.push({
              strategy: "id",
              floorId: ids[foundIndex],
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

  async exportPrintersAndFloors(options) {
    const input = await validateInput(options, exportPrintersFloorsYamlRules);
    const {
      exportFloors,
      exportPrinters,
      exportFloorGrid,
      // dropPrinterIds, // optional idea for future
      // dropFloorIds, // optional idea for future
      // printerComparisonStrategiesByPriority, // not used for export
      // floorComparisonStrategiesByPriority, // not used for export
      // notes, // passed on to config immediately
    } = input;

    const dumpedObject = {
      version: process.env.npm_package_version,
      exportedAt: new Date(),
      config: input,
    };

    if (exportPrinters) {
      const printers = await this.printerService.list();
      dumpedObject.printers = printers.map((p) => {
        const printerId = p.id;
        const { apiKey } = this.printerCache.getLoginDto(printerId);
        return {
          id: printerId,
          stepSize: p.stepSize,
          disabledReason: p.disabledReason,
          enabled: p.enabled,
          dateAdded: p.dateAdded,
          settingsAppearance: {
            name: p.settingsAppearance.name,
          },
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
        };

        if (exportFloorGrid) {
          dumpedFloor.printers = f.printers.map((p) => {
            const fPrinterId = p.printerId.toString();
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

    return dump(dumpedObject, {});
  }
}

module.exports = {
  YamlService,
};
