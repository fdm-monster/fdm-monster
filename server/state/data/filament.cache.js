const _ = require("lodash");

class FilamentCache {
  #filamentList = [];
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

    this.#logger = loggerFactory("FilamentCache");
  }

  cacheFilaments(filaments) {
    this.#filamentList = [];
    for (let filament in filaments) {
      this.addFilament(filament);
    }

    // Legacy code
    // this.#selectedFilamentList = await this.selectedFilament(printers);
    // this.#statistics = this.createStatistics();
  }

  addFilament(filamentEntry) {
    const filamentCacheEntry = this.#mapFilamentEntryToCacheEntry(filamentEntry);
    this.#filamentList.push(filamentCacheEntry);

    return filamentCacheEntry;
  }

  listFilaments() {
    return this.#filamentList;
  }

  getStatistics() {
    return this.#statistics;
  }

  getSelected() {
    return this.#selectedFilamentList;
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

  #mapFilamentEntryToCacheEntry(document) {
    return {
      id: String(document._id),
      name: document.name,
      manufacturer: document.manufacturer,
      cost: document.cost,
      weight: document.weight,
      consumedRatio: document.consumedRatio,
      printTemperature: document.printTemperature,
      meta: document.meta
    };
  }
}

module.exports = FilamentCache;
