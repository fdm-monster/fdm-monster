jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const Printer = require("../../server/models/Printer");

let request;

const defaultRoute = `${AppConstants.apiRoute}/history`;
const statsRoute = `${defaultRoute}/stats`;
const getRoute = (id) => `${defaultRoute}/${id}`;

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  request = supertest(server);
});

beforeEach(async () => {
  Printer.deleteMany({});
});

describe("HistoryController", () => {
  it(`should allow GET on ${defaultRoute}`, async () => {
    const res = await request.get(defaultRoute).send();

    // Assert server failed
    expect(res.statusCode).toEqual(200);
  });

  it(`should allow GET on ${statsRoute}`, async () => {
    const res = await request.get(statsRoute).send();

    // Assert server failed
    expect(res.statusCode).toEqual(200);
  });

  /**
   * TODO the endpoint is weakly protected against failure
   */
  test.skip(`should 404 DELETE on ${statsRoute} for nonexisting history entry`, async () => {
    const res = await request.delete(getRoute("615f4fa37081fa06f428df90")).send();

    // Assert server failed
    expect(res.statusCode).toEqual(404);
  });
});
