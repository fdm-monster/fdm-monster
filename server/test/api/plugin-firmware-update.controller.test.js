const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const {
  expectInvalidResponse,
  expectOkResponse,
  expectNotFoundResponse
} = require("../extensions");
const Printer = require("../../models/Printer");

let Model = Printer;
const defaultRoute = AppConstants.apiRoute + "/plugin/firmware-update";
const listRoute = `${defaultRoute}/`;
const scanRoute = `${defaultRoute}/scan`;

let request;
let octoPrintApiService;
let taskManagerService;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService, taskManagerService } = await setupTestApp(true));
});

afterAll(async () => {
  dbHandler.closeDatabase();
});

describe("PluginFirmwareUpdateController", () => {
  it(`should be able to GET ${listRoute} empty cache`, async () => {
    const response = await request.get(listRoute).send();
    expectOkResponse(response);
  });
});
