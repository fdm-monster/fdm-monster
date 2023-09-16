import { AppConstants } from "@/server.constants";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { connect } from "../db-handler";
import { asClass } from "awilix";
import { AxiosMock } from "../mocks/axios.mock";

let container;
let service;
let httpClient;
const v1 = "1.0.0";

beforeAll(async () => {
  await connect();
  container = configureContainer();
  container.register(DITokens.httpClient, asClass(AxiosMock).singleton());

  service = container.resolve(DITokens.serverReleaseService);
  httpClient = container.resolve(DITokens.httpClient);
});

describe("ServerUpdateService", () => {
  it("should know process version", () => {
    expect(process.env[AppConstants.VERSION_KEY]).toEqual(v1);
    expect(container.resolve(DITokens.serverVersion)).toEqual(v1);
  });

  it("should return github releases", async () => {
    httpClient.saveMockResponse(require("./test-data/github-releases-response.json"), 200, false);
    await service.syncLatestRelease();
    expect(service.getState()).toMatchObject({
      airGapped: null,
      installedRelease: null,
      installedReleaseFound: null,
      latestRelease: null,
      serverVersion: v1,
      updateAvailable: null,
      synced: false,
    });
  });

  it("should log server update", async () => {
    await service.logServerVersionState();
  });
});
