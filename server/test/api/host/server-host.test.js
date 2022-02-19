import * as dbHandler from "../../db-handler.js";
import testServer from "../../test-server.js";
import DITokens from "../../../container.tokens";
import { AppConstants } from "../../../server.constants";
import extensions from "../../extensions.js";
const { setupTestApp } = testServer;
const { expectOkResponse, expectNotFoundResponse } = extensions;
let container;
let serverHost;
beforeAll(async () => {
    await dbHandler.connect();
    ({ container, request } = await setupTestApp(true, undefined, false));
    serverHost = container.resolve(DITokens.serverHost);
});
describe("ServerHost", () => {
    it("should be connected to mongo", () => {
        expect(serverHost.hasConnected()).toBeTruthy();
    });
    it("should hit API - skipping history redirect - for /api", async () => {
        const response = await request.get(AppConstants.apiRoute).send();
        expectOkResponse(response);
    });
    /**
     * The /test endpoint does not exist on the backed, so its rewritten to /index.html
     */
    it("should hit history redirect for /test", async () => {
        const response = await request.get("/test").set("Accept", "text/html").send();
        expectOkResponse(response);
    });
    it("should hit static file for /index.html", async () => {
        const response = await request.get("/index.html").send();
        expectOkResponse(response);
    });
});
