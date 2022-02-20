import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants.js";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
const { setupTestApp } = testServer;
const { expectInvalidResponse, expectOkResponse, expectNotFoundResponse } = extensions;
const defaultRoute = `${AppConstants.apiRoute}/filament`;
const getRoute = (id) => `${defaultRoute}/${id}`;
let request;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request } = await setupTestApp(true));
});
beforeEach(async () => { });
describe("FilamentController", () => {
    it(`should allow GET on ${defaultRoute}`, async () => {
        const response = await request.get(defaultRoute).send();
        expectOkResponse(response);
    });
});
