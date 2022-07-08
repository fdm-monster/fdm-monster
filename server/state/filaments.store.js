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
    this.#filamentCache.cacheFilaments(documents);
  }

  listFilaments() {
    return this.#filamentCache.listFilaments();
  }

  getFilament(filamentId) {
    return this.#filamentCache.getFilament(filamentId);
  }

  async addFilament(filament) {
    const entity = await this.#filamentService.create(filament);
    return this.#filamentCache.addFilament(entity);
  }

  async deleteFilament(filamentId) {
    await this.#filamentService.delete(filamentId);

    this.#filamentCache.purgeFilament(filamentId);
  }
}

module.exports = FilamentsStore;
