const OctoPrintApiService = require("../../server/services/octoprint/octoprint-api.service");

class OctoPrintApiMock extends OctoPrintApiService {
  #eventEmitter2;
  _logger;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    super({ settingsStore, httpClient, loggerFactory, eventEmitter2 });
    this.#eventEmitter2 = eventEmitter2;
    this._logger = loggerFactory("OctoPrint-API-Service", false);
  }

  storeResponse(storedResponse, storedStatusCode) {
    this._httpClient.saveMockResponse(storedResponse, storedStatusCode);
  }
}

module.exports = OctoPrintApiMock;
