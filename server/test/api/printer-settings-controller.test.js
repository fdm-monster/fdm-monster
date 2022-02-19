import * as dbHandler from "../db-handler.js";
import { AppConstants } from "../../server.constants";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
import createPrinter from "./test-data/create-printer.js";
const { setupTestApp } = testServer;
const { expectOkResponse } = extensions;
const { createTestPrinter } = createPrinter;
const defaultRoute = `${AppConstants.apiRoute}/printer-settings`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const setGCodeAnalysisRoute = (id) => `${getRoute(id)}/gcode-analysis`;
let request;
let octoPrintApiService;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request, octoPrintApiService } = await setupTestApp(true));
});
describe("PrinterSettingsController", () => {
    it("should return printer settings from OctoPrint", async () => {
        const testPrinter = await createTestPrinter(request);
        octoPrintApiService.storeResponse({
            api: {
                allowCrossOrigin: true,
                key: "test"
            },
            appearance: {},
            feature: {}
        }, 200);
        const response = await request.get(getRoute(testPrinter.id)).send();
        expectOkResponse(response, { api: expect.any(Object) });
    });
    it("should set printer gcode settings to false on OctoPrint", async () => {
        const testPrinter = await createTestPrinter(request);
        octoPrintApiService.storeResponse({}, 200);
        const response = await request.post(setGCodeAnalysisRoute(testPrinter.id)).send({
            enabled: false
        });
        expectOkResponse(response, {});
    });
});
