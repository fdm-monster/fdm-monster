jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/server.constants");
const { setupTestApp } = require("../test-server");
const {
  expectInvalidResponse,
  expectOkResponse,
  expectNotFoundResponse
} = require("../extensions");

const defaultRoute = `${AppConstants.apiRoute}/filament`;
const getRoute = (id) => `${defaultRoute}/${id}`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {});

describe("FilamentController", () => {
  it(`should allow GET on ${defaultRoute}`, async () => {
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response);
  });
});
