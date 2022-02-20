import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants.js";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
const { setupTestApp } = testServer;
const { expectOkResponse } = extensions;
let request;
const welcomeRoute = AppConstants.apiRoute;
const getRoute = welcomeRoute;
const versionRoute = `${welcomeRoute}/version`;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request } = await setupTestApp(true));
});
describe("AppController", () => {
    it("should return welcome", async function () {
        const response = await request.get(getRoute).send();
        expect(response.body).toMatchObject({
            message: "Login not required. Please load UI instead by requesting any route with text/html Content-Type"
        });
        expectOkResponse(response);
    });
    it("should return version", async function () {
        const response = await request.get(versionRoute).send();
        expectOkResponse(response, {
            isDockerContainer: false,
            isPm2: false,
            update: {
                air_gapped: null
            }
        });
        expectOkResponse(response);
    });
});
