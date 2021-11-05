const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectNotFoundResponse } = require("../extensions");
const Printer = require("../../server/models/Printer");
const { createTestHistory } = require("./test-data/create-history");
const { createTestPrinter } = require("./test-data/create-printer");
const DITokens = require("../../server/container.tokens");

const defaultRoute = `${AppConstants.apiRoute}/history`;
const statsRoute = `${defaultRoute}/stats`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const deleteRoute = (id) => `${getRoute(id)}`;
const costSettingsRoute = (id) => `${getRoute(id)}/cost-settings`;

let request;
let container;
let historyStore;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
  historyStore = container.resolve(DITokens.historyStore);
});

describe("HistoryController", () => {
  it(`should allow GET on ${defaultRoute}`, async () => {
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response);
  });

  it(`should allow GET on ${statsRoute}`, async () => {
    const response = await request.get(statsRoute).send();
    expectOkResponse(response);
  });

  it(`should allow DELETE on ${statsRoute}`, async () => {
    const printer = await createTestPrinter(request);
    const historyElement = await createTestHistory(printer.id, "testname");
    await historyStore.loadHistoryStore();
    const response = await request.delete(deleteRoute(historyElement.id)).send();
    expectOkResponse(response);
  });

  it(`should update costSettings`, async () => {
    const printer = await createTestPrinter(request);
    const historyElement = await createTestHistory(printer.id, "testname");
    await historyStore.loadHistoryStore();
    const response = await request.patch(costSettingsRoute(historyElement.id)).send();
    expectOkResponse(response);
  });

  /**
   * TODO the endpoint is weakly protected against failure
   */
  test.skip(`should 404 DELETE on ${statsRoute} for nonexisting history entry`, async () => {
    const response = await request.delete(getRoute("615f4fa37081fa06f428df90")).send();

    // Assert 404
    expectNotFoundResponse(response);
  });
});
