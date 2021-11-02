const { configureContainer } = require("../../server/container");
const DITokens = require("../../server/container.tokens");

let service;

beforeAll(async () => {
  const container = configureContainer();
  service = container.resolve(DITokens.serverUpdateService);
});

describe("ServerUpdateService", () => {
  it("should return github releases", async () => {
    await service.syncLatestRelease(false);
    expect(service.getAirGapped()).toBeFalsy();
  });
});
