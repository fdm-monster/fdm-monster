const { validateInput } = require("../handlers/validators");
const {
  exportPrintersFloorsYamlRules,
  importPrintersFloorsYamlRules,
  importPrinterPositionsRules,
} = require("./validators/yaml-service.validation");
const { dump, load } = require("js-yaml");

class YamlService {
  printerStore;
  floorStore;
  printerService;
  floorService;

  #logger;

  constructor({ printerStore, printerService, floorStore, floorService, loggerFactory }) {
    this.printerStore = printerStore;
    this.floorStore = floorStore;
    this.printerService = printerService;
    this.floorService = floorService;
    this.#logger = loggerFactory("YamlService");
  }

  async importPrintersAndFloors(yamlBuffer) {
    const importSpec = await load(yamlBuffer);
    const { exportPrinters, exportFloorGrid, exportFloors } = importSpec?.config;

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

    this.#logger.info("Analysing printers for import");
    const { updateByPropertyPrinters, insertPrinters } = await this.analysePrintersUpsert(
      importData.printers,
      importData.config.printerComparisonStrategiesByPriority
    );

    this.#logger.info("Analysing floors for import");
    const { updateByPropertyFloors, insertFloors } = await this.analyseFloorsUpsert(
      importData.floors,
      importData.config.floorComparisonStrategiesByPriority
    );

    this.#logger.info(`Performing pure insert import printers (${insertPrinters.length} printers)`);

    // TODO this dereferences the printer by associating it to a new MongoDB
    // await this.printerStore.batchImport(insertPrinters);

    // for (const printer of insertPrinters) {
    //
    // }

    return {
      updateByPropertyPrinters,
      updateByPropertyFloors,
      insertPrinters,
      insertFloors,
    };
  }

  /**
   *
   * @param printers
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
      const printers = await this.printerStore.listPrintersFlat(true);
      dumpedObject.printers = printers.map((p) => {
        const printerId = p.id;
        const { apiKey } = this.printerStore.getPrinterLogin(printerId);
        return {
          id: printerId,
          stepSize: p.stepSize,
          disabledReason: p.disabledReason,
          enabled: p.enabled,
          dateAdded: p.dateAdded,
          settingsAppearance: {
            name: p.printerName,
          },
          webSocketURL: p.webSocketURL,
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
          const printers = f.printers.map((p) => {
            const fPrinterId = p.printerId.toString();
            return {
              printerId: fPrinterId,
              x: p.x,
              y: p.y,
            };
          });
          dumpedFloor.printers = printers;
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
