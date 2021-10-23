const _ = require("lodash");
const Spools = require("../../models/Spool.js");
const { noSpoolOptionTemplate } = require("../../constants/template.constants");

class FilamentCache {
  #filamentSpools = [];
  #statistics = [];
  #selectedFilamentList = [];

  #logger;

  #settingsStore;
  #printersStore;
  #printerProfilesCache;

  constructor({ settingsStore, printersStore, printerProfilesCache, loggerFactory }) {
    this.#settingsStore = settingsStore;
    this.#printersStore = printersStore;
    this.#printerProfilesCache = printerProfilesCache;

    this.#logger = loggerFactory("Server-Filament");
  }

  getFilamentSpools() {
    return this.#filamentSpools;
  }

  getStatistics() {
    return this.#statistics;
  }

  getSelected() {
    return this.#selectedFilamentList;
  }

  async initCache() {
    const printers = this.#printersStore.listPrinterStates();

    const spools = await Spools.find({});
    const spoolsArray = [];
    const profilesArray = [];

    for (let sp = 0; sp < spools.length; sp++) {
      const spool = {
        _id: spools[sp]._id,
        name: spools[sp].spools.name,
        profile: spools[sp].spools.profile,
        price: spools[sp].spools.price,
        weight: spools[sp].spools.weight,
        used: spools[sp].spools.used,
        remaining: spools[sp].spools.weight - spools[sp].spools.used,
        percent: 100 - (spools[sp].spools.used / spools[sp].spools.weight) * 100,
        tempOffset: spools[sp].spools.tempOffset,
        printerAssignment: this.getPrinterAssignment(spools[sp]._id, printers),
        fmID: spools[sp].spools.fmID
      };
      spoolsArray.push(spool);
    }

    this.#filamentSpools = spoolsArray;

    this.#selectedFilamentList = await this.selectedFilament(printers);
    this.#statistics = this.createStatistics(spoolsArray, profilesArray);
    this.#logger.info("Filament information cleaned and ready for consumption...");
  }

  async selectedFilament(printers) {
    const selectedArray = [];
    for (let s = 0; s < printers.length; s++) {
      if (typeof printers[s] !== "undefined" && Array.isArray(printers[s].selectedFilament)) {
        for (let f = 0; f < printers[s].selectedFilament.length; f++) {
          if (printers[s].selectedFilament[f] !== null) {
            selectedArray.push(printers[s].selectedFilament[f]._id);
          }
        }
      }
    }
    return selectedArray;
  }

  createStatistics(spools, profiles) {
    const materials = [];
    let materialBreak = [];
    for (let p = 0; p < profiles.length; p++) {
      materials.push(profiles[p].material.replace(/ /g, "_"));
      const material = {
        name: profiles[p].material.replace(/ /g, "_"),
        weight: [],
        used: [],
        price: []
      };
      materialBreak.push(material);
    }
    materialBreak = _.uniqWith(materialBreak, _.isEqual);

    const used = [];
    const total = [];
    const price = [];
    for (let s = 0; s < spools.length; s++) {
      used.push(parseFloat(spools[s].used));
      total.push(parseFloat(spools[s].weight));
      price.push(parseFloat(spools[s].price));
      const profInd = _.findIndex(profiles, function (o) {
        return o._id == spools[s].profile;
      });
      if (profInd > -1) {
        const index = _.findIndex(materialBreak, function (o) {
          return o.name == profiles[profInd].material.replace(/ /g, "_");
        });

        materialBreak[index].weight.push(parseFloat(spools[s].weight));
        materialBreak[index].used.push(parseFloat(spools[s].used));
        materialBreak[index].price.push(parseFloat(spools[s].price));
      }
    }

    const materialBreakDown = [];
    for (let m = 0; m < materialBreak.length; m++) {
      const mat = {
        name: materialBreak[m].name,
        used: materialBreak[m].used.reduce((a, b) => a + b, 0),
        total: materialBreak[m].weight.reduce((a, b) => a + b, 0),
        price: materialBreak[m].price.reduce((a, b) => a + b, 0)
      };
      materialBreakDown.push(mat);
    }
    return {
      materialList: materials.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      used: used.reduce((a, b) => a + b, 0),
      total: total.reduce((a, b) => a + b, 0),
      price: price.reduce((a, b) => a + b, 0),
      profileCount: profiles.length,
      spoolCount: spools.length,
      activeSpools: this.#selectedFilamentList,
      activeSpoolCount: this.#selectedFilamentList.length,
      materialBreakDown
    };
  }

  // TODO broken w.r.t. printerState
  getPrinterAssignment(spoolID, farmPrinters) {
    const assignments = [];
    for (let p = 0; p < farmPrinters.length; p++) {
      if (
        typeof farmPrinters[p] !== "undefined" &&
        Array.isArray(farmPrinters[p].selectedFilament)
      ) {
        for (let s = 0; s < farmPrinters[p].selectedFilament.length; s++) {
          if (farmPrinters[p].selectedFilament[s] !== null) {
            if (farmPrinters[p].selectedFilament[s]._id.toString() === spoolID.toString()) {
              const printer = {
                id: farmPrinters[p]._id,
                tool: s,
                name: farmPrinters[p].printerName
              };
              assignments.push(printer);
            }
          }
        }
      }
    }
    return assignments;
  }
}

module.exports = FilamentCache;
