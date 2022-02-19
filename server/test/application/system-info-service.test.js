const { configureContainer } = require("../../container");
const DITokens = require("../../container.tokens");

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
