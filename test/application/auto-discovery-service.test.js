const { configureContainer } = require("../../server/container");
const AutoDiscoveryService = require("../../server/services/auto-discovery.service");
const DITokens = require("../../server/container.tokens");

let container;

beforeAll(async () => {
  container = configureContainer();
});

describe(AutoDiscoveryService.name, () => {
  it("should process known device structure", async () => {
    const service = container.resolve(DITokens.autoDiscoveryService);
    service.processDevice([
      {
        presentationURL: ["https://test-url.com"],
        friendlyName: ["OctoPrint device"],
        location: "the place"
      }
    ]);
  });

  it("should setup ssdp quickly", () => {
    const service = container.resolve(DITokens.autoDiscoveryService);
    service.setupSsdp();
  });
});
