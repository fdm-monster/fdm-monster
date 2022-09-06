const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectInternalServerError } = require("../extensions");
const Printer = require("../../models/Printer");
const { createTestPrinter } = require("./test-data/create-printer");

let Model = Printer;
const defaultRoute = AppConstants.apiRoute + "/plugin/firmware-update";
const listRoute = `${defaultRoute}/`;
const scanRoute = `${defaultRoute}/scan`;
const releasesRoute = `${defaultRoute}/releases`;
const syncReleasesRoute = `${defaultRoute}/releases/sync`;
const downloadFirmwareRoute = `${defaultRoute}/download-firmware`;

let request;
let octoPrintApiService;
let taskManagerService;
let httpClient;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, octoPrintApiService, taskManagerService, httpClient } = await setupTestApp(true));
});

afterAll(async () => {
  dbHandler.closeDatabase();
});

describe("PluginFirmwareUpdateController", () => {
  it(`should be able to GET ${listRoute} empty cache`, async () => {
    const response = await request.get(listRoute).send();
    expectOkResponse(response);
  });

  it(`should be able to POST ${scanRoute} to perform scan`, async () => {
    await createTestPrinter(request);

    const response = await request.post(scanRoute).send();
    expectOkResponse(response);
  });

  // This is too intrusive still (needs fs isolation)
  test.skip(`should be able to POST ${downloadFirmwareRoute} to let server download firmware`, async () => {
    httpClient.saveMockResponse(require("./test-data/prusa-github-releases.data.json"), 200);
    const syncResponse = await request.post(syncReleasesRoute).send();
    expectOkResponse(syncResponse);
    expect(syncResponse.body).toHaveLength(16);

    const releasesResponse = await request.get(releasesRoute).send();
    expectOkResponse(releasesResponse);
    expect(releasesResponse.body).toHaveLength(16);

    httpClient.saveMockResponse([], 200, false, false);
    const response = await request.post(downloadFirmwareRoute).send();
    expectInternalServerError(response);

    const response2 = await request.post(downloadFirmwareRoute).send();
    expectOkResponse(response2);
  });
});
