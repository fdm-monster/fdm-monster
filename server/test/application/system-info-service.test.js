import container from "../../container.js";
import DITokens from "../../container.tokens";
const { configureContainer } = container;
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
