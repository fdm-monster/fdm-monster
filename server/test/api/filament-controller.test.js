const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectInvalidResponse, expectOkResponse } = require("../extensions");
const DITokens = require("../../container.tokens");

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
  const badSpool = {};
  const newSpool = {
    name: "PLA",
    cost: 20.5,
    weight: 500.0,
    consumedRatio: 0.0,
    printTemperature: 215.0
  };
  const newSpoolManufacturer = {
    ...newSpool,
    manufacturer: "BigRoller"
  };

  it(`should LIST spools with ${defaultRoute}`, async () => {
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response);
  });

  it("should not create spool from incorrect input", async () => {
    const response = await request.post(createRoute).send(badSpool);
    expectInvalidResponse(
      response,
      ["name", "cost", "weight", "consumedRatio", "printTemperature"],
      true
    );
  });

  it("should create spool correctly", async () => {
    const response = await request.post(createRoute).send(newSpool);
    expectOkResponse(response, { id: expect.any(String) });
  });

  it("should create and get spool correctly", async () => {
    const response = await request.post(createRoute).send(newSpool);
    const data = expectOkResponse(response, { id: expect.any(String) });

    const getResponse = await request.get(getRoute(data.id)).send();
    expectOkResponse(getResponse, { id: data.id });
  });
});
