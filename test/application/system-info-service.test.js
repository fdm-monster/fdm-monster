const { configureContainer } = require("../../server/container");
const DITokens = require("../../server/container.tokens");

let systemInfoBundleService;

beforeAll(async () => {
  const container = configureContainer();
  systemInfoBundleService = container.resolve(DITokens.systemInfoBundleService);
});

describe("SystemInfoBundleService", () => {
  it("should return valid system information bundle", async () => {
    const result = systemInfoBundleService.generateSystemInformationContents();

    expect(typeof result).toEqual("string");
  });
});
