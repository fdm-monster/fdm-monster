class FilamentsStore {
  #filamentCache;
  #filamentService;

  #logger;

  constructor({ filamentCache, filamentService, loggerFactory }) {
    this.#filamentCache = filamentCache;
    this.#filamentService = filamentService;
    this.#logger = loggerFactory("Server-FilamentsStore");
  }

  async loadFilamentsStore() {
    const documents = await this.#filamentService.list();

    for (const document in documents) {
      this.#filamentCache.cacheFilaments(document._doc);
    }
  }

  listFilaments() {
    return this.#filamentCache.listFilaments();
  }

  getFilament(filamentId) {
    const cachedFilaments = this.listFilaments();
    return cachedFilaments.find((filament) => filament.id === filamentId);
  }

  async addFilament(filament) {
    const entity = await this.#filamentService.create(filament);
    return this.#filamentCache.addFilament(entity._doc);
  }
}

module.exports = FilamentsStore;
