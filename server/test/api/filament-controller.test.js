const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const DITokens = require("../../container.tokens");
const { testBadSpool, testNewSpool } = require("../application/test-data/filament.data");

const defaultRoute = `${AppConstants.apiRoute}/filament`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const createRoute = defaultRoute;

let request;
let container;
let filamentsStore;

beforeAll(async () => {
  await dbHandler.connect();

  ({ request, container } = await setupTestApp(true));
  filamentsStore = container.resolve(DITokens.filamentsStore);
});

beforeEach(async () => {});

describe("FilamentController", () => {
  it(`should LIST spools with ${defaultRoute}`, async () => {
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response);
  });

  it("should not create spool from incorrect input", async () => {
    const response = await request.post(createRoute).send(testBadSpool);
    expectInvalidResponse(
      response,
      ["name", "cost", "weight", "consumedRatio", "printTemperature"],
      true
    );
  });

  it("should create spool correctly", async () => {
    const response = await request.post(createRoute).send(testNewSpool);
    expectOkResponse(response, { id: expect.any(String) });
  });

  it("should create and get spool correctly", async () => {
    const response = await request.post(createRoute).send(testNewSpool);
    const data = expectOkResponse(response, { id: expect.any(String) });

    const getResponse = await request.get(getRoute(data.id)).send();
    expectOkResponse(getResponse, { id: data.id });
  });
});
