import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { AxiosMock } from "./axios.mock";

export class OctoPrintApiMock extends OctoprintClient {
  eventEmitter2;

  constructor({ settingsStore, httpClient, loggerFactory, eventEmitter2 }) {
    super({ settingsStore, httpClient, loggerFactory, eventEmitter2 });
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoPrintApiMock.name, false);
  }

  storeResponse(storedResponse: any, storedStatusCode: number) {
    (this.axiosClient as unknown as AxiosMock).saveMockResponse(storedResponse, storedStatusCode);
  }
}
