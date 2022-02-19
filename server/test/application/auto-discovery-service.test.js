import container$0 from "../../container.js";
import AutoDiscoveryService from "../../services/auto-discovery.service";
import DITokens from "../../container.tokens";
const { configureContainer } = container$0;
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
