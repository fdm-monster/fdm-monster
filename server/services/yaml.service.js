const { validateInput } = require("../handlers/validators");
const { exportPrintersYamlRules } = require("./validators/yaml-export.validation");
const { dump } = require("js-yaml");

class YamlService {
  printerStore;
  floorStore;

  constructor({ printerStore, floorStore }) {
    this.printerStore = printerStore;
    this.floorStore = floorStore;
  }

  async exportPrinterFloors(options) {
    const input = await validateInput(options, exportPrintersYamlRules);
    const {
      exportFloors,
      exportPrinters,
      // dropPrinterIds, // optional idea for future
      exportFloorGrid,
      // dropFloorIds, // optional idea for future
      // These could also be import strategies
      // printerComparisonStrategiesByPriority,
      // floorComparisonStrategiesByPriority,
      notes,
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
          printerName: p.printerName,
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
          name: f.floor,
        };

        if (exportFloorGrid) {
          const printers = f.printers.map((p) => {
            const fPrinterId = p.printerId.toString();
            const printer = this.printerStore.getPrinterFlat(fPrinterId);
            return {
              printerId: fPrinterId,
              printerName: printer.printerName,
              printerURL: printer.printerURL,
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
