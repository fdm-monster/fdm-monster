import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
import createPrinter from "./test-data/create-printer.js";
const { setupTestApp } = testServer;
const { expectOkResponse } = extensions;
const { createTestPrinter } = createPrinter;
const defaultRoute = `${AppConstants.apiRoute}/printer-profiles`;
const listRoute = (id) => `${defaultRoute}/${id}`;
const listCacheRoute = (id) => `${listRoute(id)}/cache`;
let request;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request } = await setupTestApp(true));
});
beforeEach(async () => { });
describe("PrinterProfilesController", () => {
    it(`should allow GET on ${defaultRoute}`, async () => {
        const printer = await createTestPrinter(request);
        const response = await request.get(listRoute(printer.id)).send();
        expectOkResponse(response);
    });
    it(`should allow GET on ${defaultRoute} for /cache`, async () => {
        const printer = await createTestPrinter(request);
        const response = await request.get(listCacheRoute(printer.id)).send();
        expectOkResponse(response);
    });
});
