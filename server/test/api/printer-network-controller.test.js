import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
const { setupTestApp } = testServer;
const { expectOkResponse } = extensions;
const defaultRoute = `${AppConstants.apiRoute}/printer-network`;
const scanSsdpRoute = `${defaultRoute}/scan-ssdp`;
let request;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request } = await setupTestApp(true));
});
describe("PrinterNetworkController", () => {
    it("should run scan ssdp", async () => {
        const response = await request.post(scanSsdpRoute).send();
        expectOkResponse(response);
    });
});
