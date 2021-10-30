const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectNotFoundResponse } = require("../extensions");
const Printer = require("../../server/models/Printer");

const defaultRoute = `${AppConstants.apiRoute}/history`;
const statsRoute = `${defaultRoute}/stats`;
const getRoute = (id) => `${defaultRoute}/${id}`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  Printer.deleteMany({});
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

  /**
   * TODO the endpoint is weakly protected against failure
   */
  test.skip(`should 404 DELETE on ${statsRoute} for nonexisting history entry`, async () => {
    const response = await request.delete(getRoute("615f4fa37081fa06f428df90")).send();

    // Assert 404
    expectNotFoundResponse(response);
  });
});
