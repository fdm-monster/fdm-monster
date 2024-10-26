import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { AxiosMock } from "./axios.mock";
import { SettingsStore } from "@/state/settings.store";
import { AxiosStatic } from "axios";
import { ILoggerFactory } from "@/handlers/logger-factory";
import EventEmitter2 from "eventemitter2";

export class OctoPrintApiMock extends OctoprintClient {
  eventEmitter2;

  constructor({
    settingsStore,
    httpClient,
    loggerFactory,
    eventEmitter2,
  }: {
    settingsStore: SettingsStore;
    httpClient: AxiosStatic;
    loggerFactory: ILoggerFactory;
    eventEmitter2: EventEmitter2;
  }) {
    super({ settingsStore, httpClient, loggerFactory, eventEmitter2 });
    this.eventEmitter2 = eventEmitter2;
    this.logger = loggerFactory(OctoPrintApiMock.name, false);
  }

  storeResponse(storedResponse: any, storedStatusCode: number) {
    (this.httpClient as unknown as AxiosMock).saveMockResponse(storedResponse, storedStatusCode);
  }
}
