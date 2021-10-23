const { processResponse } = require("../../server/services/octoprint/utils/api.utils");
const { checkPluginManagerAPIDeprecation } = require("../../server/utils/compatibility.utils");
const OctoPrintApiService = require("../../server/services/octoprint/octoprint-api.service");

class OctoPrintApiMock extends OctoPrintApiService {
  #storedResponse;
  #storedStatusCode;

  #eventEmitter2;
  #logger;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    super({ settingsStore, httpClient, loggerFactory, eventEmitter2 });
    this.#eventEmitter2 = eventEmitter2;
    this.#logger = loggerFactory("OctoPrint-API-Service", false);
  }

  storeResponse(storedResponse, storedStatusCode) {
    this.#storedResponse = storedResponse;
    this.#storedStatusCode = storedStatusCode;
  }

  async #handleResponse(url, options) {
    // Validate url
    new URL(url);

    // Return mock
    return { data: this.#storedResponse, status: this.#storedStatusCode };
  }

  async getFiles(printer, recursive = false, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiGetFiles(recursive));
    const response = await this.#handleResponse(url, options);
    return processResponse(response, responseOptions);
  }

  async getFile(printer, path, responseOptions) {
    const { url, options } = this._prepareRequest(printer, this.apiFile(path));
    const response = await this.#handleResponse(url, options);
    return processResponse(response, responseOptions);
  }

  async getPluginManager(printer, responseOptions) {
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);

    const path =
      printerManagerApiCompatible || !printer.octoPrintVersion
        ? this.apiPluginManagerRepository1_6_0
        : this.apiPluginManager;
    const { url, options } = this._prepareRequest(printer, path);
    const response = await this.#handleResponse(url, options);
    return processResponse(response, responseOptions);
  }
}

module.exports = OctoPrintApiMock;
