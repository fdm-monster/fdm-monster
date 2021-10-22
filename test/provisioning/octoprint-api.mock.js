class OctoprintApiMock {
  #settingsStore;
  #eventEmitter2;

  #storedResponse;
  #storedStatusCode;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    this.#settingsStore = settingsStore;
    this.#eventEmitter2 = eventEmitter2;
  }

  storeResponse(storedResponse,storedStatusCode) {
    this.#storedResponse = storedResponse;
    this.#storedStatusCode = storedStatusCode;
  }

  getFiles()
}
