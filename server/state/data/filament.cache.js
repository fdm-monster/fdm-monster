const _ = require("lodash");

class FilamentCache {
  #filamentList = [];

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
  }

  addFilament(filamentEntry) {
    const filamentCacheEntry = this.#mapFilamentEntryToCacheEntry(filamentEntry);
    this.#filamentList.push(filamentCacheEntry);

    return filamentCacheEntry;
  }

  listFilaments() {
    return this.#filamentList;
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
