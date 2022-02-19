import supertest from "supertest";
import awilix from "awilix";
import DITokens from "../container.tokens";
import server from "../server.core";
import server$0 from "../server.env";
import AxiosMock from "./mocks/axios.mock";
import OctoPrintApiMock from "./mocks/octoprint-api.mock";
import authorization from "../constants/authorization.constants";
const { asClass, asValue } = awilix;
const { setupNormalServer } = server;
const { setupEnvConfig } = server$0;
const { ROLES } = authorization;
/**
 * Setup the application without hassle
 * @param loadPrinterStore (default: false) setup printer store with database connection
 * @param mocks allows overriding IoC container
 * @param quick_boot skip tasks
 * @returns {Promise<{container: AwilixContainer<any>, server: Server}>}
 */
async function setupTestApp(loadPrinterStore = false, mocks = undefined, quick_boot = true) {
    setupEnvConfig(true);
    const { httpServer, container } = setupNormalServer();
    container.register({
        [DITokens.octoPrintApiService]: asClass(OctoPrintApiMock).singleton(),
        [DITokens.httpClient]: asClass(AxiosMock).singleton(),
        [DITokens.defaultRole]: asValue(ROLES.ADMIN)
    });
    // Overrides get last pick
    if (mocks)
        container.register(mocks);
    // Setup
    await container.resolve(DITokens.settingsStore).loadSettings();
    const serverHost = container.resolve(DITokens.serverHost);
    await serverHost.boot(httpServer, quick_boot, false);
    await container.resolve(DITokens.permissionService).syncPermissions();
    await container.resolve(DITokens.roleService).syncRoles();
    if (loadPrinterStore) {
        // Requires (in-memory) database connection, so its optional
        const printersStore = container.resolve(DITokens.printersStore);
        await printersStore.loadPrintersStore();
    }
    return {
        httpServer,
        request: supertest(httpServer),
        container,
        [DITokens.octoPrintApiService]: container.resolve(DITokens.octoPrintApiService)
    };
}
export { setupTestApp };
export default {
    setupTestApp
};
