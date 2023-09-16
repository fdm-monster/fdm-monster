import { OctoPrintApiService } from "@/services/octoprint/octoprint-api.service";

export class OctoPrintApiMock extends OctoPrintApiService {
  eventEmitter2;
  _logger;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    super({ settingsStore, httpClient, loggerFactory, eventEmitter2 });
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoPrintApiMock.name, false);
  }

  storeResponse(storedResponse, storedStatusCode) {
    this.axiosClient.saveMockResponse(storedResponse, storedStatusCode);
  }
}
