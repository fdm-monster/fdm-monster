const { AppConstants } = require("../../server.constants");
const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");
const dbHandler = require("../db-handler");
const GithubETag = require("../../models/GithubETag");

let container;
let service;
const v1 = "1.0.0";

beforeAll(async () => {
  await dbHandler.connect();
  container = configureContainer();
  service = container.resolve(DITokens.serverReleaseService);
});

afterAll(async () => {
  return GithubETag.deleteMany({});
});

describe("ServerUpdateService", () => {
  it("should know process version", () => {
    expect(process.env[AppConstants.VERSION_KEY]).toEqual(v1);
    expect(container.resolve(DITokens.serverVersion)).toEqual(v1);
  });

  it("should return github releases", async () => {
    await service.syncLatestRelease(false);
    expect(service.getAirGapped()).toBeFalsy();
    expect(service.getState()).toMatchObject({
      includingPrerelease: false,
      airGapped: false,
      latestRelease: expect.anything(),
      installedRelease: expect.anything(),
      serverVersion: v1,
      installedReleaseFound: true,
      updateAvailable: true,
      synced: true
    });
  });

  it("should log server update", async () => {
    await service.logServerVersionState();
  });
});
