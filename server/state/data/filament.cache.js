const _ = require("lodash");
const { ValidationException } = require("../../exceptions/runtime.exceptions");

class FilamentCache {
  #filamentList = {};

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

  cacheFilaments(filamentDocs) {
    this.#filamentList = [];
    for (let filament of filamentDocs) {
      this.addFilament(filament);
    }
  }

  addFilament(filamentEntry) {
    const filamentCacheEntry = this.#mapFilamentEntryToCacheEntry(filamentEntry);
    this.#filamentList[filamentCacheEntry.id] = filamentCacheEntry;

    return filamentCacheEntry;
  }

  purgeFilament(filamentId) {
    if (!filamentId) {
      throw new ValidationException("Parameter filamentId was not provided.");
    }

    const filamentEntry = this.#filamentList[filamentId];

    if (!filamentEntry) {
      this.#logger.warning("Did not remove cached Filament as it was not found in cache");
      return;
    }

    delete this.#filamentList[filamentId];

    this.#logger.info(`Purged filamentId '${filamentId}' Filament cache`);
  }

  listFilaments() {
    return this.#filamentList;
  }

  #mapFilamentEntryToCacheEntry(document) {
    return {
      id: String(document.id),
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
